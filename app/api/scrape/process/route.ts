import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getNextPendingJob, processScrapeJob, getScrapeJob } from "@/lib/scrape-pipeline";

/**
 * POST /api/scrape/process — 次のpendingジョブを処理（cron向け）
 *
 * Auth: JWT or CRON_SECRET header
 * Header: x-cron-secret: <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  // 認証: JWT または CRON_SECRET
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedCronSecret = process.env.CRON_SECRET;

  let authorized = false;

  // CRON_SECRET チェック
  if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
    authorized = true;
  }

  // JWT チェック（CRON_SECRETで認証されなかった場合）
  if (!authorized) {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(COOKIE_NAME)?.value ??
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (token) {
      const payload = await verifyAdminToken(token);
      if (payload) authorized = true;
    }
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const job = await getNextPendingJob();

    if (!job) {
      return NextResponse.json({
        message: "No pending jobs",
        processed: false,
      });
    }

    await processScrapeJob(job.id);

    // 処理後のステータスを取得
    const updatedJob = await getScrapeJob(job.id);

    return NextResponse.json({
      message: `Job ${job.id} processed`,
      processed: true,
      job: updatedJob,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
