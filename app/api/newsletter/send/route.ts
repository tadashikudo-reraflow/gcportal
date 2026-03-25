import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://gcinsight.jp";
const FROM = "GCInsight編集部 <noreply@gcinsight.jp>";
const BATCH_SIZE = 100;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
  if (!checkAuth(req)) {
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

  // リード一覧取得
  const { data: leads, error: leadsErr } = await supabase
    .from("leads")
    .select("id, email");

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
        replaceLinks(campaign.body_html, campaign_id, lead.id),
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
