/**
 * POST /api/schedule/add — スケジュールイベントを追加（Supabase版）
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const ADMIN_KEY = process.env.GCINSIGHT_ADMIN_KEY;
if (!ADMIN_KEY) {
  throw new Error("GCINSIGHT_ADMIN_KEY is not configured");
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface NewEvent {
  date: string;
  title: string;
  org: string;
  url?: string;
  important?: boolean;
  note?: string;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "");
  if (!providedKey || providedKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { events: NewEvent[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
    return NextResponse.json({ error: "events array is required" }, { status: 400 });
  }

  for (const ev of body.events) {
    if (!ev.date || !ev.title || !ev.org) {
      return NextResponse.json(
        { error: "Each event must have date, title, and org" },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) {
      return NextResponse.json(
        { error: `Invalid date format: ${ev.date}. Use YYYY-MM-DD` },
        { status: 400 }
      );
    }
  }

  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);

  // 既存タイトル取得（重複チェック用）
  const { data: existing } = await supabase
    .from("schedule_events")
    .select("title");
  const existingTitles = new Set((existing ?? []).map((e) => e.title as string));

  let addedCount = 0;
  let skippedCount = 0;

  for (const ev of body.events) {
    if (existingTitles.has(ev.title)) {
      skippedCount++;
      continue;
    }

    const { error } = await supabase.from("schedule_events").insert({
      date: ev.date,
      status: ev.date < today ? "done" : "upcoming",
      title: ev.title,
      org: ev.org,
      important: ev.important ?? false,
      note: ev.note ?? null,
      url: ev.url ?? null,
      source: "manual",
    });

    if (!error) {
      existingTitles.add(ev.title);
      addedCount++;
    }
  }

  if (addedCount > 0) revalidatePath("/timeline");

  return NextResponse.json({
    added: addedCount,
    skipped: skippedCount,
    message: `${addedCount}件追加、${skippedCount}件重複スキップ`,
  });
}
