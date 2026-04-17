import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const reportDate = new Date().toISOString().slice(0, 10);

    const { data: rows, error } = await supabase
      .from("ux_events")
      .select("page, event_type, scroll_depth, dwell_ms, session_id, is_mobile")
      .gte("created_at", since.toISOString());

    if (error) throw error;

    // ページ別集計
    const pageMap: Record<string, {
      clicks: number;
      sessions: Set<string>;
      scrollDepths: number[];
      dwells: number[];
      mobileCount: number;
    }> = {};

    for (const row of rows ?? []) {
      if (!pageMap[row.page]) {
        pageMap[row.page] = { clicks: 0, sessions: new Set(), scrollDepths: [], dwells: [], mobileCount: 0 };
      }
      const p = pageMap[row.page];
      p.sessions.add(row.session_id);
      if (row.event_type === "click") p.clicks++;
      if (row.event_type === "leave") {
        if (row.scroll_depth != null) p.scrollDepths.push(row.scroll_depth);
        if (row.dwell_ms != null) p.dwells.push(row.dwell_ms);
      }
      if (row.is_mobile) p.mobileCount++;
    }

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    const data = Object.entries(pageMap).map(([page, d]) => ({
      page,
      sessions: d.sessions.size,
      clicks: d.clicks,
      avg_scroll_pct: avg(d.scrollDepths),
      avg_dwell_s: d.dwells.length ? Math.round(avg(d.dwells)! / 1000) : null,
      mobile_ratio: d.sessions.size > 0 ? Math.round((d.mobileCount / d.sessions.size) * 100) : 0,
    }));

    const warnings = data.filter(
      (r) => (r.avg_scroll_pct ?? 100) < 30 || (r.avg_dwell_s ?? 100) < 10
    );

    // ux_reports に upsert（同じ report_date は上書き）
    const { error: upsertError } = await supabase
      .from("ux_reports")
      .upsert({ report_date: reportDate, period_days: 7, data, warnings }, { onConflict: "report_date" });

    if (upsertError) throw upsertError;

    return NextResponse.json({ ok: true, report_date: reportDate, pages: data.length, warnings: warnings.length });
  } catch (err) {
    console.error("[ux-report cron]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
