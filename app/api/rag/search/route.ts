import { NextRequest, NextResponse } from "next/server";
import { searchChunks } from "@/lib/rag";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 10; // 1分間あたりの最大リクエスト数
const RATE_LIMIT_WINDOW = 60_000; // 60秒

/** リクエストからIP識別キーを取得する */
function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** GET /api/rag/search?q=...&limit=5&threshold=0.5 — 公開セマンティック検索 */
export async function GET(req: NextRequest) {
  // Rate limit チェック（IP単位）
  const clientIp = getClientIp(req);
  const rateLimitResult = checkRateLimit(
    `rag-search:${clientIp}`,
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW
  );

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfter),
        },
      }
    );
  }

  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "q parameter is required" }, { status: 400 });
  }

  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "5", 10);
  const threshold = parseFloat(req.nextUrl.searchParams.get("threshold") ?? "0.5");

  try {
    const results = await searchChunks(q, { limit, threshold });
    return NextResponse.json({ query: q, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
