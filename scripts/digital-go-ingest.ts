/**
 * デジタル庁 新着情報 初回/手動 ingest スクリプト
 *
 * Usage:
 *   npx tsx scripts/digital-go-ingest.ts [--dry-run]
 *
 * --dry-run: RSSフィルタ結果を表示するだけ（ingestしない）
 *
 * 環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — Supabase
 *   OPENAI_API_KEY — Embedding用
 */

import "./lib/load-env";
import { createClient } from "@supabase/supabase-js";
import { checkDigitalGoNews } from "../lib/digital-go-rss";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log("=== デジタル庁 新着情報 ingest ===");
  console.log(`モード: ${dryRun ? "dry-run（ingestなし）" : "本番"}`);

  // 既存 guid を Supabase から取得
  const knownGuids = new Set<string>();

  if (!dryRun) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase
      .from("rag_documents")
      .select("source_url")
      .eq("organization", "デジタル庁");

    if (error) {
      console.error("Supabase取得エラー:", error.message);
      process.exit(1);
    }

    for (const doc of data ?? []) {
      if (doc.source_url) knownGuids.add(doc.source_url);
    }
    console.log(`既存デジタル庁ドキュメント: ${knownGuids.size}件`);
  }

  // RSS チェック + ingest（dry-run時は全件を"新規"として表示のみ）
  const result = await checkDigitalGoNews(dryRun ? new Set() : knownGuids);

  console.log(`\nRSS取得: ${result.totalItems}件`);
  console.log(`フィルタ後（PJ19関連）: ${result.filteredItems}件`);
  console.log(`新規検出: ${result.newItems.length}件`);

  if (result.newItems.length > 0) {
    console.log("\n--- 新規記事一覧 ---");
    for (const item of result.newItems) {
      console.log(`  [${item.category}] ${item.pubDate}`);
      console.log(`  タイトル: ${item.title}`);
      console.log(`  URL: ${item.link}`);
      console.log();
    }
  }

  if (!dryRun) {
    console.log(`ingest完了: ${result.ingestedCount}件`);
  } else {
    console.log("（dry-runのため ingest スキップ）");
    console.log(
      "本番実行するには: npx tsx scripts/digital-go-ingest.ts"
    );
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
