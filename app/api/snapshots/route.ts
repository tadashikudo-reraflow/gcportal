import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getSnapshots, createSnapshotFromJson } from "@/lib/snapshot";
import { readFile } from "fs/promises";
import { join } from "path";

/** GET /api/snapshots — 時系列スナップショット一覧（公開） */
export async function GET() {
  try {
    const snapshots = await getSnapshots();
    return NextResponse.json({ snapshots });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/snapshots — 現在のstandardization.jsonからスナップショット生成（管理者専用） */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedCron = process.env.CRON_SECRET;

  const isAuthed = token && (await verifyAdminToken(token));
  const isCron = cronSecret && expectedCron && cronSecret === expectedCron;

  if (!isAuthed && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const filePath = join(process.cwd(), "public/data/standardization.json");
    const raw = await readFile(filePath, "utf-8");
    const json = JSON.parse(raw);

    await createSnapshotFromJson(json);

    return NextResponse.json({
      success: true,
      dataMonth: json.summary.data_month,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
