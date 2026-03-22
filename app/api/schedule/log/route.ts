/**
 * GET /api/schedule/log — スケジュール変更ログを返す
 */

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const LOG_PATH = join(process.cwd(), "public/data/schedule-log.json");

export async function GET() {
  try {
    const raw = await readFile(LOG_PATH, "utf-8");
    const log = JSON.parse(raw);
    return NextResponse.json(log);
  } catch {
    return NextResponse.json([]);
  }
}
