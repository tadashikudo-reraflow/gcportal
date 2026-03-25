/**
 * e-Gov パブリックコメント収集 PoC
 *
 * 検索パターン:
 *   1. 結果公示: 所管=デジタル庁 + KW「標準化」
 *   2. 結果公示: 所管=デジタル庁（全件）
 *   3. 過去案件: KW「基幹業務システム 標準化」AND
 *
 * Usage:
 *   npx tsx scripts/pubcom-collect.ts [--dry-run] [--pattern 1|2|3|all]
 *
 * 環境変数:
 *   GDRIVE_WORKSPACE — Google Drive workspace path
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — Supabase
 *   OPENAI_API_KEY — Embedding用
 */

import "./lib/load-env";
import { chromium, type Page, type Browser } from "playwright";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = "https://public-comment.e-gov.go.jp";
const LIST_URL = `${BASE_URL}/pcm/list`;
// DL先は Oracle RAG 体系（RAG_Data/PJ19 配下）に統一
const RAG_DATA_ROOT =
  process.env.RAG_DATA_ROOT ??
  "/Users/tadashikudo/Library/CloudStorage/GoogleDrive-tadashi.kudo@reraflow.com/マイドライブ/RAG_Data";
const OUTPUT_DIR = path.join(RAG_DATA_ROOT, "PJ19/raw/e-gov-pubcom");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

const DRY_RUN = process.argv.includes("--dry-run");
const DOWNLOAD_ONLY = process.argv.includes("--download-only");
const PATTERN_ARG = (() => {
  const idx = process.argv.indexOf("--pattern");
  return idx >= 0 ? process.argv[idx + 1] : "all";
})();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PubcomCase = {
  caseId: string;
  title: string;
  ministry: string;
  category: string;
  publishedDate: string;
  commentCount: string;
  tab: "open" | "result" | "past";
  detailUrl: string;
  pdfs: PubcomPdf[];
};

type PubcomPdf = {
  seqNo: string;
  label: string;
  url: string;
  localPath?: string;
  fileHash?: string;
};

type Manifest = {
  lastUpdated: string;
  searchPatterns: string[];
  cases: PubcomCase[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`[pubcom] ${new Date().toISOString().slice(0, 19)} ${msg}`);
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function loadManifest(): Manifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  }
  return { lastUpdated: "", searchPatterns: [], cases: [] };
}

