import { NextRequest, NextResponse } from "next/server";
import { searchChunks } from "@/lib/rag";

/** GET /api/rag/search?q=...&limit=5&threshold=0.5 — 公開セマンティック検索 */
export async function GET(req: NextRequest) {
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
