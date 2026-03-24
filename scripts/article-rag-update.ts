/**
 * RAGを使った記事アップデートスクリプト
 *
 * 指定記事の本文をSupabaseから取得し、
 * Oracle RAG (04_search.py) で関連する最新情報を検索して表示。
 *
 * Usage: jiti scripts/article-rag-update.ts <slug>
 *        jiti scripts/article-rag-update.ts --all   (全記事スキャン)
 */
import * as path from "path";
import { execSync } from "child_process";
import "./lib/load-env";

import { createClient } from "@supabase/supabase-js";

// Oracle RAG パイプラインのパス
const RAG_PROJECT = path.join(
  process.env.HOME ?? "",
  "workspace/pj/digital-go-jp-rag"
);
const SEARCH_SCRIPT = path.join(RAG_PROJECT, "04_search.py");
const VENV_PYTHON = path.join(RAG_PROJECT, ".venv/bin/python3");

interface OracleRagResult {
  chunk_id: number;
  title: string;
  url: string;
  section: string;
  text: string;
  similarity: number;
}

function searchOracleRag(query: string, topK: number = 8): OracleRagResult[] {
  try {
    const stdout = execSync(
      `${VENV_PYTHON} ${SEARCH_SCRIPT} --json --top-k ${topK} "${query.replace(/"/g, '\\"')}"`,
      {
        cwd: RAG_PROJECT,
        timeout: 60_000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );
    // JSON出力行を抽出（stderr等を除外）
    const lines = stdout.trim().split("\n");
    const jsonLine = lines.find((l) => l.startsWith("["));
    if (!jsonLine) return [];
    return JSON.parse(jsonLine) as OracleRagResult[];
  } catch (err) {
    console.error(`Oracle RAG検索エラー: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: jiti scripts/article-rag-update.ts <slug|--all>");
  process.exit(1);
}

async function processArticle(article: { slug: string; title: string; content: string; date: string; tags: string[] }) {
  console.log(`\n=== 記事: ${article.title} ===`);
  console.log(`slug: ${article.slug}`);
  console.log(`日付: ${article.date}`);
  console.log(`文字数: ${article.content?.length ?? 0}字\n`);

  // 記事タイトル+タグでOracle RAG検索（複数クエリ）
  const queries = [
    article.title,
    ...(article.tags ?? []).slice(0, 2),
    `${article.title} 最新 2026`,
  ];

  const seen = new Set<string>();
  const allResults: OracleRagResult[] = [];

  for (const q of queries) {
    console.log(`検索中: "${q}"`);
    const results = searchOracleRag(q, 5);
    for (const r of results) {
      const key = r.text.slice(0, 80);
      if (!seen.has(key)) {
        seen.add(key);
        allResults.push(r);
      }
    }
  }

  // similarity降順でソート、上位8件
  allResults.sort((a, b) => b.similarity - a.similarity);
  const top = allResults.slice(0, 8);

  console.log(`\nOracle RAG検索結果 (top ${top.length}件):`);
  for (const r of top) {
    console.log(`  [${r.similarity.toFixed(4)}] ${r.title}`);
    console.log(`    ${r.text.slice(0, 100).replace(/\n/g, " ")}...`);
    if (r.url) console.log(`    → ${r.url}`);
    console.log();
  }

  // 有用な結果があるか判定（similarity >= 0.6）
  const useful = top.filter((r) => r.similarity >= 0.6);
  if (useful.length === 0) {
    console.log("→ similarity 0.6以上の関連チャンクなし。アップデート不要。");
    return { slug: article.slug, title: article.title, updateNeeded: false, topResults: [] };
  }

  console.log(`→ ${useful.length}件の関連情報あり。アップデート候補。`);
  return {
    slug: article.slug,
    title: article.title,
    updateNeeded: true,
    topResults: useful.map((r) => ({
      title: r.title,
      url: r.url,
      similarity: r.similarity,
      preview: r.text.slice(0, 200),
    })),
  };
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (slug === "--all") {
    // 全記事スキャン
    const { data: articles, error } = await sb
      .from("articles")
      .select("slug, title, content, date, tags")
      .order("created_at", { ascending: false });

    if (error || !articles?.length) {
      console.error("記事取得エラー:", error?.message ?? "記事0件", "URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30));
      process.exit(1);
    }

    console.log(`全${articles.length}記事をスキャン...\n`);
    const results = [];
    for (const a of articles) {
      const r = await processArticle(a);
      results.push(r);
    }

    console.log("\n" + "=".repeat(60));
    console.log("サマリー:");
    const needUpdate = results.filter((r) => r.updateNeeded);
    console.log(`  更新候補: ${needUpdate.length}/${results.length}件`);
    for (const r of needUpdate) {
      console.log(`  - ${r.title} (${r.topResults.length}件の関連情報)`);
    }
  } else {
    // 単一記事
    const { data: article, error } = await sb
      .from("articles")
      .select("slug, title, content, date, tags")
      .eq("slug", slug)
      .single();

    if (error || !article) {
      console.error(`記事が見つかりません: ${slug}`);
      process.exit(1);
    }

    await processArticle(article);
  }
}

main().catch(console.error);
