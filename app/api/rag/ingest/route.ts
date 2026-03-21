import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { ingestDocument, type DocumentCategory } from "@/lib/rag";

/** POST /api/rag/ingest — ドキュメントをインジェスト（管理者認証 or CRON_SECRET） */
export async function POST(req: NextRequest) {
  // JWT認証 or CRON_SECRET（自動パイプライン用）
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
    const body = await req.json();
    const { title, content, fileName, fileType, sourceUrl, organization, category, metadata } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }

    const result = await ingestDocument({
      title,
      content,
      fileName,
      fileType,
      sourceUrl,
      organization,
      category: category as DocumentCategory | undefined,
      metadata,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
