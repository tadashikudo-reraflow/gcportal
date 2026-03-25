/**
 * デジタル庁 審議会・検討会 会議資料スクレイパー + RAG ingest
 *
 * 対象: https://www.digital.go.jp/councils 配下の
 *       ガバメントクラウド・標準化関連会議体のみ
 *
 * フロー:
 *   1. /councils → 会議体一覧取得 → キーワードフィルタ
 *   2. /councils/{slug} → 各回リンク一覧取得
 *   3. /councils/{slug}/{uuid} → PDF/Excelリンク抽出
 *   4. PDF DL → parsePdf → ingestDocument（重複はmanifestで排除）
 *
 * Playwright不要（静的HTML fetch）
 */

import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
import type { DocumentCategory } from "./rag";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = "https://www.digital.go.jp";
const COUNCILS_URL = `${BASE_URL}/councils`;
const USER_AGENT = "GCInsight-Scraper/1.0 (+https://gcinsight.jp)";

const RAG_DATA_ROOT =
  process.env.RAG_DATA_ROOT ??
  "/Users/tadashikudo/Library/CloudStorage/GoogleDrive-tadashi.kudo@reraflow.com/マイドライブ/RAG_Data";
export const OUTPUT_DIR = path.join(RAG_DATA_ROOT, "PJ19/raw/digital-go-councils");
export const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

/** 会議体名にこれらのキーワードが含まれる場合に対象とする */
const COUNCIL_FILTER_KEYWORDS = [
  "標準化",
  "ガバメントクラウド",
  "基幹業務",
  "地方公共団体",
  "データ戦略",
  "GCAS",
  "デジタル基盤",
];

