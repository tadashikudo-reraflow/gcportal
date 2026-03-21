import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { GOV_DATA_SOURCES, getScrapeJobs } from "@/lib/scrape-pipeline";

/**
 * GET /api/scrape/sources — データソース一覧取得
 *
 * 各ソースに最新ジョブ情報（status, processed_at）を付加して返す。
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
    // 全ジョブを取得し、source_key ごとに最新ジョブを引く
    const allJobs = await getScrapeJobs();

    // source_key → 最新ジョブ のマップ（created_at降順なので先頭が最新）
    const latestJobByKey = new Map(
      allJobs.map((job) => [job.source_key, job])
    );

    const sources = GOV_DATA_SOURCES.map((source) => {
      const latestJob = latestJobByKey.get(source.key) ?? null;
      return {
        key: source.key,
        name: source.name,
        url: source.url,
        type: source.type,
        organization: source.organization,
        category: source.category,
        schedule: source.schedule ?? null,
        priority: source.priority,
        // 最新ジョブ情報
        latestJob: latestJob
          ? {
              id: latestJob.id,
              status: latestJob.status,
              processed_at: latestJob.processed_at,
              error_message: latestJob.error_message,
              retry_count: latestJob.retry_count,
            }
          : null,
      };
    });

    return NextResponse.json({ sources, total: sources.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
