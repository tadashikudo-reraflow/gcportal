import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/newsletter/cron-send
 * Vercel Cron（毎時0分）から呼ばれ、scheduled_at <= now() のキャンペーンを自動送信する。
 * Authorization: Bearer CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // scheduled_at <= now() かつ status = 'scheduled' のキャンペーンを取得
  const now = new Date().toISOString();
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, subject")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ sent: 0, message: "No scheduled campaigns to send" });
  }

  const results: Array<{ id: number; subject: string; ok: boolean; detail?: string }> = [];

  for (const campaign of campaigns) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gcinsight.jp";
      const res = await fetch(`${baseUrl}/api/newsletter/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GCINSIGHT_ADMIN_KEY}`,
        },
        body: JSON.stringify({ campaign_id: campaign.id }),
      });
      const data = await res.json();
      results.push({ id: campaign.id, subject: campaign.subject, ok: res.ok, detail: JSON.stringify(data) });
    } catch (e) {
      results.push({ id: campaign.id, subject: campaign.subject, ok: false, detail: String(e) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
