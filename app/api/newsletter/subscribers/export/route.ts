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

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  // 2. Authorizationヘッダーで確認
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const expectedBasic = `Basic ${Buffer.from(`:${adminPassword}`).toString("base64")}`;
    if (authHeader === expectedBasic) return true;
    // Bearer token (Claude / 外部API)
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      if (token === process.env.GCINSIGHT_ADMIN_KEY) return true;
    }
  }

  // 3. クエリパラメータのauth（ブラウザ直接アクセス用）
  const authParam = req.nextUrl.searchParams.get("auth");
  if (authParam) {
    const expectedBasic = Buffer.from(`:${adminPassword}`).toString("base64");
    if (authParam === expectedBasic) return true;
  }

  return false;
}

// GET /api/newsletter/subscribers/export — CSVエクスポート
export async function GET(req: NextRequest) {
  if (!await checkAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("id, email, organization_type, source, unsubscribed, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const header = ["id", "email", "organization_type", "source", "unsubscribed", "created_at"];
  const csvLines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.id,
        `"${String(r.email ?? "").replace(/"/g, '""')}"`,
        `"${String(r.organization_type ?? "").replace(/"/g, '""')}"`,
        `"${String(r.source ?? "").replace(/"/g, '""')}"`,
        r.unsubscribed ? "true" : "false",
        `"${String(r.created_at ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    ),
  ];
  const csv = csvLines.join("\n");

  const dateStr = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${dateStr}.csv"`,
    },
  });
}
