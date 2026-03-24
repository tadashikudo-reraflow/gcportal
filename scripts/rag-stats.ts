/**
 * RAG統計 + scrape_jobs状況 + 記事一覧確認
 * Usage: jiti scripts/rag-stats.ts
 */
import "./lib/load-env";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // RAG docs breakdown (全ステータス)
  const { data: docs } = await sb
    .from("rag_documents")
    .select("organization, category, status, chunk_count");

  const byOrg: Record<string, { indexed: number; error: number; chunks: number }> = {};
  for (const d of docs ?? []) {
    const k = d.organization ?? "(unknown)";
    if (!byOrg[k]) byOrg[k] = { indexed: 0, error: 0, chunks: 0 };
    if (d.status === "indexed") { byOrg[k].indexed++; byOrg[k].chunks += d.chunk_count ?? 0; }
    if (d.status === "error") byOrg[k].error++;
  }

  console.log("=== RAG Documents by Organization ===");
  let totalDocs = 0, totalChunks = 0;
  for (const [org, s] of Object.entries(byOrg).sort((a, b) => b[1].chunks - a[1].chunks)) {
    const errNote = s.error > 0 ? ` ⚠ error:${s.error}件` : "";
    console.log(`  ${org}: indexed ${s.indexed}件 / ${s.chunks}チャンク${errNote}`);
    totalDocs += s.indexed; totalChunks += s.chunks;
  }
  console.log(`  ─────────────────────────────`);
  console.log(`  合計: ${totalDocs}件 / ${totalChunks}チャンク`);

  // scrape_jobs status
  const { data: jobs } = await sb
    .from("scrape_jobs")
    .select("source_key, status, error_message, processed_at")
    .order("source_key");

  if (jobs && jobs.length > 0) {
    console.log("\n=== scrape_jobs ===");
    for (const j of jobs)
      console.log(`  [${j.status}] ${j.source_key} (${j.processed_at?.slice(0,10) ?? "未処理"})`);
  } else {
    console.log("\n=== scrape_jobs: 0件（未登録）===");
  }

  // Articles list
  const { data: articles } = await sb
    .from("articles")
    .select("slug, title, date, is_published, updated_at")
    .order("date", { ascending: false });

  console.log(`\n=== Articles (${articles?.length}件) ===`);
  for (const a of articles ?? []) {
    const status = a.is_published ? "公開" : "下書";
    console.log(`  [${status}] ${a.date} | ${a.slug}`);
    console.log(`         ${a.title}`);
  }
}

main().catch(console.error);
