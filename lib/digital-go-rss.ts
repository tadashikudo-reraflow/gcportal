/**
 * デジタル庁 新着情報 RSS 差分チェッカー + RAG ingest
 *
 * RSSフィード: https://www.digital.go.jp/rss/news.xml
 * 記事本文をfetch → テキスト抽出 → RAG ingest
 * 添付PDF/Excelも検出してingest
 *
 * /api/scrape/process から呼び出し
 */

import type { DocumentCategory } from "./rag";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RSS_URL = "https://www.digital.go.jp/rss/news.xml";
const BASE_URL = "https://www.digital.go.jp";
const USER_AGENT = "GCInsight-Scraper/1.0 (+https://gcinsight.jp)";

/** PJ19関連のフィルタキーワード */
const FILTER_KEYWORDS = [
  "標準化",
  "ガバメントクラウド",
  "ガバクラ",
  "基幹業務",
  "地方公共団体情報システム",
  "統一・標準化",
  "自治体システム",
  "標準仕様書",
  "データ要件",
  "連携要件",
  "GCAS",
  "移行支援",
  "非機能要件",
  "運用経費",
  "地方公共団体",
];

/** これらのカテゴリは常に対象 */
const ALWAYS_INCLUDE_CATEGORIES = ["政策"];

/** これらのURLパスを含む記事は常に対象 */
const ALWAYS_INCLUDE_PATHS = [
  "/policies/local_governments",
  "/policies/gov_cloud",
  "/policies/standardization",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DigitalGoNewsItem = {
  title: string;
  link: string;
  pubDate: string;
  category: string;
  guid: string;
};

export type DigitalGoCheckResult = {
  checkedAt: string;
  totalItems: number;
  filteredItems: number;
  newItems: DigitalGoNewsItem[];
  ingestedCount: number;
};

// ---------------------------------------------------------------------------
// RSS Parser
// ---------------------------------------------------------------------------

async function fetchRss(): Promise<DigitalGoNewsItem[]> {
  const res = await fetch(RSS_URL, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);

  const xml = await res.text();
  const items: DigitalGoNewsItem[] = [];

  const entries = xml.split("<item>").slice(1);
  for (const entry of entries) {
    const extract = (tag: string) => {
      // Handle tags with attributes like <guid isPermaLink="false">
      const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return match?.[1]?.trim().replace(/<!\[CDATA\[|\]\]>/g, "") ?? "";
    };

    items.push({
      title: extract("title"),
      link: extract("link"),
      pubDate: extract("pubDate"),
      category: extract("category"),
      guid: extract("guid"),
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Filter
// ---------------------------------------------------------------------------

function isRelevantItem(item: DigitalGoNewsItem): boolean {
  // Always include certain paths
  if (ALWAYS_INCLUDE_PATHS.some((p) => item.link.includes(p))) return true;

  // Always include "政策" category with KW match (looser)
  const text = `${item.title} ${item.category}`.toLowerCase();

  if (ALWAYS_INCLUDE_CATEGORIES.includes(item.category)) {
    return FILTER_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
  }

  // Other categories: require 1+ keyword match in title
  return FILTER_KEYWORDS.some((kw) =>
    item.title.toLowerCase().includes(kw.toLowerCase())
  );
}

// ---------------------------------------------------------------------------
// Article page → text + PDF extraction
// ---------------------------------------------------------------------------

async function fetchArticleContent(
  url: string
): Promise<{ text: string; pdfs: { url: string; label: string }[] }> {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return { text: "", pdfs: [] };

  const html = await res.text();

  // Extract main text (strip tags)
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

  // Extract PDF/Excel links
  const pdfs: { url: string; label: string }[] = [];
  const linkRegex =
    /href="([^"]*\.(?:pdf|xlsx?|zip))"[^>]*>([^<]*)/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith("/")) href = BASE_URL + href;
    pdfs.push({ url: href, label: match[2].trim() });
  }

  return { text, pdfs };
}

// ---------------------------------------------------------------------------
// PDF/Excel ingest helper
// ---------------------------------------------------------------------------

async function ingestAttachment(
  attachUrl: string,
  label: string,
  newsItem: DigitalGoNewsItem
): Promise<boolean> {
  try {
    const res = await fetch(attachUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    if (!res.ok) return false;

    const buffer = Buffer.from(await res.arrayBuffer());
    const header = buffer.slice(0, 5).toString();
    let text: string;

    if (header === "%PDF-") {
      const { parsePdf } = await import("./pdf-parser");
      const result = await parsePdf(buffer);
      text = result.text;
    } else if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      // Excel (xlsx) or zip
      try {
        const { parseExcel } = await import("./excel-parser");
        const result = await parseExcel(buffer);
        text = result.summary;
      } catch {
        // ZIP file - skip
        return false;
      }
    } else {
      // Unknown format
      return false;
    }

    if (!text || text.trim().length < 50) return false;

    // TODO: Oracle RAG に移行済み
    // await ingestDocument({
    //   title: `[デジタル庁] ${newsItem.title} - ${label}`,
    //   content: text,
    //   fileName: attachUrl.split("/").pop() ?? "unknown",
    //   fileType: header === "%PDF-" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    //   sourceUrl: attachUrl,
    //   organization: "デジタル庁",
    //   category: "official" as DocumentCategory,
    //   metadata: {
    //     source: "digital-go-jp",
    //     news_title: newsItem.title,
    //     news_url: newsItem.link,
    //     news_category: newsItem.category,
    //     news_date: newsItem.pubDate,
    //     attachment_label: label,
    //   },
    // });

    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * デジタル庁RSSをチェックして新規PJ19関連記事を検出+ingest
 */
export async function checkDigitalGoNews(
  knownGuids: Set<string>
): Promise<DigitalGoCheckResult> {
  const items = await fetchRss();
  const relevant = items.filter(isRelevantItem);
  // knownGuids は source_url（記事URL）のセット。item.link と照合する
  const newItems = relevant.filter(
    (item) => item.link && !knownGuids.has(item.link)
  );

  let ingestedCount = 0;

  // Process new items (max 5 per run for Vercel timeout)
  for (const item of newItems.slice(0, 5)) {
    try {
      const { text, pdfs } = await fetchArticleContent(item.link);

      // TODO: Oracle RAG に移行済み
      // if (text && text.length > 100) {
      //   await ingestDocument({
      //     title: `[デジタル庁] ${item.title}`,
      //     content: text,
      //     fileName: `digital-go-${item.guid || Date.now()}.html`,
      //     fileType: "text/html",
      //     sourceUrl: item.link,
      //     organization: "デジタル庁",
      //     category: "official" as DocumentCategory,
      //     metadata: {
      //       source: "digital-go-jp",
      //       news_title: item.title,
      //       news_url: item.link,
      //       news_category: item.category,
      //       news_date: item.pubDate,
      //     },
      //   });
      //   ingestedCount++;
      // }

      // Ingest PDF/Excel attachments (max 3 per article)
      for (const pdf of pdfs.slice(0, 3)) {
        const ok = await ingestAttachment(pdf.url, pdf.label, item);
        if (ok) ingestedCount++;
      }
    } catch {
      // Skip failed articles
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    totalItems: items.length,
    filteredItems: relevant.length,
    newItems,
    ingestedCount,
  };
}