function saveManifest(m: Manifest) {
  m.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Search: tab selection + form fill + scrape results
// ---------------------------------------------------------------------------

async function selectTab(page: Page, tabName: string) {
  // Use text selector — tab buttons contain text directly or inside <strong>
  const btn = page.locator(`button:has-text("${tabName}")`).first();
  await btn.waitFor({ state: "visible", timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(2000);
}

async function search(
  page: Page,
  opts: { keyword?: string; ministry?: string; andMode?: boolean }
) {
  // Fill keyword
  const kwInput = page.getByRole("textbox", { name: "キーワード" });
  await kwInput.fill(opts.keyword ?? "");

  if (opts.keyword) {
    // Dismiss autocomplete
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // Select ministry filter if specified
  if (opts.ministry) {
    const ministrySelect = page.locator("#hushoList");
    // Find option containing the ministry name
    const options = await ministrySelect.locator("option").all();
    for (const opt of options) {
      const text = await opt.textContent();
      if (text?.includes(opts.ministry)) {
        await ministrySelect.selectOption({ label: text });
        break;
      }
    }
  }

  // Click search
  await page.getByRole("button", { name: "検索" }).click();
  await page.waitForTimeout(2000);
}

async function getResultCount(page: Page): Promise<number> {
  const countEl = page.locator('[aria-label="一覧の件数"]');
  const text = await countEl.textContent();
  const match = text?.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

async function scrapeCurrentPage(
  page: Page,
  tab: PubcomCase["tab"]
): Promise<PubcomCase[]> {
  const cases: PubcomCase[] = [];
  const items = page.locator("main ul > li");
  const count = await items.count();

  for (let i = 0; i < count; i++) {
    const item = items.nth(i);
    const title = await item.locator("h2 a").textContent().catch(() => null);
    if (!title) continue;

    // Extract metadata fields
    const allText = await item.textContent();
    const caseIdMatch = allText?.match(/案件番号\s*(\d+)/);
    const ministryMatch = allText?.match(/所管省庁\s*([^\n]+)/);
    const categoryEl = await item.locator("div").first().textContent().catch(() => "");

    // Date extraction - varies by tab
    let publishedDate = "";
    if (tab === "result" || tab === "past") {
      const dateMatch = allText?.match(/結果の公示日\s*([\d年月日]+)/);
      publishedDate = dateMatch?.[1] ?? "";
    } else {
      const dateMatch = allText?.match(/案の公示日\s*([\d年月日]+)/);
      publishedDate = dateMatch?.[1] ?? "";
    }

    const commentMatch = allText?.match(/提出意見数\s*(\S+)/);

    cases.push({
      caseId: caseIdMatch?.[1] ?? "",
      title: title.trim(),
      ministry: ministryMatch?.[1]?.trim() ?? "",
      category: categoryEl?.trim() ?? "",
      publishedDate,
      commentCount: commentMatch?.[1] ?? "",
      tab,
      detailUrl: "",
      pdfs: [],
    });
  }

  return cases;
}

async function scrapeAllPages(
  page: Page,
  tab: PubcomCase["tab"],
  maxPages = 10
): Promise<PubcomCase[]> {
  const allCases: PubcomCase[] = [];

  // Set display count to 100
  const displaySelect = page.locator('select[aria-label="表示件数"]').first();
  if (await displaySelect.isVisible()) {
    await displaySelect.selectOption("100");
    await page.waitForTimeout(2000);
  }

  for (let p = 0; p < maxPages; p++) {
    const pageCases = await scrapeCurrentPage(page, tab);
    allCases.push(...pageCases);
    log(`  Page ${p + 1}: ${pageCases.length} cases`);

    // Check if next page exists
    const nextBtn = page.getByRole("button", { name: "次へ進む" }).first();
    const isDisabled = await nextBtn.isDisabled();
    if (isDisabled) break;
    await nextBtn.click();
    await page.waitForTimeout(2000);
  }

  return allCases;
}

// ---------------------------------------------------------------------------
// Detail page: extract PDF links
// ---------------------------------------------------------------------------

async function extractPdfsFromDetail(
  page: Page,
  caseId: string
): Promise<PubcomPdf[]> {
  const pdfs: PubcomPdf[] = [];

  // Find all download links
  const links = page.locator('a[href*="/pcm/download"]');
  const count = await links.count();

  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const href = await link.getAttribute("href");
    const label = (await link.textContent())?.trim() ?? "";
    if (!href) continue;

    const seqMatch = href.match(/seqNo=(\d+)/);
    const seqNo = seqMatch?.[1] ?? `unknown_${i}`;
    const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

    pdfs.push({ seqNo, label, url: fullUrl });
  }

  return pdfs;
}

// ---------------------------------------------------------------------------
// PDF download
// ---------------------------------------------------------------------------

async function downloadPdf(
  pdfInfo: PubcomPdf,
  caseId: string,
  publishedDate: string
): Promise<PubcomPdf> {
  const caseDir = path.join(OUTPUT_DIR, caseId);
  fs.mkdirSync(caseDir, { recursive: true });

  // Date for filename
  const dateStr =
    publishedDate.replace(/年|月/g, "-").replace(/日/g, "") ||
    new Date().toISOString().slice(0, 10);

  const fileName = `${caseId}_${pdfInfo.seqNo}_${dateStr}.pdf`;
  const filePath = path.join(caseDir, fileName);

  // Skip if already downloaded
  if (fs.existsSync(filePath)) {
    const buf = fs.readFileSync(filePath);
    log(`  [skip] Already exists: ${fileName}`);
    return { ...pdfInfo, localPath: filePath, fileHash: sha256(buf) };
  }

  if (DRY_RUN) {
    log(`  [dry-run] Would download: ${fileName} from ${pdfInfo.url}`);
    return { ...pdfInfo, localPath: filePath };
  }

  const res = await fetch(pdfInfo.url, {
    headers: {
      "User-Agent":
        "GCInsight-Scraper/1.0 (+https://gcinsight.jp)",
    },
  });

  if (!res.ok) {
    log(`  [error] Download failed: ${res.status} ${pdfInfo.url}`);
    return pdfInfo;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buf);
  const fileHash = sha256(buf);

  log(`  [saved] ${fileName} (${(buf.length / 1024).toFixed(1)}KB, hash=${fileHash.slice(0, 8)})`);
  return { ...pdfInfo, localPath: filePath, fileHash };
}

// ---------------------------------------------------------------------------
// RAG ingest (calls existing pipeline)
// ---------------------------------------------------------------------------

// TODO: Oracle RAG に移行済み
// async function ingestPdfToRag(
//   pdfInfo: PubcomPdf,
//   caseInfo: PubcomCase
// ): Promise<void> {
//   if (!pdfInfo.localPath || !fs.existsSync(pdfInfo.localPath)) {
//     log(`  [skip-rag] No local file for ${pdfInfo.seqNo}`);
//     return;
//   }
//
//   const { parsePdf } = await import("../lib/pdf-parser");
//   const { ingestDocument } = await import("../lib/rag");
//
//   const buf = fs.readFileSync(pdfInfo.localPath);
//   const { text } = await parsePdf(buf);
//
//   if (!text || text.trim().length < 50) {
//     log(`  [skip-rag] Too short after parse: ${pdfInfo.label}`);
//     return;
//   }
//
//   const { documentId, chunkCount } = await ingestDocument({ ... });
//   log(`  [rag] Ingested: docId=${documentId}, chunks=${chunkCount}, "${pdfInfo.label}"`);
// }

// ---------------------------------------------------------------------------
// Search patterns
// ---------------------------------------------------------------------------

type SearchPattern = {
  id: string;
  name: string;
  tab: PubcomCase["tab"];
  keyword?: string;
  ministry?: string;
};

const SEARCH_PATTERNS: SearchPattern[] = [
  {
    id: "1",
    name: "結果公示: デジタル庁 + 標準化",
    tab: "result",
    keyword: "標準化",
    ministry: "デジタル庁",
  },
  {
    id: "2",
    name: "結果公示: デジタル庁（全件）",
    tab: "result",
    ministry: "デジタル庁",
  },
  {
    id: "3",
    name: "過去案件: 基幹業務システム 標準化",
    tab: "past",
    keyword: "基幹業務システム 標準化",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  log("=== e-Gov パブコメ収集 PoC ===");
  log(`DRY_RUN=${DRY_RUN}, PATTERN=${PATTERN_ARG}`);
  log(`OUTPUT_DIR=${OUTPUT_DIR}`);

  const manifest = loadManifest();
  const existingIds = new Set(manifest.cases.map((c) => c.caseId));

  const browser: Browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "GCInsight-Scraper/1.0 (+https://gcinsight.jp) Playwright",
  });
  const page = await context.newPage();

  try {
    // Navigate to list page
    await page.goto(LIST_URL, { waitUntil: "networkidle" });
    log("Loaded list page");

    const patterns =
      PATTERN_ARG === "all"
        ? SEARCH_PATTERNS
        : SEARCH_PATTERNS.filter((p) => p.id === PATTERN_ARG);

    const allNewCases: PubcomCase[] = [];

    for (const pattern of patterns) {
      log(`\n--- Pattern ${pattern.id}: ${pattern.name} ---`);

      // Select tab
      const tabLabel =
        pattern.tab === "result"
          ? "結果公示案件"
          : pattern.tab === "past"
            ? "過去案件"
            : "意見募集案件";
      await selectTab(page, tabLabel);

      // Search
      await search(page, {
        keyword: pattern.keyword,
        ministry: pattern.ministry,
      });

      const totalCount = await getResultCount(page);
      log(`Hit: ${totalCount} cases`);

      if (totalCount === 0) continue;

      // Scrape case list
      const cases = await scrapeAllPages(page, pattern.tab);
      log(`Scraped: ${cases.length} cases`);

      // Dedup against manifest
      const newCases = cases.filter((c) => c.caseId && !existingIds.has(c.caseId));
      log(`New (not in manifest): ${newCases.length}`);

      allNewCases.push(...newCases);
      for (const c of newCases) existingIds.add(c.caseId);

      // Reset search for next pattern
      await page.goto(LIST_URL, { waitUntil: "networkidle" });
    }

    // Dedup by caseId
    const uniqueCases = Array.from(
      new Map(allNewCases.map((c) => [c.caseId, c])).values()
    );
    log(`\n=== Total unique new cases: ${uniqueCases.length} ===`);

    // Phase 2: Visit detail pages → extract PDFs → download → ingest
    for (const caseInfo of uniqueCases) {
      log(`\nProcessing: ${caseInfo.caseId} - ${caseInfo.title.slice(0, 60)}...`);

      // Navigate to detail page
      const detailUrl = `${BASE_URL}/servlet/Public?CLASSNAME=PCM1040&id=${caseInfo.caseId}&Mode=1`;
      caseInfo.detailUrl = detailUrl;

      await page.goto(detailUrl, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Extract PDFs
      const pdfs = await extractPdfsFromDetail(page, caseInfo.caseId);
      log(`  Found ${pdfs.length} PDFs`);

      // Download PDFs
      const downloadedPdfs: PubcomPdf[] = [];
      for (const pdf of pdfs) {
        const result = await downloadPdf(pdf, caseInfo.caseId, caseInfo.publishedDate);
        downloadedPdfs.push(result);
        await sleep(500); // polite delay
      }
      caseInfo.pdfs = downloadedPdfs;

      // TODO: Oracle RAG に移行済み
      // if (!DRY_RUN && !DOWNLOAD_ONLY) {
      //   for (const pdf of downloadedPdfs) {
      //     if (pdf.localPath) {
      //       try {
      //         await ingestPdfToRag(pdf, caseInfo);
      //       } catch (err) {
      //         log(`  [rag-error] ${err instanceof Error ? err.message : String(err)}`);
      //       }
      //     }
      //   }
      // }

      // Add to manifest
      manifest.cases.push(caseInfo);
      saveManifest(manifest);

      await sleep(1000); // polite delay between cases
    }

    // Final summary
    log("\n=== Summary ===");
    log(`Total cases in manifest: ${manifest.cases.length}`);
    log(
      `PDFs downloaded: ${manifest.cases.reduce((n, c) => n + c.pdfs.filter((p) => p.localPath).length, 0)}`
    );
    log(
      `PDFs ingested to RAG: ${manifest.cases.reduce((n, c) => n + c.pdfs.filter((p) => p.fileHash).length, 0)}`
    );

    saveManifest(manifest);
    log(`Manifest saved: ${MANIFEST_PATH}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("[pubcom] Fatal error:", err);
  process.exit(1);
});
