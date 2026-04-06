import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function verifyToken(leadId: number, token: string): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(String(leadId)).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

async function generateSignedUrl(): Promise<string | null> {
  const supabase = getSupabase();
  const { data } = await supabase.storage
    .from("reports")
    .createSignedUrl("report-2026.pdf", 60 * 60 * 48);
  return data?.signedUrl ?? null;
}

// GET /api/track/pdf?lid=X&token=Y
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lid = parseInt(searchParams.get("lid") ?? "", 10);
  const token = searchParams.get("token") ?? "";

  if (isNaN(lid) || !token || !verifyToken(lid, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  // ダウンロード記録（pdf_downloaded_at がまだ未設定の場合のみ）
  const supabase = getSupabase();
  await supabase
    .from("leads")
    .update({ pdf_downloaded_at: new Date().toISOString() })
    .eq("id", lid)
    .is("pdf_downloaded_at", null);

  // Signed URL 生成 → リダイレクト
  const signedUrl = await generateSignedUrl();
  if (!signedUrl) {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }

  return NextResponse.redirect(signedUrl, 302);
}
