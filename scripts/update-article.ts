/**
 * RAGデータを使って記事を更新するスクリプト
 *
 * Usage: jiti scripts/update-article.ts <slug> [--show-only]
 *   --show-only: 更新内容を表示するだけ（DBには書き込まない）
 */
import "./lib/load-env";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const slug = process.argv[2];
const showOnly = process.argv.includes("--show-only");

if (!slug) {
  console.error("Usage: jiti scripts/update-article.ts <slug> [--show-only]");
  process.exit(1);
}

/** Oracle RAG 検索（04_search.py 経由） */
function searchOracleRag(
  query: string,
  topK = 5
): { text: string; title: string; url: string; distance: number }[] {
  const ORACLE_RAG_DIR = path.join(
    process.env.HOME ?? "/Users/tadashikudo",
    "workspace/pj/digital-go-jp-rag"
  );
  try {
    const cmd = `cd "${ORACLE_RAG_DIR}" && source .venv/bin/activate && python3 -c "
import json, sys
sys.path.insert(0, '.')
from importlib import import_module
search_mod = import_module('04_search')
results = search_mod.search('${query.replace(/'/g, "\\'")}', top_k=${topK})
print(json.dumps(results, ensure_ascii=False))
"`;
    const out = execSync(cmd, { shell: "/bin/zsh", timeout: 60000, encoding: "utf-8" });
    return JSON.parse(out.trim());
  } catch (e) {
    console.error(`  Oracle RAG検索エラー: ${e instanceof Error ? e.message : e}`);
    return [];
  }
}

// 記事ごとの検索クエリ設定
const ARTICLE_QUERIES: Record<string, string[]> = {
  "gc-data-column-cost-breakdown": [
    "ガバメントクラウド移行後 運用経費 増加要因 費用内訳",
    "ガバメントクラウド料 見積精査 削減効果",
    "自治体システム標準化 コスト対策 2026",
  ],
  "govcloud-basics": [
    "ガバメントクラウド 公共SaaS とは 定義",
    "ガバメントクラウド 自治体 標準化 意義",
    "ガバクラ CSP 選定 利用メリット",
  ],
  "gc-resident-tax-delay": [
    "個人住民税 データ要件 連携要件 標準仕様書",
    "住民税 標準仕様書 FAQ 更新 2026",
    "地方公共団体 税務 ガバメントクラウド 移行 遅延",
  ],
  "gc-data-column-migration-overview": [
    "ガバメントクラウド移行 完了率 自治体 2026",
    "運用経費対策 WT 取り組み状況 2026年3月",
    "標準化 移行支援 デジタル庁 最新",
  ],
  "gc-data-column-816-karakuri": [
    "ガバメントクラウド移行 40ステップ 完了判定 プロセス",
    "自治体標準化 移行完了 判定基準 進捗管理",
    "ガバクラ 移行作業 工程 ステップ 手順",
  ],
  "gc-tokutei-vs-delay": [
    "特定移行支援システム 遅延 違い 定義",
    "地方公共団体 標準化 期限延長 特例 要件",
    "ガバメントクラウド 移行期限 経過措置 条件",
  ],
};

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: article } = await sb
    .from("articles")
    .select("slug, title, content, date, tags, updated_at")
    .eq("slug", slug)
    .single();

  if (!article) { console.error(`記事不明: ${slug}`); process.exit(1); }

  console.log(`=== 更新対象: ${article.title} ===`);
  console.log(`最終更新: ${article.updated_at?.slice(0, 10)}\n`);

  // Oracle RAG検索（ローカル 172,427チャンク）
  const queries = ARTICLE_QUERIES[slug] ?? [article.title];
  // 距離のしきい値（小さいほど類似）。分析系記事は緩め。
  const LOOSE_THRESHOLD_SLUGS = new Set([
    "gc-data-column-816-karakuri",
    "gc-tokutei-vs-delay",
  ]);
  const distThreshold = LOOSE_THRESHOLD_SLUGS.has(slug) ? 0.20 : 0.15;

  const seen = new Set<string>();
  const hits: { content: string; doc_title: string; source_url: string | null; similarity: number }[] = [];

  for (const q of queries) {
    const results = searchOracleRag(q, 5);
    for (const r of results) {
      const key = r.text.slice(0, 50);
      if (!seen.has(key) && r.distance <= distThreshold) {
        seen.add(key);
        hits.push({
          content: r.text,
          doc_title: r.title,
          source_url: r.url,
          similarity: 1 - r.distance, // cosine distance → similarity
        });
      }
    }
  }

  hits.sort((a, b) => b.similarity - a.similarity);
  const top = hits.slice(0, 6);

  if (top.length === 0) {
    console.log("関連情報なし。スキップ。");
    return;
  }

  // 「最新情報・関連資料」セクションを生成
  const today = new Date().toISOString().slice(0, 10);

  // ソース別にグループ化（重複URL排除）
  const sourceMap = new Map<string, { title: string; url: string; excerpts: string[] }>();
  for (const h of top) {
    const url = h.source_url ?? h.doc_title;
    if (!sourceMap.has(url)) {
      sourceMap.set(url, { title: h.doc_title.replace(/^\[.*?\] /, ""), url, excerpts: [] });
    }
    const excerpt = h.content.slice(0, 200).replace(/\n+/g, " ").trim();
    sourceMap.get(url)!.excerpts.push(excerpt);
  }

  // 追記セクション生成
  let updateSection = `\n\n---\n\n## 最新情報アップデート（${today}）\n\n`;
  updateSection += `*本セクションは公式ドキュメント・パブリックコメント資料より自動補足した情報です。*\n\n`;

  for (const [, src] of sourceMap) {
    const shortTitle = src.title.slice(0, 60);
    updateSection += `### ${shortTitle}\n\n`;
    // 最も代表的な抜粋を1つ表示
    const excerpt = src.excerpts[0].slice(0, 300);
    updateSection += `> ${excerpt}...\n\n`;
    if (src.url.startsWith("http")) {
      updateSection += `**出典**: [${shortTitle}](${src.url})\n\n`;
    }
  }

  // 既存のアップデートセクションがあれば置換、なければ追記
  const existingContent: string = article.content ?? "";
  const updateMarker = "\n\n---\n\n## 最新情報アップデート";
  let newContent: string;
  if (existingContent.includes(updateMarker)) {
    newContent = existingContent.slice(0, existingContent.indexOf(updateMarker)) + updateSection;
  } else {
    newContent = existingContent + updateSection;
  }

  console.log("=== 追記内容（プレビュー） ===");
  console.log(updateSection.slice(0, 800) + (updateSection.length > 800 ? "\n...(truncated)" : ""));

  if (showOnly) {
    console.log("\n→ --show-only モード。DBへの書き込みなし。");
    return;
  }

  // Supabase更新
  const { error } = await sb
    .from("articles")
    .update({
      content: newContent,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) {
    console.error("更新失敗:", error.message);
    process.exit(1);
  }

  console.log(`\n✓ 記事更新完了: ${slug} (+${newContent.length - existingContent.length}字)`);
}

main().catch(console.error);
