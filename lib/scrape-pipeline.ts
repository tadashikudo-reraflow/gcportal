/**
 * スクレイピングパイプライン
 *
 * データソース管理 + ジョブキュー + fetch → parse → ingest フロー
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { ingestDocument, type DocumentCategory } from "./rag";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataSourceType = "pdf" | "excel" | "html";
export type DataSourceCategory = "official" | "report" | "regulation";
export type DataSourcePriority = "S" | "A" | "B";
export type DataSourceSchedule = "daily" | "weekly" | "monthly";

export type DataSource = {
  key: string;
  name: string;
  url: string;
  type: DataSourceType;
  organization: string;
  category: DataSourceCategory;
  schedule?: DataSourceSchedule;
  priority: DataSourcePriority;
};

export type ScrapeJobStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

export type ScrapeJob = {
  id: number;
  source_key: string;
  url: string;
  status: ScrapeJobStatus;
  file_hash: string | null;
  etag: string | null;
  last_modified: string | null;
  retry_count: number;
  error_message: string | null;
  result_document_id: number | null;
  created_at: string;
  processed_at: string | null;
};

// ---------------------------------------------------------------------------
// GOV_DATA_SOURCES — built from etl/data/gov_downloads/sources.json
// ---------------------------------------------------------------------------

export const GOV_DATA_SOURCES: DataSource[] = [
  {
    key: "soumu_shikuchoson_202601",
    name: "市町村別進捗一覧（2026年1月最新）",
    url: "https://www.soumu.go.jp/main_content/001057555.xlsx",
    type: "excel",
    organization: "総務省",
    category: "official",
    schedule: "monthly",
    priority: "S",
  },
  {
    key: "digital_tokutei_202512",
    name: "特定移行支援システム該当見込み一覧（2025年12月末）",
    url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c58162cb-92e5-4a43-9ad5-095b7c45100c/752f1a62/20260227_policies_local_governments_doc_2.xlsx",
    type: "excel",
    organization: "デジタル庁",
    category: "official",
    schedule: "monthly",
    priority: "S",
  },
  {
    key: "cas_wt10_cost_status",
    name: "WT第10回 運用経費対策 取り組み状況（2026年3月3日）",
    url: "https://www.cas.go.jp/jp/seisaku/digital_gyozaikaikaku/kyotsuwt10/siryou1.pdf",
    type: "pdf",
    organization: "内閣官房",
    category: "report",
    priority: "S",
  },
  {
    key: "cas_wt10_subsidy",
    name: "WT第10回 運用最適化支援事業費補助金（2026年3月3日）",
    url: "https://www.cas.go.jp/jp/seisaku/digital_gyozaikaikaku/kyotsuwt10/siryou2.pdf",
    type: "pdf",
    organization: "内閣官房",
    category: "report",
    priority: "A",
  },
  {
    key: "digital_cost_measures",
    name: "運用経費 総合的な対策（本文）",
    url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c58162cb-92e5-4a43-9ad5-095b7c45100c/dc96d895/20250613_policies_local_governments_doc_02.pdf",
    type: "pdf",
    organization: "デジタル庁",
    category: "regulation",
    priority: "A",
  },
  {
    key: "digital_spec_versions",
    name: "標準仕様書 全体バージョン管理（2026年3月18日時点）",
    url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c58162cb-92e5-4a43-9ad5-095b7c45100c/5aa59422/20260318_policies_local_governments_01.xlsx",
    type: "excel",
    organization: "デジタル庁",
    category: "official",
    schedule: "monthly",
    priority: "A",
  },
];

// ---------------------------------------------------------------------------
// Supabase service client
// ---------------------------------------------------------------------------

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars for scrape pipeline");
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_AGENT = "GCInsight-Scraper/1.0 (+https://gcinsight.reraflow.com)";
const MAX_RETRIES = 3;

function computeHash(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function getFileTypeFromSource(source: DataSource): string {
  switch (source.type) {
    case "pdf":
      return "application/pdf";
    case "excel":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "html":
      return "text/html";
    default:
      return "application/octet-stream";
  }
}

/** 指数バックオフ付きsleep */
function backoffDelay(retryCount: number): Promise<void> {
  const ms = Math.min(1000 * Math.pow(2, retryCount), 30_000);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Job CRUD
// ---------------------------------------------------------------------------

/** スクレイプジョブを作成する */
export async function createScrapeJob(source: DataSource): Promise<number> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("scrape_jobs")
    .insert({
      source_key: source.key,
      url: source.url,
      status: "pending",
      retry_count: 0,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create scrape job: ${error?.message}`);
  }

  return data.id;
}

/** ジョブ一覧取得 */
export async function getScrapeJobs(status?: string): Promise<ScrapeJob[]> {
  const supabase = getServiceClient();

  let query = supabase
    .from("scrape_jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw new Error(`Failed to get scrape jobs: ${error.message}`);
  return (data ?? []) as ScrapeJob[];
}

/** ジョブ単体取得 */
export async function getScrapeJob(id: number): Promise<ScrapeJob | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("scrape_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Failed to get scrape job: ${error.message}`);
  }

  return data as ScrapeJob;
}

/** 最古のpendingジョブを取得 */
export async function getNextPendingJob(): Promise<ScrapeJob | null> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("scrape_jobs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to get next pending job: ${error.message}`);
  }

  return data as ScrapeJob;
}

