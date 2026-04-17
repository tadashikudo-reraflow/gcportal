import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { LATEST_SLUG } from "@/app/members/reports";

const BASE_URL = "https://gcinsight.jp";

function generatePdfTrackingUrl(leadId: number): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  const token = crypto.createHmac("sha256", secret).update(String(leadId)).digest("hex");
  return `${BASE_URL}/api/track/pdf?lid=${leadId}&token=${token}`;
}

const ORGANIZATION_TYPES = [
  // GCInsight（ガバメントクラウド）
  "municipality",
  "it_vendor",
  "consultant",
  "politician",
  "media",
  // karte（電子カルテ標準化）
  "hospital_staff",
  "medical_it",
  "hospital_mgmt",
  "researcher",
  // 共通
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
  // GCInsight（ガバメントクラウド）
  municipality: "自治体職員",
  it_vendor: "IT企業・SIer",
  consultant: "コンサル・シンクタンク",
  politician: "議員・議員事務所",
  media: "メディア・研究者",
  // karte（電子カルテ標準化）
  hospital_staff: "病院・クリニック職員",
  medical_it: "医療IT・HISベンダー",
  hospital_mgmt: "病院経営・事務管理",
  researcher: "研究者・学術機関",
  // 共通
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

/** Resend: ユーザーへのPDF配信メール */
async function sendPdfEmail({
  email,
  trackingUrl,
}: {
  email: string;
  trackingUrl: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !trackingUrl) return;

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
  📄 <a href="${trackingUrl}" style="color:#2563eb">PDFをダウンロードする（48時間以内有効）→</a>
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

/** 最新の送信済みニュースレターを新規登録者に配信 */
async function sendLatestNewsletter({
  email,
  leadId,
}: {
  email: string;
  leadId: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const supabase = getSupabase();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, subject, body_html")
    .eq("status", "sent")
    .order("sent_at", { ascending: false })
    .limit(1)
    .single();

  if (!campaign?.body_html) return;

  // 配信停止フッターを追加（HMAC署名付きURL）
  const secret = process.env.CRON_SECRET;
  if (!secret) return;
  const token = crypto
    .createHmac("sha256", secret)
    .update(String(leadId))
    .digest("hex");
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${token}&lid=${leadId}`;
  const footer = `<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
  <p>配信停止は<a href="${unsubscribeUrl}" style="color:#6b7280;">こちら</a>からお願いします。</p>
  <p>© 2026 GCInsight | <a href="https://reraflow.com/contact/" style="color:#6b7280;">お問い合わせ</a></p>
</div>`;
  const bodyHtml = campaign.body_html.includes("</body>")
    ? campaign.body_html.replace("</body>", `${footer}</body>`)
    : campaign.body_html + footer;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GCInsight編集部 <noreply@gcinsight.jp>",
      to: email,
      subject: campaign.subject,
      html: bodyHtml,
    }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error("sendLatestNewsletter error:", res.status, JSON.stringify(errBody));
  }
}

/** Resend: ニュースレター登録ウェルカムメール */
async function sendNewsletterWelcomeEmail({ email }: { email: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const memberReportUrl = `${BASE_URL}/members/${LATEST_SLUG}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "GCInsight編集部 <noreply@gcinsight.jp>",
      to: email,
      subject: "ニュースレター登録ありがとうございます｜GCInsight",
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937">
<p style="font-size:20px;font-weight:bold;margin-bottom:8px;color:#00338D">
  📬 GCInsightニュースレターへようこそ
</p>
<p>ガバメントクラウド・自治体情報システム標準化の最新動向を、毎週まとめてお届けします。</p>
<p style="margin-top:20px"><strong>🔒 登録特典：最新限定レポートを無料でプレゼント</strong></p>
<p style="margin-bottom:16px">会員限定コンテンツとして、最新の深掘りレポートをご用意しています。</p>
<p style="margin-bottom:24px">
  ▶ <a href="${memberReportUrl}" style="color:#2563eb;font-weight:bold">限定レポートを読む（会員専用URL）→</a>
</p>
<p><strong>今後お届けする内容：</strong></p>
<ul style="padding-left:20px;line-height:1.8">
  <li>総務省・デジタル庁の最新動向</li>
  <li>全国1,741自治体の移行進捗データ更新</li>
  <li>ベンダー・クラウド動向の分析</li>
  <li>コスト・FinOps関連の事例・解説</li>
</ul>
<p style="margin-top:24px">
  ▶ <a href="https://gcinsight.jp" style="color:#2563eb;font-weight:bold">ダッシュボードで今すぐデータを確認する →</a>
</p>
<p style="margin-top:32px;font-size:12px;color:#6b7280">
  配信停止はいつでも可能です。<a href="https://gcinsight.jp/unsubscribe" style="color:#6b7280">こちらから解除</a><br>
  ※限定レポートのURLは第三者への共有はご遠慮ください。
</p>
<p>GCInsight編集部</p>
</div>`,
    }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("sendNewsletterWelcomeEmail error:", res.status, JSON.stringify(body));
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

    // PDFトラッキングURL生成（HMAC署名付き）
    const trackingUrl = generatePdfTrackingUrl(data.id);

    // ソース別メール分岐: newsletter系はウェルカムメール / それ以外はPDF配信
    const isNewsletterSource = effectiveSource.startsWith("newsletter");

    // ユーザーへのメール: newsletter系はウェルカムメール＋最新号 / それ以外はPDF配信
    const emailTasks = isNewsletterSource
      ? [
          sendNewsletterWelcomeEmail({ email }),
          sendLatestNewsletter({ email, leadId: data.id }),
        ]
      : [sendPdfEmail({ email, trackingUrl })];

    // 通知: Slack / 管理者メール / Telegram + ユーザーメール（並列実行）
    await Promise.allSettled([
      notifySlack({ email, orgType, source: effectiveSource }),
      notifyEmail({ email, orgType, source: effectiveSource }),
      notifyTelegram({ email, orgType, source: effectiveSource }),
      ...emailTasks,
    ]);

    return NextResponse.json({ success: true, lead: data });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
