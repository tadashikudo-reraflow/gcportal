import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ORGANIZATION_TYPES = [
  "municipality",
  "it_vendor",
  "consultant",
  "politician",
  "media",
  "other",
] as const;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const ORG_LABELS: Record<string, string> = {
  municipality: "自治体職員",
  it_vendor: "IT企業・SIer",
  consultant: "コンサル・シンクタンク",
  politician: "議員・議員事務所",
  media: "メディア・研究者",
  other: "その他",
};

/** Slack Incoming Webhook 通知 (SLACK_WEBHOOK_URL が設定されている場合のみ) */
async function notifySlack({
  email,
  orgType,
  source,
}: {
  email: string;
  orgType: string;
  source: string;
}) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;

  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `📄 *GCInsight レポートDL通知*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `📄 *新規レポートダウンロード*\n\n*メール:* ${email}\n*所属:* ${ORG_LABELS[orgType] ?? orgType}\n*ソース:* ${source}\n*日時:* ${now}`,
          },
        },
      ],
    }),
  });
}

/** Resend: ユーザーへのPDF配信メール (source="report" のみ) */
async function sendPdfEmail({
  email,
  downloadUrl,
}: {
  email: string;
  downloadUrl: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !downloadUrl) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GCInsight編集部 <noreply@gcinsight.jp>",
      to: email,
      subject: "レポートのダウンロードありがとうございます｜GCInsight",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<p style="font-size:18px;font-weight:bold;margin-bottom:16px">
  📄 <a href="${downloadUrl}" style="color:#2563eb">PDFをダウンロードする（48時間以内有効）→</a>
</p>
<p>ガバメントクラウド移行 全実態レポート2026をダウンロードいただき、ありがとうございます。</p>
<p>本レポートでは、全国1,741自治体の移行状況を約20,000字で徹底解説しています。38.4%というシステム移行率の実態、935団体に上る延長認定の背景、コスト2.3倍増加の構造まで、現場で使えるデータをまとめました。</p>
<p>GCInsightでは今後も、ガバメントクラウド移行に関する最新動向・データ分析・現場の声を定期配信します。次号のニュースレターをぜひお楽しみに。</p>
<p>▶ <a href="https://gcinsight.jp" style="color:#2563eb">ダッシュボードで最新データを確認する →</a></p>
<p>GCInsight編集部</p>
</div>`,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("sendPdfEmail error:", res.status, JSON.stringify(body));
  }
}

/** Resend メール通知 (RESEND_API_KEY + NOTIFY_EMAIL が設定されている場合のみ) */
async function notifyEmail({
  email,
  orgType,
  source,
}: {
  email: string;
  orgType: string;
  source: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GCInsight <noreply@gcinsight.jp>",
      to,
      subject: `[GCInsight] レポートDL: ${email}`,
      html: `<p><strong>新規レポートダウンロード</strong></p>
<ul>
  <li>メール: ${email}</li>
  <li>所属: ${ORG_LABELS[orgType] ?? orgType}</li>
  <li>ソース: ${source}</li>
  <li>日時: ${now}</li>
</ul>`,
    }),
  });
}

/** Telegram Bot 通知 (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID が設定されている場合のみ) */
async function notifyTelegram({
  email,
  orgType,
  source,
}: {
  email: string;
  orgType: string;
  source: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const org = ORG_LABELS[orgType] ?? orgType;
  const text = `📨 GCInsight 新規リード\n\n📧 ${email}\n🏢 ${org}\n📄 ${source}\n🕐 ${now}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("notifyTelegram error:", res.status, JSON.stringify(body));
  }
}

/** Supabase Storage から 48h Signed URL を生成 */
async function generateDownloadUrl(): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceRoleKey) return null;

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data } = await supabase.storage
    .from("reports")
    .createSignedUrl("report-2026.pdf", 60 * 60 * 48); // 48h
  return data?.signedUrl ?? null;
}


/**
 * POST /api/leads — リード（メアド+所属）を保存
 *
 * 保存後、設定に応じて Slack / メール / PDF配信メール（sendPdfEmail）に並列通知する。
 * いずれかの通知が失敗してもリード保存は成功扱い。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, organization_type, source } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    const orgType = ORGANIZATION_TYPES.includes(organization_type)
      ? organization_type
      : "other";

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("leads")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          organization_type: orgType,
          source: source || "report",
        },
        { onConflict: "email" }
      )
      .select("id, email, organization_type")
      .single();

    if (error) {
      console.error("Supabase leads error:", error);
      return NextResponse.json(
        { error: "登録に失敗しました" },
        { status: 500 }
      );
    }

    const effectiveSource = source || "report";

    // PDF配信メール: 全登録者に送信（finopsフォーム統合済みのため条件不要）
    const downloadUrl = await generateDownloadUrl();

    // 通知: Slack / 管理者メール / Telegram（並列実行）
    await Promise.allSettled([
      notifySlack({ email, orgType, source: effectiveSource }),
      notifyEmail({ email, orgType, source: effectiveSource }),
      notifyTelegram({ email, orgType, source: effectiveSource }),
      sendPdfEmail({ email, downloadUrl }), // ユーザーへのPDF配信（report導線のみ）
    ]);

    return NextResponse.json({ success: true, lead: data });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