// ---------------------------------------------------------------------------
// Core Processing
// ---------------------------------------------------------------------------

/** ジョブを処理する（fetch → hash check → parse → ingest） */
export async function processScrapeJob(jobId: number): Promise<void> {
  const supabase = getServiceClient();

  // 1. ジョブ取得 & ステータス更新
  const job = await getScrapeJob(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (job.status !== "pending" && job.status !== "failed") {
    throw new Error(`Job ${jobId} is not in a processable state (status: ${job.status})`);
  }

  await supabase
    .from("scrape_jobs")
    .update({ status: "processing" })
    .eq("id", jobId);

  // データソース情報を取得
  const source = GOV_DATA_SOURCES.find((s) => s.key === job.source_key);
  const sourceType: DataSourceType = source?.type ?? inferTypeFromUrl(job.url);
  const sourceName = source?.name ?? job.source_key;
  const sourceOrg = source?.organization ?? "不明";
  const sourceCategory: DataSourceCategory = source?.category ?? "official";

  try {
    // 2. fetch (条件付きリクエスト)
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
    };
    if (job.etag) headers["If-None-Match"] = job.etag;
    if (job.last_modified) headers["If-Modified-Since"] = job.last_modified;

    const res = await fetch(job.url, { headers });

    // 304 Not Modified → skip
    if (res.status === 304) {
      await supabase
        .from("scrape_jobs")
        .update({
          status: "skipped",
          processed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    // 3. レスポンスヘッダ保存
    const newEtag = res.headers.get("etag") ?? null;
    const newLastModified = res.headers.get("last-modified") ?? null;

    // 4. ボディ取得 & ハッシュ計算
    const buffer = Buffer.from(await res.arrayBuffer());
    const fileHash = computeHash(buffer);

    // 5. ハッシュ重複チェック（既にインジェスト済みならスキップ）
    const { data: existingDoc } = await supabase
      .from("rag_documents")
      .select("id")
      .eq("file_hash", fileHash)
      .limit(1)
      .single();

    if (existingDoc) {
      await supabase
        .from("scrape_jobs")
        .update({
          status: "skipped",
          file_hash: fileHash,
          etag: newEtag,
          last_modified: newLastModified,
          result_document_id: existingDoc.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      return;
    }

    // 6. パース
    const textContent = await parseContent(buffer, sourceType, job.url);

    if (!textContent || textContent.trim().length === 0) {
      throw new Error("Parsed content is empty");
    }

    // 7. RAGインジェスト
    const { documentId, chunkCount } = await ingestDocument({
      title: sourceName,
      content: textContent,
      fileName: extractFileName(job.url),
      fileType: getFileTypeFromSource(source ?? { type: sourceType } as DataSource),
      sourceUrl: job.url,
      organization: sourceOrg,
      category: sourceCategory as DocumentCategory,
      metadata: {
        source_key: job.source_key,
        scrape_job_id: jobId,
        file_hash: fileHash,
      },
    });

    // 8. file_hash をドキュメントにも保存
    await supabase
      .from("rag_documents")
      .update({ file_hash: fileHash })
      .eq("id", documentId);

    // 9. ジョブ完了
    await supabase
      .from("scrape_jobs")
      .update({
        status: "completed",
        file_hash: fileHash,
        etag: newEtag,
        last_modified: newLastModified,
        result_document_id: documentId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const newRetryCount = (job.retry_count ?? 0) + 1;

    // リトライ上限チェック
    const newStatus: ScrapeJobStatus = newRetryCount >= MAX_RETRIES ? "failed" : "pending";

    await supabase
      .from("scrape_jobs")
      .update({
        status: newStatus,
        retry_count: newRetryCount,
        error_message: errorMessage,
        processed_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (newStatus === "failed") {
      throw new Error(`Job ${jobId} failed after ${MAX_RETRIES} retries: ${errorMessage}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Parsers (dynamic imports)
// ---------------------------------------------------------------------------

async function parseContent(
  buffer: Buffer,
  type: DataSourceType,
  url: string
): Promise<string> {
  switch (type) {
    case "pdf":
      return parsePdfContent(buffer);
    case "excel":
      return parseExcelContent(buffer);
    case "html":
      return parseHtmlContent(buffer);
    default:
      throw new Error(`Unsupported file type: ${type}`);
  }
}

async function parsePdfContent(buffer: Buffer): Promise<string> {
  const { parsePdf } = await import("./pdf-parser");
  const result = await parsePdf(buffer);
  return result.text;
}

async function parseExcelContent(buffer: Buffer): Promise<string> {
  try {
    const { parseExcel } = await import("./excel-parser");
    const result = await parseExcel(buffer);
    return result.summary;
  } catch {
    // excel-parser未インストール時のフォールバック: xlsxを試行
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const lines: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        lines.push(`## ${sheetName}\n${csv}`);
      }
      return lines.join("\n\n");
    } catch {
      throw new Error(
        "Excel parser not available. Install xlsx: npm install xlsx"
      );
    }
  }
}

async function parseHtmlContent(buffer: Buffer): Promise<string> {
  const html = buffer.toString("utf-8");
  // 簡易HTMLテキスト抽出（タグ除去）
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function inferTypeFromUrl(url: string): DataSourceType {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  return "html";
}

function extractFileName(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** データソースをキーで検索 */
export function findDataSource(key: string): DataSource | undefined {
  return GOV_DATA_SOURCES.find((s) => s.key === key);
}
