import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * Telegram Bot 通知（TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID 設定時のみ）
 * ニュースレター予約配信の結果を即時通知する。
 */
async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error("notifyTelegram error:", res.status, JSON.stringify(body));
    }
  } catch (e) {
    console.error("notifyTelegram exception:", e);
  }
}

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

      // Telegram 通知（成功・失敗両方）
      const nowJst = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
      if (res.ok && data?.success) {
        const sent = data.sent ?? 0;
        const failed = data.failed ?? 0;
        await notifyTelegram(
          `📧 GCInsight ニュースレター配信完了\n\n` +
          `📰 ${campaign.subject}\n` +
          `🆔 campaign_id: ${campaign.id}\n` +
          `✅ 送信: ${sent}件\n` +
          (failed > 0 ? `⚠️ 失敗: ${failed}件\n` : ``) +
          `🕐 ${nowJst}`
        );
      } else {
        await notifyTelegram(
          `🚨 GCInsight ニュースレター配信失敗\n\n` +
          `📰 ${campaign.subject}\n` +
          `🆔 campaign_id: ${campaign.id}\n` +
          `❌ HTTP ${res.status}\n` +
          `📝 ${JSON.stringify(data).slice(0, 300)}\n` +
          `🕐 ${nowJst}`
        );
      }
    } catch (e) {
      results.push({ id: campaign.id, subject: campaign.subject, ok: false, detail: String(e) });
      const nowJst = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
      await notifyTelegram(
        `🚨 GCInsight ニュースレター配信例外\n\n` +
        `📰 ${campaign.subject}\n` +
        `🆔 campaign_id: ${campaign.id}\n` +
        `💥 ${String(e).slice(0, 300)}\n` +
        `🕐 ${nowJst}`
      );
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
