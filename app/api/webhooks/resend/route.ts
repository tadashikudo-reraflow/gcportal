import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/webhooks/resend — Resendバウンス/苦情Webhook
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  let rawBody: string;
  let body: { type: string; data?: { to?: string[] } };

  if (webhookSecret) {
    // svix署名検証
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: "Missing svix headers" }, { status: 401 });
    }

    // タイムスタンプが5分以内か確認（リプレイ攻撃防止）
    const ts = parseInt(svixTimestamp, 10);
    if (Math.abs(Date.now() / 1000 - ts) > 300) {
      return NextResponse.json({ error: "Timestamp too old" }, { status: 401 });
    }

    // 署名検証: HMAC-SHA256(svix-id + "." + svix-timestamp + "." + rawBody, secret)
    rawBody = await req.text();
    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
    const secretBytes = Buffer.from(webhookSecret.replace("whsec_", ""), "base64");
    const expectedSig = crypto
      .createHmac("sha256", secretBytes)
      .update(toSign)
      .digest("base64");

    // svix-signatureは "v1,<base64sig>" 形式、複数ある場合はスペース区切り
    const sigs = svixSignature.split(" ").map((s) => s.replace("v1,", ""));
    const valid = sigs.some((sig) => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(sig, "base64"),
          Buffer.from(expectedSig, "base64")
        );
      } catch {
        return false;
      }
    });

    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 検証済みのbodyをparse
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
  } else {
    // 本番環境ではRESEND_WEBHOOK_SECRETの設定を強く推奨
    console.warn("[webhook] RESEND_WEBHOOK_SECRET is not set — signature verification skipped");
    body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
  }

  const { type, data } = body as {
    type: string;
    data?: { to?: string[] };
  };

  if (type !== "email.bounced" && type !== "email.complained") {
    return NextResponse.json({ ok: true });
  }

  const emails: string[] = data?.to ?? [];
  if (emails.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabase();
  await supabase
    .from("leads")
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .in("email", emails);

  return NextResponse.json({ ok: true });
}
