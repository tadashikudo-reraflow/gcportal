import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel Cron → 毎朝7:00 JST にニュースレター下書きを自動生成
 * 認証: CRON_SECRET ヘッダー or 環境変数一致
 */
export async function GET(req: NextRequest) {
  // Vercel Cron認証
  const cronSecret = req.headers.get("x-cron-secret") ?? req.nextUrl.searchParams.get("secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gcinsight.jp";
  const adminKey = process.env.GCINSIGHT_ADMIN_KEY;

  if (!adminKey) {
    return NextResponse.json({ error: "GCINSIGHT_ADMIN_KEY not set" }, { status: 500 });
  }

  try {
    // 1. generate APIを呼んで下書き作成
    const genRes = await fetch(`${baseUrl}/api/newsletter/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!genRes.ok) {
      const err = await genRes.json().catch(() => ({}));
      throw new Error(`generate failed: ${genRes.status} ${JSON.stringify(err)}`);
    }

    const result = await genRes.json();

    // 2. Telegram通知（設定されている場合）
    await notifyTelegram(
      `📨 GCInsight NL下書き自動生成完了\n\n` +
      `件名: ${result.subject}\n` +
      `収集: X=${result.collected?.x_tweets ?? 0} / note=${result.collected?.note_articles ?? 0} / 公式=${result.collected?.official_news ?? 0}\n` +
      `プレビュー: ${baseUrl}${result.preview_url}\n\n` +
      `確認後「送信して」と指示してください。`
    );

    return NextResponse.json({
      ok: true,
      campaign_id: result.campaign_id,
      subject: result.subject,
      collected: result.collected,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Cron newsletter error:", msg);

    // エラー時もTelegram通知
    await notifyTelegram(`❌ GCInsight NL自動生成失敗\n\n${msg}`);

    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function notifyTelegram(text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // 通知失敗は無視
  }
}
