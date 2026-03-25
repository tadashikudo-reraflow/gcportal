#!/usr/bin/env tsx
/**
 * GCInsight PDF 自動アップロードウォッチャー
 *
 * PDFファイルの変更を検知して Supabase Storage に自動アップロードする。
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/watch-pdf.ts
 *
 * または package.json の scripts に追加して:
 *   npm run watch-pdf
 */

import { watch } from "fs";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const GDRIVE = process.env.GDRIVE_WORKSPACE;
const PDF_PATH = GDRIVE
  ? `${GDRIVE}/contents/PJ19/report-pdf/report-2026.pdf`
  : resolve(__dirname, "../../report-pdf/report-2026.pdf");

if (!existsSync(PDF_PATH)) {
  console.error("❌ PDFファイルが見つかりません:", PDF_PATH);
  process.exit(1);
}

console.log("👀 PDF監視を開始しました");
console.log("   対象:", PDF_PATH);
console.log("   変更を検知したら自動でSupabase Storageにアップロードします");
console.log("   停止: Ctrl+C\n");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function upload() {
  console.log("📄 変更を検知 → アップロード開始...");
  try {
    execSync("npx tsx scripts/upload-report.ts", {
      stdio: "inherit",
      cwd: resolve(__dirname, ".."),
      env: process.env,
    });
  } catch {
    console.error("❌ アップロードに失敗しました");
  }
}

// Google Drive のファイルは change イベントが複数回発火する場合があるため debounce
watch(PDF_PATH, (eventType) => {
  if (eventType !== "change") return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(upload, 1500);
});

// 初回: 起動時に即時アップロード（ファイルが更新済みの場合に対応）
console.log("🚀 起動時アップロード（最新版を確認中）...");
upload();
