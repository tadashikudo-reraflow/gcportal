/**
 * GET  /api/schedule  — 現在のスケジュールデータを返す
 * POST /api/schedule  — スケジュール自動更新（Cron / Claude Code から呼び出し）
 *
 *   1. デジタル庁等の公開ページをスクレイプし新規イベントを検出
 *   2. 信頼度 high のイベントを自動追加（source: "auto"）
 *   3. 過去日付のイベントを自動で「完了」に更新
 *   4. 変更ログを schedule-log.json に記録
 *
 * 認証: CRON_SECRET or GCINSIGHT_ADMIN_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const SCHEDULE_PATH = join(process.cwd(), "public/data/schedule.json");
const LOG_PATH = join(process.cwd(), "public/data/schedule-log.json");

// ---------------------------------------------------------------------------
// 認証ヘルパー
// ---------------------------------------------------------------------------

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedCron = process.env.CRON_SECRET;
  if (cronSecret && expectedCron && cronSecret === expectedCron) return true;

  const adminKey = process.env.GCINSIGHT_ADMIN_KEY;
  const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
  if (authHeader && adminKey && authHeader === adminKey) return true;

  // ローカル開発時はキーなしで許可
  if (!expectedCron && !adminKey) return true;

  return false;
}

// ---------------------------------------------------------------------------
// スクレイプ対象
// ---------------------------------------------------------------------------

const SCRAPE_TARGETS = [
  {
    id: "digital-cho-news",
    url: "https://www.digital.go.jp/news",
    org: "デジタル庁",
    keywords: [
      "ガバメントクラウド", "標準化", "標準仕様書", "GCAS",
      "事業者協議会", "説明会", "公募", "ガバクラ",
      "基幹業務", "データ要件", "連携要件",
    ],
  },
  {
    id: "digital-cho-govcloud",
    url: "https://www.digital.go.jp/policies/gov_cloud",
    org: "デジタル庁",
    keywords: ["ガバメントクラウド", "GCAS", "クラウド", "ガバクラ", "SP/RI"],
  },
  {
    id: "digital-cho-local",
    url: "https://www.digital.go.jp/policies/local_governments",
    org: "デジタル庁",
    keywords: ["標準化", "標準仕様書", "データ要件", "連携要件", "基幹業務", "移行"],
  },
  {
    id: "soumu-dx",
    url: "https://www.soumu.go.jp/denshijiti/index_00001.html",
    org: "総務省",
    keywords: ["PMO", "標準化", "進捗", "補助金", "デジタル基盤"],
  },
  {
    id: "cas-wt",
    url: "https://www.cas.go.jp/jp/seisaku/digital_gyozaikaikaku/",
    org: "内閣官房",
    keywords: ["ワーキングチーム", "運用経費", "ガバメントクラウド", "コスト"],
  },
];

// ---------------------------------------------------------------------------
// 日付抽出
// ---------------------------------------------------------------------------

interface DateMatch {
  date: string;
  context: string;
}

function extractDates(text: string): DateMatch[] {
  const results: DateMatch[] = [];
  const seen = new Set<string>();

  // パターン1: 令和X年M月D日
  const reiwaPat = /令和(\d{1,2})年(\d{1,2})月(\d{1,2})日/g;
  let m;
  while ((m = reiwaPat.exec(text)) !== null) {
    const year = 2018 + parseInt(m[1]);
    const month = String(parseInt(m[2])).padStart(2, "0");
    const day = String(parseInt(m[3])).padStart(2, "0");
    const date = `${year}-${month}-${day}`;
    const start = Math.max(0, m.index - 30);
    const end = Math.min(text.length, m.index + m[0].length + 120);
    const context = text.slice(start, end).replace(/\s+/g, " ").trim();
    const key = `${date}:${context.slice(0, 40)}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ date, context });
    }
  }

  // パターン2: YYYY年M月D日
  const fullPat = /(202\d)年(\d{1,2})月(\d{1,2})日/g;
  while ((m = fullPat.exec(text)) !== null) {
    const month = String(parseInt(m[2])).padStart(2, "0");
    const day = String(parseInt(m[3])).padStart(2, "0");
    const date = `${m[1]}-${month}-${day}`;
    const start = Math.max(0, m.index - 30);
    const end = Math.min(text.length, m.index + m[0].length + 120);
    const context = text.slice(start, end).replace(/\s+/g, " ").trim();
    const key = `${date}:${context.slice(0, 40)}`;
    if (!seen.has(key)) {
      seen.add(key);
      results.push({ date, context });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// 重複チェック（既存タイトルとのファジーマッチ）
// ---------------------------------------------------------------------------

function isDuplicate(newTitle: string, existingTitles: string[]): boolean {
  const normalized = newTitle.replace(/\s+/g, "").toLowerCase();
  for (const existing of existingTitles) {
    const existNorm = existing.replace(/\s+/g, "").toLowerCase();
    // 完全一致
    if (normalized === existNorm) return true;
    // 片方が他方に含まれる（70%以上の長さ）
    if (normalized.length > 10 && existNorm.includes(normalized.slice(0, Math.floor(normalized.length * 0.7)))) return true;
    if (existNorm.length > 10 && normalized.includes(existNorm.slice(0, Math.floor(existNorm.length * 0.7)))) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// タイトル抽出（コンテキストからクリーンなイベント名を生成）
// ---------------------------------------------------------------------------

function extractTitle(context: string, keywords: string[]): string {
  // キーワード周辺の意味のある部分を抽出
  let bestSegment = context;

  // 「〜について」「〜に関する」等のパターンでタイトルらしい部分を切り出す
  const titlePatterns = [
    /「([^」]+)」/,
    /(.{5,50}(?:説明会|協議会|公募|改定|公開|リリース|施行|開始|検討会|審議会|ワーキング))/,
    /(.{5,50}(?:について|に関する|に係る))/,
  ];

  for (const pat of titlePatterns) {
    const match = context.match(pat);
    if (match) {
      bestSegment = match[1] || match[0];
      break;
    }
  }

  // 80字を超えたら切り詰め
  if (bestSegment.length > 80) {
    bestSegment = bestSegment.slice(0, 77) + "…";
  }

  return bestSegment.trim();
}

// ---------------------------------------------------------------------------
// 変更ログ
// ---------------------------------------------------------------------------

interface LogEntry {
  timestamp: string;
  action: "auto_add" | "auto_complete" | "manual_add" | "manual_edit" | "excel_upload";
  details: string;
  count: number;
}

async function appendLog(entries: LogEntry[]): Promise<void> {
  if (entries.length === 0) return;

  let log: LogEntry[] = [];
  try {
    const raw = await readFile(LOG_PATH, "utf-8");
    log = JSON.parse(raw);
  } catch {
    // ファイルがなければ新規作成
  }

  log.push(...entries);

  // 最新200件に制限
  if (log.length > 200) {
    log = log.slice(-200);
  }

  await writeFile(LOG_PATH, JSON.stringify(log, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const raw = await readFile(SCHEDULE_PATH, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Schedule data not found" }, { status: 404 });
  }
}

// ---------------------------------------------------------------------------
// POST — Scrape → 自動追加 → ステータス更新 → ログ記録
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 1. 現在のスケジュール読み込み ──
  let schedule: Record<string, unknown>;
  try {
    const raw = await readFile(SCHEDULE_PATH, "utf-8");
    schedule = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to read schedule" }, { status: 500 });
  }

  const events = (schedule.recent_schedule || []) as Record<string, unknown>[];
  const existingTitles = events.map((e) => e.title as string);
  const today = new Date().toISOString().slice(0, 10);
  const logEntries: LogEntry[] = [];

  // ── 2. 過去イベントの自動完了 ──
  let statusUpdated = 0;
  for (const ev of events) {
    if ((ev.date as string) < today && ev.status === "upcoming") {
      ev.status = "done";
      statusUpdated++;
    }
  }
  if (statusUpdated > 0) {
    logEntries.push({
      timestamp: new Date().toISOString(),
      action: "auto_complete",
      details: `${statusUpdated}件の過去イベントを「完了」に更新`,
      count: statusUpdated,
    });
  }

  // ── 3. スクレイプ＆新規イベント検出 ──
  interface DetectedEvent {
    date: string;
    title: string;
    org: string;
    url: string;
    source_id: string;
    confidence: "high" | "medium" | "low";
    keywords_matched: number;
  }

  const detected: DetectedEvent[] = [];
  const autoAdded: string[] = [];
  const scrapeResults: { id: string; status: string; detected: number; added: number }[] = [];

  for (const target of SCRAPE_TARGETS) {
    try {
      const res = await fetch(target.url, {
        headers: {
          "User-Agent": "GCInsight-Schedule-Bot/1.0 (+https://gcinsight.jp)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        scrapeResults.push({ id: target.id, status: `HTTP ${res.status}`, detected: 0, added: 0 });
        continue;
      }

      const html = await res.text();
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ");

      const dates = extractDates(text);
      let detectedCount = 0;
      let addedCount = 0;

      for (const { date, context } of dates) {
        // 未来〜直近3ヶ月のイベントのみ対象
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (date < threeMonthsAgo.toISOString().slice(0, 10)) continue;

        // キーワードマッチ
        const matchedKeywords = target.keywords.filter((kw) => context.includes(kw));
        if (matchedKeywords.length === 0) continue;

        // タイトル生成
        const title = extractTitle(context, matchedKeywords);
        if (title.length < 5) continue;

        // 重複チェック
        if (isDuplicate(title, existingTitles)) continue;

        const confidence: "high" | "medium" | "low" =
          matchedKeywords.length >= 3 ? "high" : matchedKeywords.length >= 2 ? "medium" : "low";

        const detectedEvent: DetectedEvent = {
          date,
          title,
          org: target.org,
          url: target.url,
          source_id: target.id,
          confidence,
          keywords_matched: matchedKeywords.length,
        };

        detected.push(detectedEvent);
        detectedCount++;

        // 信頼度 high → 自動追加
        if (confidence === "high") {
          const newEvent: Record<string, unknown> = {
            date,
            status: date < today ? "done" : "upcoming",
            title,
            org: target.org,
            url: target.url,
            source: "auto",
          };
          events.push(newEvent);
          existingTitles.push(title);
          autoAdded.push(title);
          addedCount++;
        }
      }

      scrapeResults.push({ id: target.id, status: "ok", detected: detectedCount, added: addedCount });
    } catch (err) {
      scrapeResults.push({
        id: target.id,
        status: `error: ${err instanceof Error ? err.message : "unknown"}`,
        detected: 0,
        added: 0,
      });
    }
  }

  // ── 4. ソート＆保存 ──
  events.sort((a, b) => (a.date as string).localeCompare(b.date as string));
  schedule.recent_schedule = events;
  schedule.last_updated = today;

  try {
    await writeFile(SCHEDULE_PATH, JSON.stringify(schedule, null, 2) + "\n", "utf-8");
  } catch {
    return NextResponse.json({ error: "Failed to write schedule" }, { status: 500 });
  }

  // ── 5. ログ記録 ──
  if (autoAdded.length > 0) {
    logEntries.push({
      timestamp: new Date().toISOString(),
      action: "auto_add",
      details: `自動追加: ${autoAdded.join("、")}`,
      count: autoAdded.length,
    });
  }
  await appendLog(logEntries);

  // ── 6. レスポンス ──
  const pendingReview = detected.filter((d) => d.confidence !== "high");

  return NextResponse.json({
    summary: {
      status_auto_completed: statusUpdated,
      events_detected: detected.length,
      events_auto_added: autoAdded.length,
      events_pending_review: pendingReview.length,
      total_events: events.length,
    },
    auto_added: autoAdded,
    pending_review: pendingReview.map((d) => ({
      date: d.date,
      title: d.title,
      org: d.org,
      confidence: d.confidence,
      url: d.url,
    })),
    scrape_results: scrapeResults,
    message: [
      statusUpdated > 0 ? `${statusUpdated}件を自動完了` : null,
      autoAdded.length > 0 ? `${autoAdded.length}件を自動追加` : null,
      pendingReview.length > 0 ? `${pendingReview.length}件が要確認（medium/low信頼度）` : null,
      autoAdded.length === 0 && pendingReview.length === 0 ? "新規イベントなし" : null,
    ].filter(Boolean).join("、"),
  });
}
