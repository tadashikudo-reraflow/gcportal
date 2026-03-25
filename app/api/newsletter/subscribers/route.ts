import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET /api/newsletter/subscribers — 購読者一覧（管理画面内部専用。認証はミドルウェアに委譲）
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("id, email, organization_type, source, created_at, unsubscribed")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// PATCH /api/newsletter/subscribers — 一括更新（unsubscribedフラグ）
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }
  const { ids, unsubscribed } = body as { ids: number[]; unsubscribed: boolean };

  const supabase = getSupabase();
  const updateData: Record<string, unknown> = { unsubscribed: !!unsubscribed };
  if (unsubscribed) {
    updateData.unsubscribed_at = new Date().toISOString();
  } else {
    updateData.unsubscribed_at = null;
  }

  const { error } = await supabase
    .from("leads")
    .update(updateData)
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ updated: ids.length });
}

// DELETE /api/newsletter/subscribers — 一括削除
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }
  const { ids } = body as { ids: number[] };

  const supabase = getSupabase();
  const { error } = await supabase
    .from("leads")
    .delete()
    .in("id", ids);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: ids.length });
}
