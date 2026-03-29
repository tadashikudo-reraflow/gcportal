import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // CRON_SECRET による認証
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    // ページ別サマリー集計
    const { data: pageSummary, error } = await supabase
      .from("ux_events")
      .select("page, event_type, scroll_depth, dwell_ms")
      .gte("created_at", since.toISOString());

    if (error) throw error;

    // ページ別に集計
    const pageMap: Record<string, {
      clicks: number;
      sessions: Set<string>;
      scrollDepths: number[];
      dwells: number[];
      leaves: number;
    }> = {};

    const { data: sessionData } = await supabase
      .from("ux_events")
      .select("page, session_id, event_type, scroll_depth, dwell_ms")
      .gte("created_at", since.toISOString());

    for (const row of sessionData ?? []) {
      if (!pageMap[row.page]) {
        pageMap[row.page] = { clicks: 0, sessions: new Set(), scrollDepths: [], dwells: [], leaves: 0 };
      }
      const p = pageMap[row.page];
      p.sessions.add(row.session_id);
      if (row.event_type === "click") p.clicks++;
      if (row.event_type === "leave") {
        p.leaves++;
        if (row.scroll_depth != null) p.scrollDepths.push(row.scroll_depth);
        if (row.dwell_ms != null) p.dwells.push(row.dwell_ms);
      }
    }

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    const rows = Object.entries(pageMap)
      .map(([page, d]) => ({
        page,
        sessions: d.sessions.size,
        clicks: d.clicks,
        avg_scroll: avg(d.scrollDepths),
        avg_dwell_s: d.dwells.length ? Math.round(avg(d.dwells)! / 1000) : null,
        warning: (avg(d.scrollDepths) ?? 100) < 30 || (avg(d.dwells.map(x => x / 1000)) ?? 100) < 10,
      }))
      .sort((a, b) => b.sessions - a.sessions);

    const warnings = rows.filter((r) => r.warning);
    const dateStr = new Date().toISOString().slice(0, 10);

    // Telegram通知
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const warningText =
        warnings.length > 0
          ? warnings.map((r) => `⚠️ ${r.page} (スクロール${r.avg_scroll ?? "?"}% / 滞在${r.avg_dwell_s ?? "?"}s)`).join("\n")
          : "✅ 問題なし";

      const topPages = rows
        .slice(0, 5)
        .map((r) => `${r.page}: ${r.sessions}セッション, スクロール${r.avg_scroll ?? "?"}%`)
        .join("\n");

      const message = [
        `📊 PJ19 UX週次レポート (${dateStr})`,
        "",
        `対象期間: 過去7日間`,
        `計測ページ数: ${rows.length}`,
        "",
        "【アクセス上位】",
        topPages,
        "",
        `【要注意ページ (${warnings.length}件)】`,
        warningText,
        "",
        '「PJ19のUX週次チェックして」で改善提案を確認',
      ].join("\n");

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });
    }

    return NextResponse.json({ ok: true, date: dateStr, pages: rows.length, warnings: warnings.length });
  } catch (err) {
    console.error("[ux-report cron]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
