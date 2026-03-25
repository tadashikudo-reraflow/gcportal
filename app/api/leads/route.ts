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

/** Beehiiv 購読者追加 (BEEHIIV_API_KEY + BEEHIIV_PUBLICATION_ID が設定されている場合のみ) */
async function notifyBeehiiv({
  email,
  orgType,
}: {
  email: string;
  orgType: string;
}) {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !pubId) return;

  await fetch(
    `https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        reactivate_existing: true,
        send_welcome_email: true,
        custom_fields: [{ name: "organization_type", value: orgType }],
      }),
    }
  );
}

/**
 * POST /api/leads — リード（メアド+所属）を保存
 *
 * 保存後、設定に応じて Slack / メール / Beehiiv に並列通知する。
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

    // 通知: Slack / メール（設定されていれば並列実行）
    await Promise.allSettled([
      notifySlack({ email, orgType, source: source || "report" }),
      notifyEmail({ email, orgType, source: source || "report" }),
      notifyBeehiiv({ email, orgType }),
    ]);

    return NextResponse.json({ success: true, lead: data });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
