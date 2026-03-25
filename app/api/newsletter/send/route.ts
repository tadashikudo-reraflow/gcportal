import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://gcinsight.jp";

function generateUnsubscribeToken(leadId: number): string {
  const secret = process.env.CRON_SECRET ?? "fallback-secret";
  return crypto.createHmac("sha256", secret).update(String(leadId)).digest("hex");
}

function addUnsubscribeFooter(html: string, leadId: number): string {
  const token = generateUnsubscribeToken(leadId);
  const unsubscribeUrl = `${BASE_URL}/api/unsubscribe?token=${token}&lid=${leadId}`;

  // Note CTA ブロック（NOTE_CTA_ENABLED=true の場合のみ追加）
  const noteCtaEnabled = process.env.NOTE_CTA_ENABLED === "true";
  const noteUrl = process.env.NOTE_URL ?? "https://note.com/";
  const noteCta = noteCtaEnabled
    ? `<div style="margin-top:24px;padding:20px;background:#f9fafb;border-radius:8px;text-align:center;">
  <p style="font-size:14px;color:#374151;margin:0 0 12px;">さらに深い分析はnoteで</p>
  <a href="${noteUrl}" style="display:inline-block;padding:10px 24px;background:#111;color:#fff;border-radius:6px;font-size:13px;text-decoration:none;">noteで読む →</a>
</div>`
    : "";

  const footer = `${noteCta}<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#9ca3af;">
  <p>配信停止は<a href="${unsubscribeUrl}" style="color:#6b7280;">こちら</a>からお願いします。</p>
  <p>© 2026 GCInsight | 〒100-0000 東京都</p>
</div>`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }
  return html + footer;
}

const FROM = "GCInsight編集部 <noreply@gcinsight.jp>";
const BATCH_SIZE = 100;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

/** href属性のURLをトラッキングURLに置換する */
function replaceLinks(
  html: string,
  campaignId: number,
  leadId: number
): string {
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, url) => {
      const trackUrl = `${BASE_URL}/api/track/click?url=${encodeURIComponent(
        url
      )}&cid=${campaignId}&lid=${leadId}`;
      return `href="${trackUrl}"`;
    }
  );
}

/** 開封トラッキングピクセルを挿入する */
function addTrackingPixel(
  html: string,
  campaignId: number,
  leadId: number
): string {
  const pixel = `<img src="${BASE_URL}/api/track/open?cid=${campaignId}&lid=${leadId}" width="1" height="1" alt="" style="display:none" />`;
  // </body> の前に挿入、なければ末尾に追加
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`);
  }
  return html + pixel;
}

// POST /api/newsletter/send
export async function POST(req: NextRequest) {
  if (!await checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { campaign_id } = body;

  if (!campaign_id || typeof campaign_id !== "number") {
    return NextResponse.json(
      { error: "campaign_id is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();

  // キャンペーン取得
  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("id, subject, body_html, status")
    .eq("id", campaign_id)
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status === "sent") {
    return NextResponse.json(
      { error: "このキャンペーンはすでに送信済みです" },
      { status: 400 }
    );
  }

  // リード一覧取得（未購読解除のみ）
  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("id, email")
    .or("unsubscribed.is.null,unsubscribed.eq.false");

  if (leadsErr) {
    return NextResponse.json({ error: leadsErr.message }, { status: 500 });
  }

  if (!leads || leads.length === 0) {
    return NextResponse.json({ error: "送信先がいません" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY が設定されていません" },
      { status: 500 }
    );
  }

  let totalSent = 0;
  let totalFailed = 0;

  // バッチ送信（最大100件/バッチ）
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);

    const emails = batch.map((lead) => {
      const personalizedHtml = addTrackingPixel(
        addUnsubscribeFooter(
          replaceLinks(campaign.body_html, campaign_id, lead.id),
          lead.id
        ),
        campaign_id,
        lead.id
      );

      return {
        from: FROM,
        to: lead.email,
        subject: campaign.subject,
        html: personalizedHtml,
      };
    });

    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emails),
    });

    if (res.ok) {
      totalSent += batch.length;
    } else {
      const errBody = await res.json().catch(() => ({}));
      console.error("Resend batch error:", res.status, JSON.stringify(errBody));
      totalFailed += batch.length;
    }
  }

  // キャンペーンのステータスを更新
  await supabase
    .from("campaigns")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", campaign_id);

  return NextResponse.json({ success: true, sent: totalSent, failed: totalFailed });
}
