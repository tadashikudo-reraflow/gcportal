import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 統合済みページ → ダッシュボードへリダイレクト
  if (pathname === "/tracker" || pathname === "/prefectures") {
    return NextResponse.redirect(new URL("/", request.url), 301);
  }

  // /api/scrape/*（POST系）を保護（CRON_SECRET or JWT or Bearer）
  // /api/schedule は route.ts 内で独自認証するためproxyからは除外
  if (pathname.startsWith("/api/scrape")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedCron = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    const isAuthed = token && (await verifyAdminToken(token));
    const isCron = cronSecret && expectedCron && cronSecret === expectedCron;
    const isBearer = authHeader?.startsWith("Bearer ") &&
      authHeader.slice(7) === process.env.GCINSIGHT_ADMIN_KEY;

    if (!isAuthed && !isCron && !isBearer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // /admin/* を保護（/admin/login は除外）
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await verifyAdminToken(token))) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tracker", "/prefectures", "/admin/:path*", "/api/scrape/:path*"],
};
