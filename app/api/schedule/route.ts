/**
 * GET  /api/schedule  — 現在のスケジュールデータを返す
 * POST /api/schedule  — スケジュール自動更新（Cron / Claude Code から呼び出し）
 *
 *   1. デジタル庁等の公開ページをスクレイプし新規イベントを検出
 *   2. 信頼度 high のイベントを自動追加（source: "auto"）
 *   3. 過去日付のイベントを自動で「完了」に更新
 *
 * 認証: CRON_SECRET or GCINSIGHT_ADMIN_KEY
 * ストレージ: Supabase schedule_events テーブル（Vercel serverless対応）
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import scheduleStaticData from "@/public/data/schedule.json";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ---------------------------------------------------------------------------
// 認証ヘルパー
// ---------------------------------------------------------------------------

function isAuthorized(req: NextRequest): boolean {
  const expectedCron = process.env.CRON_SECRET;
  const adminKey = process.env.GCINSIGHT_ADMIN_KEY;

  const cronSecret = req.headers.get("x-cron-secret");
  if (cronSecret && expectedCron && cronSecret === expectedCron) return true;

  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  if (bearer && expectedCron && bearer === expectedCron) return true;
  if (bearer && adminKey && bearer === adminKey) return true;

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
    if (!seen.has(key)) { seen.add(key); results.push({ date, context }); }
  }

  const fullPat = /(202\d)年(\d{1,2})月(\d{1,2})日/g;
  while ((m = fullPat.exec(text)) !== null) {
    const month = String(parseInt(m[2])).padStart(2, "0");
    const day = String(parseInt(m[3])).padStart(2, "0");
    const date = `${m[1]}-${month}-${day}`;
    const start = Math.max(0, m.index - 30);
    const end = Math.min(text.length, m.index + m[0].length + 120);
    const context = text.slice(start, end).replace(/\s+/g, " ").trim();
    const key = `${date}:${context.slice(0, 40)}`;
    if (!seen.has(key)) { seen.add(key); results.push({ date, context }); }
  }

  return results;
}

function isDuplicate(newTitle: string, existingTitles: string[]): boolean {
  const normalized = newTitle.replace(/\s+/g, "").toLowerCase();
  for (const existing of existingTitles) {
    const existNorm = existing.replace(/\s+/g, "").toLowerCase();
    if (normalized === existNorm) return true;
    if (normalized.length > 10 && existNorm.includes(normalized.slice(0, Math.floor(normalized.length * 0.7)))) return true;
    if (existNorm.length > 10 && normalized.includes(existNorm.slice(0, Math.floor(existNorm.length * 0.7)))) return true;
  }
  return false;
}

function extractTitle(context: string, keywords: string[]): string {
  let bestSegment = context;
  const titlePatterns = [
    /「([^」]+)」/,
    /(.{5,50}(?:説明会|協議会|公募|改定|公開|リリース|施行|開始|検討会|審議会|ワーキング))/,
    /(.{5,50}(?:について|に関する|に係る))/,
  ];
  for (const pat of titlePatterns) {
    const match = context.match(pat);
    if (match) { bestSegment = match[1] || match[0]; break; }
  }
  if (bestSegment.length > 80) bestSegment = bestSegment.slice(0, 77) + "…";
  return bestSegment.trim();
}

// ---------------------------------------------------------------------------
// GET — Supabase から全イベント取得 + static データを結合
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: events, error } = await supabase
      .from("schedule_events")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw error;

    const recentSchedule = (events ?? []).map((ev) => ({
      date: ev.date,
      status: ev.status,
      title: ev.title,
      org: ev.org,
      ...(ev.important ? { important: true } : {}),
      ...(ev.note ? { note: ev.note } : {}),
      ...(ev.url ? { url: ev.url } : {}),
    }));

    const staticData = scheduleStaticData as Record<string, unknown>;

    return NextResponse.json({
      last_updated: new Date().toISOString().slice(0, 10),
      annual_schedule: staticData.annual_schedule ?? [],
      recent_schedule: recentSchedule,
      source_pages: staticData.source_pages ?? [],
    });
  } catch (err) {
    console.error("[schedule GET]", err);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Scrape → 自動追加 → ステータス更新
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);

  // ── 1. 現在のイベント取得 ──
  const { data: currentEvents, error: fetchError } = await supabase
    .from("schedule_events")
    .select("id, date, status, title");

  if (fetchError) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }

  const events = currentEvents ?? [];
  const existingTitles = events.map((e) => e.title as string);

  // ── 2. 過去イベントの自動完了 ──
  const toComplete = events
    .filter((e) => e.date < today && e.status === "upcoming")
    .map((e) => e.id as number);

  let statusUpdated = 0;
  if (toComplete.length > 0) {
    const { error: updateError } = await supabase
      .from("schedule_events")
      .update({ status: "done" })
      .in("id", toComplete);

    if (!updateError) statusUpdated = toComplete.length;
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
        .replace(/\s+/g, " ");

      const dates = extractDates(text);
      let detectedCount = 0;
      let addedCount = 0;

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const cutoff = threeMonthsAgo.toISOString().slice(0, 10);

      for (const { date, context } of dates) {
        if (date < cutoff) continue;

        const matchedKeywords = target.keywords.filter((kw) => context.includes(kw));
        if (matchedKeywords.length === 0) continue;

        const title = extractTitle(context, matchedKeywords);
        if (title.length < 5) continue;

        if (isDuplicate(title, existingTitles)) continue;

        const confidence: "high" | "medium" | "low" =
          matchedKeywords.length >= 3 ? "high" : matchedKeywords.length >= 2 ? "medium" : "low";

        const detectedEvent: DetectedEvent = {
          date, title, org: target.org, url: target.url,
          source_id: target.id, confidence, keywords_matched: matchedKeywords.length,
        };

        detected.push(detectedEvent);
        detectedCount++;

        if (confidence === "high") {
          const { error: insertError } = await supabase
            .from("schedule_events")
            .insert({
              date,
              status: date < today ? "done" : "upcoming",
              title,
              org: target.org,
              url: target.url,
              source: "auto",
            });

          if (!insertError) {
            existingTitles.push(title);
            autoAdded.push(title);
            addedCount++;
          }
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

  const pendingReview = detected.filter((d) => d.confidence !== "high");

  revalidatePath("/timeline");

  return NextResponse.json({
    summary: {
      status_auto_completed: statusUpdated,
      events_detected: detected.length,
      events_auto_added: autoAdded.length,
      events_pending_review: pendingReview.length,
    },
    auto_added: autoAdded,
    pending_review: pendingReview.map((d) => ({
      date: d.date, title: d.title, org: d.org, confidence: d.confidence, url: d.url,
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
