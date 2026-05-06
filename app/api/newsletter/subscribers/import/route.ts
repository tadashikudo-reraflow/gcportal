import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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
    const adminKey = process.env.GCINSIGHT_ADMIN_KEY;
    if (token && adminKey && token === adminKey) return true;
  }
  return false;
}

// POST /api/newsletter/subscribers/import — CSVインポート
export async function POST(req: NextRequest) {
  if (!await checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.csv !== "string") {
    return NextResponse.json({ error: "csv is required" }, { status: 400 });
  }

  const lines = body.csv
    .split("\n")
    .map((line: string) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0 });
  }

  // ヘッダー行をスキップ（1行目が "email" で始まる場合）
  const dataLines = lines[0].toLowerCase().startsWith("email")
    ? lines.slice(1)
    : lines;

  // email,organization_type 形式または email のみ
  const records = dataLines
    .map((line: string) => {
      const parts = line.split(",");
      const email = parts[0].trim().toLowerCase().replace(/^"|"$/g, "");
      const organization_type = parts[1]?.trim().replace(/^"|"$/g, "") ?? "";
      return { email, organization_type };
    })
    .filter(({ email }: { email: string }) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  if (records.length === 0) {
    return NextResponse.json({ imported: 0, skipped: 0 });
  }

  const supabase = getSupabase();

  // 既存メール一覧を取得してスキップ数を計算
  const emails = records.map((r: { email: string }) => r.email);
  const { data: existing } = await supabase
    .from("leads")
    .select("email")
    .in("email", emails);

  const existingSet = new Set((existing ?? []).map((r: { email: string }) => r.email));
  const newRecords = records.filter(
    (r: { email: string }) => !existingSet.has(r.email)
  );
  const skipped = records.length - newRecords.length;

  if (newRecords.length === 0) {
    return NextResponse.json({ imported: 0, skipped });
  }

  const { error } = await supabase.from("leads").insert(
    newRecords.map((r: { email: string; organization_type: string }) => ({
      email: r.email,
      organization_type: r.organization_type || null,
      source: "csv_import",
    }))
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: newRecords.length, skipped });
}
