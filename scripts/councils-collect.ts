/**
 * デジタル庁 審議会・検討会 会議資料 収集スクリプト
 *
 * Usage:
 *   npx tsx scripts/councils-collect.ts [options]
 *
 * Options:
 *   --dry-run           DL/ingestせずリストだけ表示
 *   --download-only     DLするがRAG ingestはスキップ
 *   --slug <slug>       特定会議体のみ処理（例: local-governments）
 *   --max <n>           最大ingest件数（デフォルト: 999 = 全件）
 *   --list-councils     対象会議体の一覧を表示して終了
 *
 * 環境変数:
 *   RAG_DATA_ROOT          — Google Drive RAG_Data パス
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — Supabase
 *   OPENAI_API_KEY         — Embedding用
 */

import "./lib/load-env";
import {
  scrapeCouncils,
  fetchCouncilList,
  filterRelevantCouncils,
  loadManifest,
  log,
  MANIFEST_PATH,
  OUTPUT_DIR,
} from "../lib/councils-scraper";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const DOWNLOAD_ONLY = args.includes("--download-only");
const LIST_COUNCILS = args.includes("--list-councils");

const slugIdx = args.indexOf("--slug");
const ONLY_SLUG = slugIdx >= 0 ? args[slugIdx + 1] : undefined;

const maxIdx = args.indexOf("--max");
const MAX_INGEST = maxIdx >= 0 ? parseInt(args[maxIdx + 1], 10) : 999;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log("=== デジタル庁 審議会 会議資料収集 ===");
  log(`DRY_RUN=${DRY_RUN}, DOWNLOAD_ONLY=${DOWNLOAD_ONLY}`);
  log(`OUTPUT_DIR=${OUTPUT_DIR}`);

  // --list-councils: 対象会議体一覧だけ表示して終了
  if (LIST_COUNCILS) {
    log("Fetching council list...");
    const all = await fetchCouncilList();
    const relevant = filterRelevantCouncils(all);

    console.log("\n=== 全会議体 ===");
    all.forEach((c) => console.log(`  ${c.slug.padEnd(40)} ${c.name}`));

    console.log("\n=== フィルタ対象（ガバクラ・標準化関連） ===");
    relevant.forEach((c) => console.log(`  ✓ ${c.slug.padEnd(38)} ${c.name}`));

    console.log(`\n合計: ${all.length}件中 ${relevant.length}件が対象`);
    return;
  }

  // マニフェスト状況表示
  const manifest = loadManifest();
  log(`Manifest: ${manifest.ingested.length} PDFs already ingested`);
  if (manifest.lastUpdated) log(`Last updated: ${manifest.lastUpdated}`);
  log(`Manifest path: ${MANIFEST_PATH}`);

  // スクレイプ実行
  const result = await scrapeCouncils({
    dryRun: DRY_RUN,
    downloadOnly: DOWNLOAD_ONLY,
    onlySlug: ONLY_SLUG,
    maxIngest: MAX_INGEST,
  });

  // サマリー
  console.log("\n=== Summary ===");
  console.log(`Checked at  : ${result.checkedAt}`);
  console.log(`Councils    : ${result.relevantCouncils} / ${result.councilsChecked} (relevant/total)`);
  console.log(`Meetings    : ${result.meetingsChecked}`);
  console.log(`PDFs found  : ${result.pdfsFound}`);
  console.log(`PDFs ingested: ${result.pdfsIngested}`);
  console.log(`Manifest    : ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error("[councils] Fatal error:", err);
  process.exit(1);
});
