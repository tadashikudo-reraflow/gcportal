import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;
  const encoded = authHeader.slice(6);
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [, password] = decoded.split(":");
  return password === process.env.ADMIN_PASSWORD;
}

// GET /api/newsletter/stats/[id]
// email_eventsからopen/click数を集計して返す
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid campaign id" }, { status: 400 });
  }

  const supabase = getSupabase();

  const [{ count: sent }, { data: events }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("email_events")
      .select("event_type, lead_id")
      .eq("campaign_id", id),
  ]);

  const opens = (events ?? []).filter((e) => e.event_type === "open");
  const clicks = (events ?? []).filter((e) => e.event_type === "click");
  const uniqueOpens = new Set(opens.map((e) => e.lead_id)).size;
  const uniqueClicks = new Set(clicks.map((e) => e.lead_id)).size;
  const totalSent = sent ?? 0;

  return NextResponse.json({
    sent: totalSent,
    opens: uniqueOpens,
    open_rate: totalSent > 0 ? Math.round((uniqueOpens / totalSent) * 100) : 0,
    clicks: uniqueClicks,
    click_rate: totalSent > 0 ? Math.round((uniqueClicks / totalSent) * 100) : 0,
  });
}
