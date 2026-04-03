import { NextRequest, NextResponse } from "next/server";

const CLARITY_PROJECT_ID = process.env.CLARITY_PROJECT_ID ?? "w3eqw79y26";
const CLARITY_API_KEY = process.env.CLARITY_API_KEY;

// Clarity Export API: project-live-insights
// https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api
export async function GET(req: NextRequest) {
  if (!CLARITY_API_KEY) {
    return NextResponse.json({ error: "CLARITY_API_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "3", 10);
  const clampedDays = Math.min(days, 3); // Clarity API max 3 days

  // 日付範囲
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - clampedDays);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const url =
    `https://www.clarity.ms/export-data/api/v1/project-live-insights` +
    `?projectId=${CLARITY_PROJECT_ID}` +
    `&startDate=${fmt(startDate)}` +
    `&endDate=${fmt(endDate)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${CLARITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // 1時間キャッシュ（1日10回制限対応）
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[admin/analytics] Clarity API error:", res.status, text);
      return NextResponse.json({ error: `Clarity API: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ data, projectId: CLARITY_PROJECT_ID });
  } catch (e) {
    console.error("[admin/analytics]", e);
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
