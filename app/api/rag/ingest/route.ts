import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ingestDocument, type DocumentCategory } from "@/lib/rag";

/** POST /api/rag/ingest — ドキュメントをインジェスト（管理者認証必須） */
export async function POST(req: NextRequest) {
  // 管理者認証チェック
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const expected = process.env.ADMIN_PASSWORD ?? "gcinsight2025";
  if (token !== expected) {
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
