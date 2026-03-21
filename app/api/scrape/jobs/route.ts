import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getScrapeJobs, GOV_DATA_SOURCES } from "@/lib/scrape-pipeline";

/**
 * GET /api/scrape/jobs?status=pending — ジョブ一覧取得
 * Auth: JWT required
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(COOKIE_NAME)?.value ??
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const status = req.nextUrl.searchParams.get("status") ?? undefined;
    const jobs = await getScrapeJobs(status);

    return NextResponse.json({
      jobs,
      total: jobs.length,
      availableSources: GOV_DATA_SOURCES.map((s) => ({
        key: s.key,
        name: s.name,
        type: s.type,
        priority: s.priority,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
