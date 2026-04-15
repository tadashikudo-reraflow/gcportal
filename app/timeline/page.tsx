import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import scheduleStaticData from "@/public/data/schedule.json";
import ScheduleClient from "./ScheduleClient";
import Breadcrumb from "@/components/Breadcrumb";
import ReportLeadCta from "@/components/ReportLeadCta";

// スケジュールは最大1時間キャッシュ（POST更新後は自動失効しないため次回アクセス時に反映）
export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    "ガバクラ関連スケジュール｜年度計画と直近の動き｜GCInsight",
  description:
    "ガバメントクラウド・自治体標準化に関する年間スケジュールと直近の重要イベントを一覧。デジタル庁・総務省・厚労省等の最新動向を時系列で確認。",
  alternates: { canonical: "/timeline" },
};

export interface ScheduleEvent {
  date: string;
  status: "done" | "upcoming";
  title: string;
  org: string;
  important?: boolean;
  note?: string;
  url?: string;
}

export interface AnnualQuarter {
  quarter: string;
  events: string[];
}

export interface SourcePage {
  id: string;
  name: string;
  url: string;
  org: string;
  description: string;
}

export interface ScheduleData {
  last_updated: string;
  annual_schedule: AnnualQuarter[];
  recent_schedule: ScheduleEvent[];
  source_pages?: SourcePage[];
}

async function fetchRecentSchedule(): Promise<ScheduleEvent[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase
      .from("schedule_events")
      .select("date, status, title, org, important, note, url")
      .order("date", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((ev) => ({
      date: ev.date as string,
      status: ev.status as "done" | "upcoming",
      title: ev.title as string,
      org: ev.org as string,
      ...(ev.important ? { important: true as const } : {}),
      ...(ev.note ? { note: ev.note as string } : {}),
      ...(ev.url ? { url: ev.url as string } : {}),
    }));
  } catch (err) {
    console.error("[timeline] Supabase fetch failed, falling back to JSON:", err);
    // フォールバック: JSON静的データ
    const staticData = scheduleStaticData as ScheduleData;
    return staticData.recent_schedule ?? [];
  }
}

export default async function SchedulePage() {
  const staticData = scheduleStaticData as ScheduleData;
  const recentSchedule = await fetchRecentSchedule();

  const data: ScheduleData = {
    last_updated: new Date().toISOString().slice(0, 10),
    annual_schedule: staticData.annual_schedule ?? [],
    recent_schedule: recentSchedule,
    source_pages: staticData.source_pages,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "スケジュール" }]} />
      <div>
        <h1 className="page-title">ガバクラ関連スケジュール</h1>
        <p className="page-subtitle">
          年間計画と直近の重要イベント（最終更新: {data.last_updated}）
        </p>
      </div>

      <ScheduleClient data={data} />
      <ReportLeadCta source="timeline" compact title="期限後の移行状況とコスト変化をまとめて確認" description="移行完了後に顕在化したコスト増加・遅延構造・対策をまとめた無料レポートです。" />
    </div>
  );
}
