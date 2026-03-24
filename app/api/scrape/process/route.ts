import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getNextPendingJob, processScrapeJob, getScrapeJob } from "@/lib/scrape-pipeline";

/**
 * POST /api/scrape/process — 次のpendingスクレイプジョブを処理（cron向け）
 *
 * ダッシュボード表示用データ（scrape_jobs）のみ処理。
 * RAGデータはローカル Oracle 23ai に格納するため、
 * パブコメRSS/デジタル庁RSSのingestはローカル実行。
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

  // ── スクレイプジョブ処理（ダッシュボード用データ更新） ──
  let scrapeResult: { processed: boolean; jobId?: number; status?: string } = {
    processed: false,
  };

  try {
    const job = await getNextPendingJob();

    if (job) {
      await processScrapeJob(job.id);
      const updatedJob = await getScrapeJob(job.id);
      scrapeResult = {
        processed: true,
        jobId: job.id,
        status: updatedJob?.status ?? "unknown",
      };
    }
  } catch (err) {
    scrapeResult = {
      processed: false,
      status: `error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  return NextResponse.json({
    scrape: scrapeResult,
    message: scrapeResult.processed
      ? `Scrape job ${scrapeResult.jobId} ${scrapeResult.status}`
      : "No pending scrape jobs",
  });
}
