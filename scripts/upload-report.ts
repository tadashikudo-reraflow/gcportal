#!/usr/bin/env tsx
/**
 * GCInsight レポートPDF → Supabase Storage アップロードスクリプト
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/upload-report.ts
 *   または .env.local を読み込む場合:
 *   npx dotenv -e .env.local -- npx tsx scripts/upload-report.ts
 *
 * 必要な Supabase 設定:
 *   - Storage バケット "reports" を作成（Public: false）
 *   - RLS: service_role でアップロード可能であれば OK
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GDRIVE = process.env.GDRIVE_WORKSPACE;
const PDF_PATH = GDRIVE
  ? `${GDRIVE}/contents/PJ19/report-pdf/report-2026.pdf`
  : resolve(__dirname, "../../report-pdf/report-2026.pdf");

const STORAGE_BUCKET = "reports";
const STORAGE_PATH = "report-2026.pdf";

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です");
    process.exit(1);
  }

  if (!existsSync(PDF_PATH)) {
    console.error("❌ PDFファイルが見つかりません:", PDF_PATH);
    console.error("   先に scripts/generate-report-pdf.mjs を実行してください");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // バケット存在確認 → なければ作成
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

  if (!bucketExists) {
    console.log(`📦 バケット "${STORAGE_BUCKET}" を作成します...`);
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
    if (error) {
      console.error("❌ バケット作成失敗:", error.message);
      process.exit(1);
    }
    console.log(`✅ バケット "${STORAGE_BUCKET}" 作成完了`);
  }

  // PDF 読み込み & アップロード
  const pdfBuffer = readFileSync(PDF_PATH);
  console.log(`📄 PDFサイズ: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);
  console.log(`⬆️  Supabase Storage にアップロード中: ${STORAGE_BUCKET}/${STORAGE_PATH}`);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(STORAGE_PATH, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true, // 既存ファイルを上書き
    });

  if (uploadError) {
    console.error("❌ アップロード失敗:", uploadError.message);
    process.exit(1);
  }

  // 動作確認: signed URL を発行してみる
  const { data: signedData, error: signedError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(STORAGE_PATH, 3600);

  if (signedError) {
    console.error("⚠️  signed URL 発行失敗:", signedError.message);
  } else {
    console.log("✅ アップロード完了！");
    console.log("🔗 signed URL (1h TTL):", signedData.signedUrl);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
