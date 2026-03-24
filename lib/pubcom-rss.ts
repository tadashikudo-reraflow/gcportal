/**
 * e-Gov パブコメ RSS 差分チェッカー
 *
 * Vercel Cronから呼び出し、新規案件を検出→scrape-pipelineに投入
 * Playwrightは不要（RSSはfetch+XMLパースのみ）
 */

import { ingestDocument, type DocumentCategory } from "./rag";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RSS_RESULT = "https://public-comment.e-gov.go.jp/rss/pcm_result.xml";
const RSS_LIST = "https://public-comment.e-gov.go.jp/rss/pcm_list.xml";
const BASE_URL = "https://public-comment.e-gov.go.jp";

/** PJ19関連のフィルタキーワード（タイトル or description内にいずれかが含まれれば対象） */
const FILTER_KEYWORDS = [
  "標準化",
  "ガバメントクラウド",
  "基幹業務",
  "地方公共団体情報システム",
  "統一・標準化",
];

/** 所管がこれらの場合、KWなしでも対象 */
const FILTER_MINISTRIES = ["デジタル庁"];

/** 所管+KWの組合せで対象とする省庁 */
const SECONDARY_MINISTRIES = ["総務省", "内閣官房"];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RssCase = {
  caseId: string;
  title: string;
  link: string;
  description: string;
  date: string;
  category: string;
  ministry: string;
};

export type PubcomCheckResult = {
  checkedAt: string;
  newCases: RssCase[];
  totalChecked: number;
  filtered: number;
};

// ---------------------------------------------------------------------------
// RSS Parser
// ---------------------------------------------------------------------------

async function fetchRss(url: string): Promise<RssCase[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "GCInsight-Scraper/1.0 (+https://gcinsight.jp)" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  const xml = await res.text();
  const cases: RssCase[] = [];

  // Simple XML parsing (no dependency needed)
  const items = xml.split("<item>").slice(1);
  for (const item of items) {
    const extract = (tag: string) => {
      const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
      return match?.[1]?.trim().replace(/<!\[CDATA\[|\]\]>/g, "") ?? "";
    };

    const link = extract("link");
    const idMatch = link.match(/id=(\d+)/);
    const desc = extract("description");

    // Extract ministry from description (問合せ先行)
    const ministryMatch = desc.match(/問合せ先[^<]*?([^\s<]+庁|[^\s<]+省|[^\s<]+委員会)/);

    cases.push({
      caseId: idMatch?.[1] ?? "",
      title: extract("title"),
      link,
      description: desc,
      date: extract("dc:date"),
      category: "",
      ministry: ministryMatch?.[1] ?? "",
    });
  }

  return cases;
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

function isRelevantCase(c: RssCase): boolean {
  const text = `${c.title} ${c.description}`.toLowerCase();

  // Tier 1: デジタル庁 → 全件対象
  if (FILTER_MINISTRIES.some((m) => c.ministry.includes(m) || text.includes(m.toLowerCase()))) {
    return true;
  }

  // Tier 2: 総務省/内閣官房 + KWマッチ
  if (SECONDARY_MINISTRIES.some((m) => c.ministry.includes(m) || text.includes(m.toLowerCase()))) {
    return FILTER_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
  }

  // Tier 3: KWのみ（2つ以上マッチで対象）
  const kwMatches = FILTER_KEYWORDS.filter((kw) => text.includes(kw.toLowerCase()));
  return kwMatches.length >= 2;
}

// ---------------------------------------------------------------------------
// Detail page → PDF extraction (lightweight, no Playwright)
// ---------------------------------------------------------------------------

async function fetchDetailPdfs(
  caseId: string
): Promise<{ seqNo: string; label: string; url: string }[]> {
  const detailUrl = `${BASE_URL}/servlet/Public?CLASSNAME=PCM1040&id=${caseId}&Mode=1`;
  const res = await fetch(detailUrl, {
    headers: { "User-Agent": "GCInsight-Scraper/1.0 (+https://gcinsight.jp)" },
  });
  if (!res.ok) return [];

  const html = await res.text();
  const pdfs: { seqNo: string; label: string; url: string }[] = [];

  // Extract download links: /pcm/download?seqNo=XXXXXXXXXX
  const linkRegex = /href="([^"]*\/pcm\/download\?seqNo=(\d+))"[^>]*>([^<]*)/g;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    pdfs.push({
      seqNo: match[2],
      label: match[3].trim(),
      url: match[1].startsWith("http") ? match[1] : `${BASE_URL}${match[1]}`,
    });
  }

  return pdfs;
}

// ---------------------------------------------------------------------------
// Public API (called from Vercel Cron)
// ---------------------------------------------------------------------------

/**
 * RSSをチェックして新規PJ19関連案件を検出
 */
export async function checkPubcomRss(
  knownCaseIds: Set<string>
): Promise<PubcomCheckResult> {
  // Fetch both RSS feeds
  const [resultCases, listCases] = await Promise.all([
    fetchRss(RSS_RESULT),
    fetchRss(RSS_LIST),
  ]);

  const allCases = [...resultCases, ...listCases];
  const totalChecked = allCases.length;

  // Filter for PJ19 relevance
  const relevant = allCases.filter(isRelevantCase);

  // Dedup against known cases
  const newCases = relevant.filter(
    (c) => c.caseId && !knownCaseIds.has(c.caseId)
  );

  return {
    checkedAt: new Date().toISOString(),
    newCases,
    totalChecked,
    filtered: relevant.length,
  };
}

/**
 * 新規案件のPDFをダウンロード → RAG ingest
 * scrape-pipeline.tsの processScrapeJob() と同等の処理
 */
export async function ingestPubcomCase(rssCase: RssCase): Promise<{
  caseId: string;
  pdfCount: number;
  ingestedCount: number;
}> {
  const pdfs = await fetchDetailPdfs(rssCase.caseId);
  let ingestedCount = 0;

  for (const pdf of pdfs) {
    try {
      // Fetch PDF
      const res = await fetch(pdf.url, {
        headers: { "User-Agent": "GCInsight-Scraper/1.0 (+https://gcinsight.jp)" },
      });
      if (!res.ok) continue;

      const buffer = Buffer.from(await res.arrayBuffer());

      // Parse PDF
      const { parsePdf } = await import("./pdf-parser");
      const { text } = await parsePdf(buffer);
      if (!text || text.trim().length < 50) continue;

      // Ingest to RAG
      await ingestDocument({
        title: `[パブコメ] ${rssCase.title} - ${pdf.label}`,
        content: text,
        fileName: `${rssCase.caseId}_${pdf.seqNo}.pdf`,
        fileType: "application/pdf",
        sourceUrl: pdf.url,
        organization: "e-Gov パブコメ",
        category: "regulation" as DocumentCategory,
        metadata: {
          source: "e-gov-pubcom",
          case_id: rssCase.caseId,
          case_title: rssCase.title,
          ministry: rssCase.ministry,
          published_date: rssCase.date,
          pdf_seq_no: pdf.seqNo,
          pdf_label: pdf.label,
        },
      });

      ingestedCount++;
    } catch {
      // Skip failed PDFs silently
    }
  }

  return { caseId: rssCase.caseId, pdfCount: pdfs.length, ingestedCount };
}
