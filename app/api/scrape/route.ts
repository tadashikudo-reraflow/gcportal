import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import {
  createScrapeJob,
  findDataSource,
  type DataSource,
  type DataSourceType,
  type DataSourceCategory,
} from "@/lib/scrape-pipeline";

/**
 * POST /api/scrape — スクレイプジョブ作成
 *
 * Body:
 *   { sourceKey: string }
 *   or { url: string, type: string, name: string, organization?: string, category?: string, priority?: string }
 *
 * Auth: JWT required
 */
export async function POST(req: NextRequest) {
  // 認証チェック
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

    let source: DataSource;

    if (body.sourceKey) {
      // 登録済みデータソースから取得
      const found = findDataSource(body.sourceKey);
      if (!found) {
        return NextResponse.json(
          { error: `Unknown source key: ${body.sourceKey}` },
          { status: 400 }
        );
      }
      source = found;
    } else if (body.url && body.type && body.name) {
      // カスタムソース
      source = {
        key: `custom_${Date.now()}`,
        name: body.name,
        url: body.url,
        type: body.type as DataSourceType,
        organization: body.organization ?? "不明",
        category: (body.category as DataSourceCategory) ?? "official",
        priority: body.priority ?? "B",
      };
    } else {
      return NextResponse.json(
        { error: "Either sourceKey or (url, type, name) are required" },
        { status: 400 }
      );
    }

    const jobId = await createScrapeJob(source);

    return NextResponse.json({ jobId, sourceKey: source.key, url: source.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
