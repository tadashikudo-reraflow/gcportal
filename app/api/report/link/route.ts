import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/report/link?email=xxx
 *
 * Beehiiv Welcome Email から叩かれるエンドポイント。
 * メールアドレスが leads テーブルに存在する場合、
 * Supabase Storage から 48h Signed URL を生成してリダイレクトする。
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.toLowerCase().trim();

  if (!email || !email.includes("@")) {
    return NextResponse.redirect(new URL("/report", req.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.redirect(new URL("/report", req.url));
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // リードの存在確認
  const { data: lead } = await supabase
    .from("leads")
    .select("id")
    .eq("email", email)
    .single();

  if (!lead) {
    // 未登録の場合はレポートページへ
    return NextResponse.redirect(new URL("/report", req.url));
  }

  // Signed URL 生成（48h）
  const { data } = await supabase.storage
    .from("reports")
    .createSignedUrl("report-2026.pdf", 60 * 60 * 48);

  if (!data?.signedUrl) {
    return NextResponse.redirect(new URL("/report", req.url));
  }

  return NextResponse.redirect(data.signedUrl);
}
