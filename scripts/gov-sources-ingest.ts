/**
 * GOV_DATA_SOURCES 全件 RAG ingest スクリプト
 *
 * scrape_jobs テーブルへの登録と processScrapeJob を連続実行。
 * 既存レコードは source_key で重複チェックして skip。
 *
 * Usage: jiti scripts/gov-sources-ingest.ts [--dry-run]
 */
import "./lib/load-env";
import { createClient } from "@supabase/supabase-js";
import { GOV_DATA_SOURCES, processScrapeJob } from "../lib/scrape-pipeline";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  console.log("=== GOV_DATA_SOURCES RAG ingest ===");
  console.log(`モード: ${dryRun ? "dry-run" : "本番"}`);
  console.log(`対象ソース数: ${GOV_DATA_SOURCES.length}件\n`);

  for (const src of GOV_DATA_SOURCES) {
    console.log(`[${src.priority}] ${src.key}`);
    console.log(`    ${src.name}`);
    console.log(`    URL: ${src.url}`);
    if (dryRun) { console.log(); continue; }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 既存ジョブ確認
    const { data: existing } = await sb
      .from("scrape_jobs")
      .select("id, status")
      .eq("source_key", src.key)
      .limit(1)
      .single();

    let jobId: number;

    if (existing) {
      // 既存ジョブを pending に戻して再実行
      await sb
        .from("scrape_jobs")
        .update({ status: "pending", error_message: null })
        .eq("id", existing.id);
      jobId = existing.id;
      console.log(`    → 既存ジョブ #${jobId} (${existing.status}) → pending にリセット`);
    } else {
      // 新規登録
      const { data: newJob, error } = await sb
        .from("scrape_jobs")
        .insert({
          source_key: src.key,
          url: src.url,
          status: "pending",
        })
        .select("id")
        .single();

      if (error || !newJob) {
        console.log(`    → ジョブ登録失敗: ${error?.message}`);
        console.log();
        continue;
      }
      jobId = newJob.id;
      console.log(`    → 新規ジョブ #${jobId} 登録`);
    }

    // 処理実行
    try {
      console.log(`    → 処理開始...`);
      await processScrapeJob(jobId);

      // 結果確認
      const { data: result } = await sb
        .from("scrape_jobs")
        .select("status, error_message, result_document_id")
        .eq("id", jobId)
        .single();

      const docInfo = result?.result_document_id
        ? ` → doc_id: ${result.result_document_id}`
        : "";
      console.log(`    → 完了: ${result?.status}${docInfo}`);
      if (result?.error_message) console.log(`    ⚠ ${result.error_message}`);
    } catch (err) {
      console.log(`    → エラー: ${err instanceof Error ? err.message : String(err)}`);
    }

    console.log();

    // Rate limit 対策で3秒待機
    await new Promise((r) => setTimeout(r, 3000));
  }

  console.log("=== 完了 ===");
}

main().catch(console.error);
