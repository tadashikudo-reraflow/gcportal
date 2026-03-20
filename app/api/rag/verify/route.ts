import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyClaimAgainstCorpus } from "@/lib/rag";

/** POST /api/rag/verify — 主張のファクト検証（管理者認証必須） */
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
    const { claims } = body;

    if (!claims || !Array.isArray(claims) || claims.length === 0) {
      return NextResponse.json({ error: "claims array is required" }, { status: 400 });
    }

    // 各主張を検証（最大10件）
    const results = await Promise.all(
      claims.slice(0, 10).map((claim: string) => verifyClaimAgainstCorpus(claim))
    );

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
