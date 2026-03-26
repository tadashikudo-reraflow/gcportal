import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://gcinsight.jp";
const FROM = "GCInsight編集部 <noreply@gcinsight.jp>";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAuth(req: NextRequest): Promise<boolean> {
  // 1. JWT cookie（管理画面ブラウザ）
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) {
    const { verifyAdminToken } = await import("@/lib/auth");
    const payload = await verifyAdminToken(cookieToken);
    if (payload) return true;
  }

  const authHeader = req.headers.get("authorization");
  // 2. Basic auth（レガシー・後方互換）
  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice(6);
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const [, password] = decoded.split(":");
    if (password === process.env.ADMIN_PASSWORD) return true;
  }
  // 3. Bearer token (Claude / 外部API)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token === process.env.GCINSIGHT_ADMIN_KEY) return true;
  }
  return false;
}

function generateUnsubscribeToken(leadId: number): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is required for unsubscribe token generation");
  return crypto.createHmac("sha256", secret).update(String(leadId)).digest("hex");
}

function addUnsubscribeFooter(html: string, leadId: number): string {
  const token = generateUnsubscribeToken(leadId);
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${token}&lid=${leadId}`;
  const footer = `<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
  <p>配信停止は<a href="${unsubscribeUrl}" style="color:#6b7280;">こちら</a>からお願いします。</p>
  <p>© 2026 GCInsight | <a href="https://reraflow.com/contact/" style="color:#6b7280;">お問い合わせ</a></p>
</div>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }
  return html + footer;
}

// POST /api/newsletter/send-test
export async function POST(req: NextRequest) {
  if (!await checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { campaign_id, test_email } = body as {
    campaign_id: number;
    test_email: string;
  };

  if (!campaign_id || typeof campaign_id !== "number") {
    return NextResponse.json(
      { error: "campaign_id is required" },
      { status: 400 }
    );
  }

  if (!test_email || typeof test_email !== "string") {
    return NextResponse.json(
      { error: "test_email is required" },
      { status: 400 }
    );
  }

  // メールアドレス形式バリデーション
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(test_email)) {
    return NextResponse.json(
      { error: "無効なメールアドレス形式です" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  const supabase = getSupabase();
  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("id, subject, body_html")
    .eq("id", campaign_id)
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // テスト送信: lead_id=0, statusは変更しない
  const testHtml = addUnsubscribeFooter(campaign.body_html, 0);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: test_email,
      subject: `[TEST] ${campaign.subject}`,
      html: testHtml,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    console.error("Resend test send error:", res.status, JSON.stringify(errBody));
    return NextResponse.json(
      { error: "送信に失敗しました", detail: errBody },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, to: test_email });
}
