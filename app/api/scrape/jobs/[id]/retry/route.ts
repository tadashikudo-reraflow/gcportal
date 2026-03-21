import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getScrapeJob, processScrapeJob } from "@/lib/scrape-pipeline";
import { createClient } from "@supabase/supabase-js";

type RouteContext = { params: Promise<{ id: string }> };

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  return createClient(url, key);
}

/**
 * POST /api/scrape/jobs/:id/retry — 失敗ジョブをリトライ
 *
 * 指定 ID のジョブを "pending" に戻し、retry_count をリセットして再処理する。
 * failed / skipped / completed 状態のジョブを対象とする。
 *
 * Auth: JWT required
 */
export async function POST(req: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;
    const jobId = parseInt(id, 10);
    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // ジョブ存在確認
    const job = await getScrapeJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // processing 中はリトライ不可
    if (job.status === "processing") {
      return NextResponse.json(
        { error: "Job is currently processing. Wait for it to finish." },
        { status: 409 }
      );
    }

    // ステータスを pending に戻し、retry_count をリセット
    const supabase = getServiceClient();
    const { error: updateError } = await supabase
      .from("scrape_jobs")
      .update({
        status: "pending",
        retry_count: 0,
        error_message: null,
        processed_at: null,
      })
      .eq("id", jobId);

    if (updateError) {
      throw new Error(`Failed to reset job: ${updateError.message}`);
    }

    // 即時再処理
    let processError: string | null = null;
    try {
      await processScrapeJob(jobId);
    } catch (err) {
      processError = err instanceof Error ? err.message : String(err);
    }

    // 最新状態を返す
    const updatedJob = await getScrapeJob(jobId);

    return NextResponse.json({
      message: `Job ${jobId} retried`,
      job: updatedJob,
      ...(processError ? { processError } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
