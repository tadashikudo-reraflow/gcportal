import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function generateUnsubscribeToken(leadId: number): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is required for unsubscribe token verification");
  return crypto.createHmac("sha256", secret).update(String(leadId)).digest("hex");
}

// GET /api/unsubscribe?token=xxxx&lid=yyyy
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const lidParam = searchParams.get("lid");

  if (!token || !lidParam) {
    return NextResponse.redirect(new URL("/unsubscribe/invalid", req.url));
  }

  const leadId = parseInt(lidParam, 10);
  if (isNaN(leadId)) {
    return NextResponse.redirect(new URL("/unsubscribe/invalid", req.url));
  }

  // トークン検証
  const expected = generateUnsubscribeToken(leadId);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(token, "hex"),
    Buffer.from(expected, "hex")
  );

  if (!isValid) {
    return NextResponse.redirect(new URL("/unsubscribe/invalid", req.url));
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("leads")
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    console.error("unsubscribe update error:", error);
    return NextResponse.redirect(new URL("/unsubscribe/invalid", req.url));
  }

  return NextResponse.redirect(new URL("/unsubscribe/confirmed", req.url));
}
