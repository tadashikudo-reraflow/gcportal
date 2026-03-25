import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const STORAGE_BUCKET = "reports";
const STORAGE_PATH = "report-2026.pdf";
const SIGNED_URL_TTL = 3600; // 1時間

/**
 * GET /api/report/download
 *
 * Supabase Storage から signed URL を発行して返す。
 * PDFがStorageに未登録の場合は 404 を返す。
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(STORAGE_PATH, SIGNED_URL_TTL);

  if (error || !data?.signedUrl) {
    console.error("signed URL error:", error?.message);
    return NextResponse.json(
      { error: "PDFが準備中です。しばらくお待ちください。" },
      { status: 404 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
