import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

async function checkAuth(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) {
    const { verifyAdminToken } = await import("@/lib/auth");
    const payload = await verifyAdminToken(cookieToken);
    if (payload) return true;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const password = decoded.split(":").slice(1).join(":");
    if (password === process.env.ADMIN_PASSWORD) return true;
  }
  if (authHeader?.startsWith("Bearer ")) {
    if (authHeader.slice(7) === process.env.GCINSIGHT_ADMIN_KEY) return true;
  }
  return false;
}

// GET /api/disclosure — 管理者向け全件取得
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("disclosure_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

const CATEGORIES = [
  "migration_plan",
  "delay_reason",
  "cost",
  "vendor",
  "schedule",
  "municipality",
  "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  migration_plan: "移行計画・方針",
  delay_reason: "遅延・未移行の理由",
  cost: "コスト・予算",
  vendor: "ベンダー・調達",
  schedule: "スケジュール",
  municipality: "特定自治体の状況",
  other: "その他",
};

const ORG_LABELS: Record<string, string> = {
  municipality: "自治体職員",
  it_vendor: "IT企業・SIer",
  consultant: "コンサル・シンクタンク",
  politician: "議員・議員事務所",
  media: "メディア・研究者",
  other: "その他",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function notifyTelegram(payload: {
  topic: string;
  category: string;
  municipality?: string;
  orgType?: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const lines = [
    `📨 *新規開示請求リクエスト*`,
    `カテゴリ: ${CATEGORY_LABELS[payload.category] ?? payload.category}`,
    `内容: ${payload.topic}`,
    payload.municipality ? `自治体: ${payload.municipality}` : null,
    payload.orgType ? `所属: ${ORG_LABELS[payload.orgType] ?? payload.orgType}` : null,
    `日時: ${now}`,
  ].filter(Boolean).join("\n");
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: "Markdown" }),
  });
}

async function notifySlack(payload: {
  topic: string;
  category: string;
  municipality?: string;
  orgType?: string;
}) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `📨 *GCInsight 開示請求リクエスト*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: [
              `📨 *新規開示請求リクエスト*`,
              `*カテゴリ:* ${CATEGORY_LABELS[payload.category] ?? payload.category}`,
              `*内容:* ${payload.topic}`,
              payload.municipality ? `*自治体:* ${payload.municipality}` : null,
              payload.orgType ? `*所属:* ${ORG_LABELS[payload.orgType] ?? payload.orgType}` : null,
              `*日時:* ${now}`,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, category, municipality, email, organization_type } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 5) {
      return NextResponse.json(
        { error: "知りたい内容を5文字以上で入力してください" },
        { status: 400 }
      );
    }

    const cat = CATEGORIES.includes(category) ? category : "other";

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("disclosure_requests")
      .insert({
        topic: topic.trim(),
        category: cat,
        municipality: municipality?.trim() || null,
        email: email?.toLowerCase().trim() || null,
        organization_type: organization_type || null,
        status: "received",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase disclosure_requests error:", error);
      return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
    }

    await Promise.all([
      notifySlack({ topic: topic.trim(), category: cat, municipality: municipality?.trim(), orgType: organization_type }),
      notifyTelegram({ topic: topic.trim(), category: cat, municipality: municipality?.trim(), orgType: organization_type }),
    ]);

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
