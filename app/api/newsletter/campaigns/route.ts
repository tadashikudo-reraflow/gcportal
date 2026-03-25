import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;
  const encoded = authHeader.slice(6);
  const decoded = Buffer.from(encoded, "base64").toString("utf-8");
  const [, password] = decoded.split(":");
  return password === process.env.ADMIN_PASSWORD;
}

// GET /api/newsletter/campaigns — 一覧取得
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `id, subject, status, sent_at, created_at,
       open_count:email_events(count).filter(event_type.eq.open)`
    )
    .order("created_at", { ascending: false });

  if (error) {
    // aggregate subquery may not be supported; fall back to simple select
    const { data: simple, error: err2 } = await supabase
      .from("campaigns")
      .select("id, subject, status, sent_at, created_at")
      .order("created_at", { ascending: false });
    if (err2) {
      return NextResponse.json({ error: err2.message }, { status: 500 });
    }

    // fetch open counts separately
    const { data: opens } = await supabase
      .from("email_events")
      .select("campaign_id")
      .eq("event_type", "open");

    const openMap: Record<number, number> = {};
    for (const o of opens ?? []) {
      openMap[o.campaign_id] = (openMap[o.campaign_id] ?? 0) + 1;
    }

    const result = (simple ?? []).map((c) => ({
      ...c,
      open_count: openMap[c.id] ?? 0,
    }));
    return NextResponse.json(result);
  }

  return NextResponse.json(data ?? []);
}

// POST /api/newsletter/campaigns — 新規作成（下書き保存）
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { subject, body_html } = body;

  if (!subject || typeof subject !== "string") {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      subject: subject.trim(),
      body_html: body_html ?? "",
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
