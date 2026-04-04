import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

async function checkAuth(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) {
    const { verifyAdminToken } = await import("@/lib/auth");
    const payload = await verifyAdminToken(cookieToken);
    if (payload) return true;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const password = decoded.split(":").slice(1).join(":");
    if (password === process.env.ADMIN_PASSWORD) return true;
  }
  if (authHeader?.startsWith("Bearer ")) {
    if (authHeader.slice(7) === process.env.GCINSIGHT_ADMIN_KEY) return true;
  }
  return false;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const VALID_STATUSES = ["received", "reviewing", "submitted", "disclosed", "rejected"] as const;

// GET /api/disclosure/[id] — 単件取得（管理画面用）
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("disclosure_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

// PATCH /api/disclosure/[id] — status・result_url・notes等の更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const { status, result_url, notes, submitted_at, disclosed_at, result_title, result_summary } = body;

  const updates: Record<string, unknown> = {};
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = status;
    if (status === "submitted" && !submitted_at) {
      updates.submitted_at = new Date().toISOString();
    }
    if (status === "disclosed" && !disclosed_at) {
      updates.disclosed_at = new Date().toISOString();
    }
  }
  if (submitted_at !== undefined) updates.submitted_at = submitted_at;
  if (disclosed_at !== undefined) updates.disclosed_at = disclosed_at;
  if (result_url !== undefined) updates.result_url = result_url || null;
  if (notes !== undefined) updates.notes = notes || null;
  if (result_title !== undefined) updates.result_title = result_title || null;
  if (result_summary !== undefined) updates.result_summary = result_summary || null;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("disclosure_requests")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("disclosure PATCH error:", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}