/** スラグで直接指定（キーワードによらず常に対象） */
const ALWAYS_INCLUDE_SLUGS = new Set([
  "local-governments",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CouncilInfo = {
  name: string;
  slug: string;
  url: string;
};

export type MeetingInfo = {
  councilSlug: string;
  meetingId: string;
  url: string;
  label: string; // "第1回" etc.
};

export type CouncilPdf = {
  pdfUrl: string;
  label: string;
  meetingUrl: string;
  councilName: string;
  meetingLabel: string;
  fileHash?: string;
  localPath?: string;
  ingestedAt?: string;
};

export type CouncilsManifest = {
  lastUpdated: string;
  ingested: CouncilPdf[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function log(msg: string) {
  console.log(`[councils] ${new Date().toISOString().slice(0, 19)} ${msg}`);
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
  return res.text();
}

export function loadManifest(): CouncilsManifest {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (fs.existsSync(MANIFEST_PATH)) {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  }
  return { lastUpdated: "", ingested: [] };
}

export function saveManifest(m: CouncilsManifest) {
  m.lastUpdated = new Date().toISOString();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(m, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Step 1: /councils → 会議体一覧
// ---------------------------------------------------------------------------

export async function fetchCouncilList(): Promise<CouncilInfo[]> {
  const html = await fetchHtml(COUNCILS_URL);
  const councils: CouncilInfo[] = [];

  // /councils/{slug} パターンのリンクを抽出（/councils 自体と /councils/ は除外）
  const linkRegex = /href="(\/councils\/([a-zA-Z0-9_-]+))"[^>]*>([^<]+)/g;
  let match;
  const seen = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    const urlPath = match[1];
    const slug = match[2];
    const name = match[3].replace(/\s+/g, " ").trim();

    // サブページ（/{slug}/{uuid}）はここでは除外
    if (urlPath.split("/").length !== 3) continue;
    if (seen.has(slug)) continue;
    if (!name || name.length < 3) continue;

    seen.add(slug);
    councils.push({ name, slug, url: `${BASE_URL}${urlPath}` });
  }

  return councils;
}

// ---------------------------------------------------------------------------
// Step 2: キーワードフィルタ
// ---------------------------------------------------------------------------

export function filterRelevantCouncils(councils: CouncilInfo[]): CouncilInfo[] {
  return councils.filter((c) => {
    if (ALWAYS_INCLUDE_SLUGS.has(c.slug)) return true;
    return COUNCIL_FILTER_KEYWORDS.some((kw) => c.name.includes(kw));
  });
}

// ---------------------------------------------------------------------------
// Step 3: /councils/{slug} → 各回ページリンク一覧
// ---------------------------------------------------------------------------

export async function fetchMeetingLinks(council: CouncilInfo): Promise<MeetingInfo[]> {
  const html = await fetchHtml(council.url);
  const meetings: MeetingInfo[] = [];

  // /councils/{slug}/{uuid} パターンを抽出
  // UUIDパターンまたは短いハッシュ文字列（gQ6Pun4A等）も対応
  const linkRegex = new RegExp(
    `href="(\\/councils\\/${council.slug}\\/([a-zA-Z0-9_-]{4,}))"[^>]*>([^<]*)`,
    "g"
  );
  const seen = new Set<string>();
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const urlPath = match[1];
    const meetingId = match[2];
    const label = match[3].replace(/\s+/g, " ").trim();

    if (seen.has(meetingId)) continue;
    seen.add(meetingId);

    meetings.push({
      councilSlug: council.slug,
      meetingId,
      url: `${BASE_URL}${urlPath}`,
      label: label || meetingId,
    });
  }

  return meetings;
}

// ---------------------------------------------------------------------------
// Step 4: 各回ページ → PDF/Excelリンク抽出
// ---------------------------------------------------------------------------

export async function fetchPdfLinks(
  meeting: MeetingInfo,
  councilName: string
): Promise<CouncilPdf[]> {
  const html = await fetchHtml(meeting.url);
  const pdfs: CouncilPdf[] = [];
  const seen = new Set<string>();

  // /assets/...pdf|xlsx? パターンを抽出
  const linkRegex =
    /href="([^"]*\.(?:pdf|xlsx?))"[^>]*>([^<]*)/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    const label = match[2].replace(/\s+/g, " ").trim();

    if (href.startsWith("/")) href = `${BASE_URL}${href}`;
    if (seen.has(href)) continue;
    seen.add(href);

    pdfs.push({
      pdfUrl: href,
      label: label || path.basename(href),
      meetingUrl: meeting.url,
      councilName,
      meetingLabel: meeting.label,
    });
  }

  return pdfs;
}

// ---------------------------------------------------------------------------
// Step 5: PDF DL + parse + ingest
// ---------------------------------------------------------------------------

async function downloadAndIngest(
  pdf: CouncilPdf,
  manifest: CouncilsManifest,
  dryRun: boolean,
  downloadOnly: boolean
): Promise<boolean> {
  const fileName = path.basename(pdf.pdfUrl.split("?")[0]);
  const councilDir = path.join(OUTPUT_DIR, pdf.councilName.slice(0, 40).replace(/[/\\]/g, "_"));
  fs.mkdirSync(councilDir, { recursive: true });

  const localPath = path.join(councilDir, fileName);

  // ファイルが既に存在する場合はスキップ（hash確認）
  if (fs.existsSync(localPath)) {
    log(`  [skip] already exists: ${fileName}`);
    return false;
  }

  if (dryRun) {
    log(`  [dry-run] would download: ${fileName}`);
    return false;
  }

  // Download
  let buf: Buffer;
  try {
    const res = await fetch(pdf.pdfUrl, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) {
      log(`  [error] download failed: ${res.status} ${pdf.pdfUrl}`);
      return false;
    }
    buf = Buffer.from(await res.arrayBuffer());
  } catch (err) {
    log(`  [error] ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }

  const fileHash = sha256(buf);
  fs.writeFileSync(localPath, buf);
  log(`  [saved] ${fileName} (${(buf.length / 1024).toFixed(1)}KB)`);

  pdf.localPath = localPath;
  pdf.fileHash = fileHash;

  if (downloadOnly) return true;

  // Parse + ingest
  try {
    const isExcel = /\.xlsx?$/i.test(fileName);
    let text: string;

    if (isExcel) {
      const { parseExcel } = await import("./excel-parser");
      const result = await parseExcel(buf);
      text = result.summary;
    } else {
      const { parsePdf } = await import("./pdf-parser");
      const result = await parsePdf(buf);
      text = result.text;
    }

    if (!text || text.trim().length < 50) {
      log(`  [skip-rag] too short after parse: ${fileName}`);
      return true; // DLは成功
    }

    // TODO: Oracle RAG に移行済み
    // await ingestDocument({
    //   title: `[デジタル庁審議会] ${pdf.councilName} ${pdf.meetingLabel} - ${pdf.label}`,
    //   content: text,
    //   fileName,
    //   fileType: isExcel
    //     ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    //     : "application/pdf",
    //   sourceUrl: pdf.pdfUrl,
    //   organization: "デジタル庁",
    //   category: "official" as DocumentCategory,
    //   metadata: {
    //     source: "digital-go-councils",
    //     council_name: pdf.councilName,
    //     meeting_label: pdf.meetingLabel,
    //     meeting_url: pdf.meetingUrl,
    //     pdf_label: pdf.label,
    //     file_hash: fileHash,
    //   },
    // });

    pdf.ingestedAt = new Date().toISOString();
    log(`  [rag] ingested: ${pdf.label}`);
  } catch (err) {
    log(`  [rag-error] ${err instanceof Error ? err.message : String(err)}`);
  }

  // manifestに追加・保存
  manifest.ingested.push(pdf);
  saveManifest(manifest);

  return true;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type CouncilsScrapeResult = {
  checkedAt: string;
  councilsChecked: number;
  relevantCouncils: number;
  meetingsChecked: number;
  pdfsFound: number;
  pdfsIngested: number;
};

export async function scrapeCouncils(opts: {
  dryRun?: boolean;
  downloadOnly?: boolean;
  /** 特定スラグのみ処理（指定なしで全対象を処理） */
  onlySlug?: string;
  /** 1実行あたりの最大ingest数（Vercel timeout対策） */
  maxIngest?: number;
}): Promise<CouncilsScrapeResult> {
  const { dryRun = false, downloadOnly = false, onlySlug, maxIngest = 20 } = opts;

  const manifest = loadManifest();
  const ingestedUrls = new Set(manifest.ingested.map((p) => p.pdfUrl));

  // Step 1: 会議体一覧
  log("Fetching council list...");
  const allCouncils = await fetchCouncilList();
  log(`Found ${allCouncils.length} councils`);

  // Step 2: フィルタ
  let relevant = filterRelevantCouncils(allCouncils);
  if (onlySlug) {
    relevant = relevant.filter((c) => c.slug === onlySlug);
  }
  log(`Relevant councils: ${relevant.length} (${relevant.map((c) => c.slug).join(", ")})`);

  let meetingsChecked = 0;
  let pdfsFound = 0;
  let pdfsIngested = 0;

  for (const council of relevant) {
    log(`\n--- Council: ${council.name} ---`);

    // Step 3: 各回リンク
    let meetings: MeetingInfo[];
    try {
      meetings = await fetchMeetingLinks(council);
    } catch (err) {
      log(`  [error] ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    log(`  Meetings: ${meetings.length}`);
    meetingsChecked += meetings.length;

    for (const meeting of meetings) {
      // Step 4: PDF抽出
      let pdfs: CouncilPdf[];
      try {
        pdfs = await fetchPdfLinks(meeting, council.name);
      } catch (err) {
        log(`  [error] meeting ${meeting.label}: ${err instanceof Error ? err.message : String(err)}`);
        continue;
      }

      const newPdfs = pdfs.filter((p) => !ingestedUrls.has(p.pdfUrl));
      pdfsFound += pdfs.length;
      log(`  ${meeting.label}: ${pdfs.length} PDFs (${newPdfs.length} new)`);

      for (const pdf of newPdfs) {
        if (pdfsIngested >= maxIngest) {
          log("  [limit] maxIngest reached, stopping");
          break;
        }

        const ok = await downloadAndIngest(pdf, manifest, dryRun, downloadOnly);
        if (ok) {
          ingestedUrls.add(pdf.pdfUrl);
          pdfsIngested++;
        }

        await sleep(800); // polite delay
      }

      if (pdfsIngested >= maxIngest) break;
      await sleep(500);
    }

    if (pdfsIngested >= maxIngest) break;
    await sleep(1000);
  }

  return {
    checkedAt: new Date().toISOString(),
    councilsChecked: allCouncils.length,
    relevantCouncils: relevant.length,
    meetingsChecked,
    pdfsFound,
    pdfsIngested,
  };
}
