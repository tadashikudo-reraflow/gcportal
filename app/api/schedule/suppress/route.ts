/**
 * POST /api/schedule/suppress — 棄却したpendingイベントを記録
 * 次回の auto-detect で同じイベントが pending に上がってきたら、
 * suppression に登録済みなら即除外できるようにする。
 *
 * Body: { suppressions: [{ title, org, reason }] }
 */

import { NextRequest, NextResponse } from "next/server";
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

interface Suppression {
  title: string;
  org: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "");
  if (!providedKey || providedKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { suppressions: Suppression[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.suppressions?.length) {
    return NextResponse.json({ error: "suppressions array is required" }, { status: 400 });
  }

  const supabase = getSupabase();
  let added = 0;
  const errors: string[] = [];

  for (const s of body.suppressions) {
    const { error } = await supabase.from("schedule_suppressions").insert({
      title: s.title,
      org: s.org,
      reason: s.reason,
    });
    if (error) {
      errors.push(`${s.title}: ${error.message}`);
    } else {
      added++;
    }
  }

  return NextResponse.json({
    added,
    errors: errors.length ? errors : undefined,
    message: `${added}件のsuppression登録`,
  });
}
