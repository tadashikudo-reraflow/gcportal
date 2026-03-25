#!/usr/bin/env node
/**
 * GCInsight 無料レポート PDF 生成スクリプト
 * Markdown + 図解画像 → Playwright → A4 PDF
 *
 * Usage:
 *   node scripts/generate-report-pdf.mjs
 *
 * 出力: $GDRIVE_WORKSPACE/contents/PJ19/report-pdf/report-2026.pdf
 *
 * 依存: playwright（既存）, gray-matter（既存）, marked（既存）
 */

import { chromium } from "playwright";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_DIR =
  process.env.GDRIVE_WORKSPACE
    ? `${process.env.GDRIVE_WORKSPACE}/contents/PJ19/report-pdf`
    : resolve(__dirname, "../../report-pdf");

const MD_PATH = resolve(REPORT_DIR, "report-2026-draft.md");
const IMG_DIR = resolve(REPORT_DIR, "images");
const OUT_PDF = resolve(REPORT_DIR, "report-2026.pdf");

// 図解の埋め込み位置（本文中の見出し直後に挿入）
const FIGURE_INSERTS = [
  {
    after: "## エグゼクティブサマリー",
    imgFile: "fig1-progress-donut.jpeg",
    caption: "図1：ガバメントクラウド移行進捗（2026年1月末時点）",
  },
  {
    after: "### 3-1.",
    imgFile: "fig2-cost-bar.jpeg",
    caption: "図2：自治体規模別コスト増加率（GCInsight編集部推計）",
  },
  {
    after: "## 第1章",
    imgFile: "fig3-migration-flow.jpeg",
    caption: "図3：標準化スキーム全体像",
  },
];

function imgToBase64(filePath) {
  if (!existsSync(filePath)) return null;
  const buf = readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function buildToc(mdContent) {
  const { content } = matter(mdContent);
  const lines = content.split("\n");
  const items = [];
  for (const line of lines) {
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].trim();
    // 付録・FAQ・コラム・編集後記は除外しない（全部入れるとページが増えすぎるので h1/h2 のみ）
    if (level > 2) continue;
    items.push({ level, text });
  }

  const rows = items
    .map((item) => {
      const indent = item.level === 2 ? "padding-left:6mm;" : "";
      const size = item.level === 1 ? "font-size:10pt;font-weight:bold;" : "font-size:9pt;";
      return `<div style="${indent}${size}margin:1.5mm 0;color:#1e3a5f;">${item.text}</div>`;
    })
    .join("");

  return `
<div class="toc" style="page-break-after:always;padding:10mm 0;">
  <h2 style="font-size:14pt;color:#1e3a5f;border-left:4px solid #e07b39;padding-left:4mm;margin-bottom:6mm;">目次</h2>
  ${rows}
</div>`;
}

