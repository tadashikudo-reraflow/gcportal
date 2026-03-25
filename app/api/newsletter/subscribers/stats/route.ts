import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

// GET /api/newsletter/subscribers/stats — 過去30日の日次購読者集計
export async function GET(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // 過去30日の日付リストを生成
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
  });

  const startDate = days[0] + "T00:00:00.000Z";

  // leadsテーブルからcreated_atを取得
  const { data, error } = await supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", startDate)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 日次カウントの集計
  const countMap: Record<string, number> = {};
  for (const row of data ?? []) {
    const day = (row.created_at as string).slice(0, 10);
    countMap[day] = (countMap[day] ?? 0) + 1;
  }

  const counts = days.map((d) => countMap[d] ?? 0);

  // 30日開始より前の購読者数（累積ベース）
  const { count: preCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .lt("created_at", startDate);

  let base = preCount ?? 0;
  const cumulative = counts.map((c) => {
    base += c;
    return base;
  });

  return NextResponse.json({ dates: days, counts, cumulative });
}
