import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import {
  createScrapeJob,
  processScrapeJob,
  getScrapeJob,
  findDataSource,
} from "@/lib/scrape-pipeline";

/**
 * POST /api/scrape/trigger — ジョブ作成＋即時処理開始
 *
 * Body:
 *   { sourceKey: string }              — 単一ソース
 *   { sourceKeys: string[] }           — 複数ソース（バッチ）
 *
 * 単一: createScrapeJob → processScrapeJob（同期実行）
 * 複数: 全ジョブを作成後、最初の1つを処理開始。残りは pending のまま cron に委ねる。
 *
 * Auth: JWT required
 */
export async function POST(req: NextRequest) {
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
    const body = await req.json();

    // sourceKeys（複数）と sourceKey（単一）のどちらかを受け付ける
    let keys: string[];
    if (Array.isArray(body.sourceKeys) && body.sourceKeys.length > 0) {
      keys = body.sourceKeys;
    } else if (typeof body.sourceKey === "string" && body.sourceKey.length > 0) {
      keys = [body.sourceKey];
    } else {
      return NextResponse.json(
        { error: "sourceKey or sourceKeys is required" },
        { status: 400 }
      );
    }

    // 全キーが有効か確認
    const invalid = keys.filter((k) => !findDataSource(k));
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Unknown source keys: ${invalid.join(", ")}` },
        { status: 400 }
      );
    }

    // ジョブを一括作成
    const jobIds: number[] = [];
    for (const key of keys) {
      const source = findDataSource(key)!;
      const jobId = await createScrapeJob(source);
      jobIds.push(jobId);
    }

    // 最初のジョブを即時処理開始（await で同期実行）
    const firstJobId = jobIds[0];
    let processError: string | null = null;
    try {
      await processScrapeJob(firstJobId);
    } catch (err) {
      // 処理中エラーはレスポンスに含めるが 500 にはしない（ジョブは作成済み）
      processError = err instanceof Error ? err.message : String(err);
    }

    // 処理後の最新ジョブ状態を取得
    const firstJob = await getScrapeJob(firstJobId);

    return NextResponse.json({
      jobIds,
      triggered: firstJobId,
      job: firstJob,
      queued: jobIds.slice(1),
      ...(processError ? { processError } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