function buildHtml(mdContent) {
  const { content } = matter(mdContent);
  const toc = buildToc(mdContent);

  // marked でHTML変換
  let html = marked.parse(content);

  // 図解を挿入（該当見出しの直後に <figure> タグを埋め込む）
  for (const fig of FIGURE_INSERTS) {
    const b64 = imgToBase64(resolve(IMG_DIR, fig.imgFile));
    if (!b64) continue;
    const figHtml = `
<figure class="report-fig">
  <img src="${b64}" alt="${fig.caption}" />
  <figcaption>${fig.caption}</figcaption>
</figure>`;
    // 見出しテキストを含む <h2> or <h3> タグの直後に挿入
    const escaped = fig.after
      .replace(/^#+\s*/, "")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(
      new RegExp(`(<h[23][^>]*>[^<]*${escaped}[^<]*</h[23]>)`),
      `$1${figHtml}`
    );
  }

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 22mm 18mm;
  }

  * { box-sizing: border-box; }

  body {
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;
    font-size: 10pt;
    line-height: 1.8;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
  }

  /* 表紙 */
  .cover {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    min-height: 240mm;
    padding: 20mm 0;
    border-bottom: 4px solid #1e3a5f;
  }
  .cover-label {
    font-size: 9pt;
    color: #e07b39;
    font-weight: bold;
    letter-spacing: 0.1em;
    margin-bottom: 8mm;
    text-transform: uppercase;
  }
  .cover-title {
    font-size: 24pt;
    font-weight: bold;
    color: #1e3a5f;
    line-height: 1.3;
    margin-bottom: 6mm;
  }
  .cover-subtitle {
    font-size: 14pt;
    color: #444;
    margin-bottom: 12mm;
  }
  .cover-meta {
    font-size: 9pt;
    color: #888;
  }
  .cover-badge {
    display: inline-block;
    background: #1e3a5f;
    color: white;
    font-size: 9pt;
    padding: 3px 10px;
    border-radius: 3px;
    margin-top: 10mm;
  }

  h1 { font-size: 18pt; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 3mm; margin-top: 12mm; }
  h2 { font-size: 14pt; color: #1e3a5f; border-left: 4px solid #e07b39; padding-left: 4mm; margin-top: 10mm; }
  h3 { font-size: 11pt; color: #2c5282; margin-top: 7mm; }
  h4 { font-size: 10pt; color: #444; margin-top: 5mm; }

  p { margin: 3mm 0; }

  blockquote {
    background: #f4f7fb;
    border-left: 4px solid #1e3a5f;
    margin: 4mm 0;
    padding: 3mm 6mm;
    font-size: 9.5pt;
    color: #333;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 4mm 0;
    font-size: 9pt;
    page-break-inside: avoid;
  }
  th {
    background: #1e3a5f;
    color: white;
    padding: 2mm 3mm;
    text-align: left;
    font-weight: bold;
  }
  td { padding: 2mm 3mm; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) td { background: #f8f9fa; }

  ul, ol { margin: 3mm 0; padding-left: 6mm; }
  li { margin: 1.5mm 0; }

  code {
    background: #f0f4f8;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 8.5pt;
    font-family: "SFMono-Regular", "Consolas", monospace;
  }

  pre {
    background: #1e3a5f;
    color: #e2e8f0;
    padding: 4mm;
    border-radius: 4px;
    font-size: 8pt;
    overflow-x: auto;
  }

  .report-fig {
    text-align: center;
    margin: 6mm 0;
    page-break-inside: avoid;
  }
  .report-fig img {
    max-width: 100%;
    max-height: 90mm;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  }
  figcaption {
    font-size: 8.5pt;
    color: #666;
    margin-top: 2mm;
    font-style: italic;
  }

  hr {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin: 8mm 0;
  }

  strong { color: #1e3a5f; }

  /* エグゼクティブサマリーの強調ボックス */
  .summary-box {
    background: #f0f4ff;
    border: 1px solid #c3d0e8;
    border-radius: 6px;
    padding: 4mm 6mm;
    margin: 4mm 0;
  }
</style>
</head>
<body>

<!-- 表紙 -->
<div class="cover">
  <div class="cover-label">GCInsight 無料レポート 2026</div>
  <div class="cover-title">ガバメントクラウド移行<br>全実態レポート 2026</div>
  <div class="cover-subtitle">1,741自治体の進捗・コスト・リスクを完全解説</div>
  <div class="cover-meta">
    GCInsight編集部 / 2026年3月発行<br>
    データ基準日：2026年1月末
  </div>
  <div class="cover-badge">FREE REPORT — gcinsight.jp</div>
</div>

<!-- 目次 -->
${toc}

<!-- 本文 -->
${html}

</body>
</html>`;
}

async function main() {
  console.log("📄 レポートMD読み込み:", MD_PATH);
  const mdContent = readFileSync(MD_PATH, "utf-8");
  const htmlContent = buildHtml(mdContent);

  console.log("🌐 Playwright起動...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: "networkidle" });

  console.log("📑 PDF生成中...");
  await page.pdf({
    path: OUT_PDF,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", right: "18mm", bottom: "22mm", left: "18mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:8pt;color:#aaa;width:100%;text-align:center;">GCInsight — ガバメントクラウド移行 全実態レポート 2026</div>`,
    footerTemplate: `<div style="font-size:8pt;color:#aaa;width:100%;text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
  });

  await browser.close();
  console.log("✅ PDF出力完了:", OUT_PDF);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
