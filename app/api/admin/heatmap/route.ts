import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// service_role key はサーバー側でのみ使用（クライアントに公開しない）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page") ?? "/";
  const days = parseInt(searchParams.get("days") ?? "7", 10);

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from("ux_events")
    .select("event_type, x_ratio, y_ratio, scroll_depth, dwell_ms, is_mobile, session_id")
    .eq("page_path", page)
    .gte("created_at", since.toISOString());

  if (error) {
    console.error("[admin/heatmap]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
