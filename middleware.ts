import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 統合済みページ → ダッシュボードへリダイレクト
  if (pathname === "/tracker" || pathname === "/prefectures") {
    return NextResponse.redirect(new URL("/", request.url), 301);
  }

  // /api/scrape/* と /api/schedule/*（POST系）を保護（CRON_SECRET or JWT）
  if (pathname.startsWith("/api/scrape") ||
      (pathname.startsWith("/api/schedule") && request.method !== "GET")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const cronSecret = request.headers.get("x-cron-secret");
    const expectedCron = process.env.CRON_SECRET;

    const isAuthed = token && (await verifyAdminToken(token));
    const isCron = cronSecret && expectedCron && cronSecret === expectedCron;

    if (!isAuthed && !isCron) {
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
  matcher: ["/tracker", "/prefectures", "/admin/:path*", "/api/scrape/:path*", "/api/schedule/:path*"],
};
