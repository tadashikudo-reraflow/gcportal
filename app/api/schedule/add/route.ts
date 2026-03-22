/**
 * POST /api/schedule/add — スケジュールイベントを追加
 *
 * Body:
 * {
 *   "events": [
 *     { "date": "2026-04-15", "title": "...", "org": "デジタル庁", "url": "...", "important": false }
 *   ]
 * }
 *
 * Admin key 認証必須。
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const SCHEDULE_PATH = join(process.cwd(), "public/data/schedule.json");
const ADMIN_KEY = process.env.GCINSIGHT_ADMIN_KEY || "";

interface NewEvent {
  date: string;
  title: string;
  org: string;
  url?: string;
  important?: boolean;
  note?: string;
}

export async function POST(req: NextRequest) {
  // Admin key check
  const authHeader = req.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "") || "";
  if (ADMIN_KEY && providedKey !== ADMIN_KEY) {
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

  // Validate events
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

  // Read current schedule
  let schedule: Record<string, unknown>;
  try {
    const raw = await readFile(SCHEDULE_PATH, "utf-8");
    schedule = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to read schedule" }, { status: 500 });
  }

  const existingEvents = (schedule.recent_schedule as { date: string; title: string }[]) || [];
  const existingTitles = new Set(existingEvents.map((e) => e.title));

  const today = new Date().toISOString().slice(0, 10);
  let addedCount = 0;
  let skippedCount = 0;

  for (const ev of body.events) {
    // Duplicate check
    if (existingTitles.has(ev.title)) {
      skippedCount++;
      continue;
    }

    const newEvent: Record<string, unknown> = {
      date: ev.date,
      status: ev.date < today ? "done" : "upcoming",
      title: ev.title,
      org: ev.org,
    };
    if (ev.important) newEvent.important = true;
    if (ev.note) newEvent.note = ev.note;
    if (ev.url) newEvent.url = ev.url;

    existingEvents.push(newEvent as { date: string; title: string });
    existingTitles.add(ev.title);
    addedCount++;
  }

  // Sort by date
  existingEvents.sort((a, b) => a.date.localeCompare(b.date));

  // Update
  schedule.recent_schedule = existingEvents;
  schedule.last_updated = today;

  try {
    await writeFile(SCHEDULE_PATH, JSON.stringify(schedule, null, 2) + "\n", "utf-8");
  } catch {
    return NextResponse.json({ error: "Failed to write schedule" }, { status: 500 });
  }

  return NextResponse.json({
    added: addedCount,
    skipped: skippedCount,
    total: existingEvents.length,
    message: `${addedCount}件追加、${skippedCount}件重複スキップ`,
  });
}
