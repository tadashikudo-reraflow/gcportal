/**
 * Supabase から digital-go-councils を削除
 * 今回誤って投入した183件を完全削除する
 *
 * Usage: npx tsx scripts/delete-councils-supabase.ts [--dry-run]
 */
import "./lib/load-env";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log(`[delete-councils] DRY_RUN=${DRY_RUN}`);

  // 対象ドキュメントを検索（metadata->source = 'digital-go-councils'）
  const { data: docs, error } = await supabase
    .from("rag_documents")
    .select("id, title, chunk_count")
    .eq("metadata->>source", "digital-go-councils");

  if (error) throw new Error(`Query failed: ${error.message}`);
  if (!docs || docs.length === 0) {
    console.log("対象ドキュメントなし。削除不要。");
    return;
  }

  console.log(`対象: ${docs.length} ドキュメント`);
  const totalChunks = docs.reduce((n, d) => n + (d.chunk_count ?? 0), 0);
  console.log(`チャンク合計: 約${totalChunks}件`);

  if (DRY_RUN) {
    console.log("[dry-run] 削除をスキップ");
    docs.slice(0, 5).forEach((d) => console.log(`  id=${d.id} ${d.title?.slice(0, 60)}`));
    return;
  }

  const ids = docs.map((d) => d.id);

  // rag_chunks を先に削除（外部キー制約対応）
  const { error: chunkErr } = await supabase
    .from("rag_chunks")
    .delete()
    .in("document_id", ids);
  if (chunkErr) throw new Error(`Chunks delete failed: ${chunkErr.message}`);
  console.log(`✅ rag_chunks 削除完了`);

  // rag_documents を削除
  const { error: docErr } = await supabase
    .from("rag_documents")
    .delete()
    .in("id", ids);
  if (docErr) throw new Error(`Documents delete failed: ${docErr.message}`);
  console.log(`✅ rag_documents ${docs.length}件 削除完了`);
}

main().catch((e) => { console.error(e); process.exit(1); });
