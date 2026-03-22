import type { Metadata } from "next";
import scheduleData from "@/public/data/schedule.json";
import ScheduleClient from "./ScheduleClient";

export const metadata: Metadata = {
  title:
    "ガバクラ関連スケジュール｜年度計画と直近の動き | ガバメントクラウド移行状況ダッシュボード",
  description:
    "ガバメントクラウド・自治体標準化に関する年間スケジュールと直近の重要イベントを一覧。デジタル庁・総務省・厚労省等の最新動向を時系列で確認。",
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

export default function SchedulePage() {
  const data = scheduleData as ScheduleData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">ガバクラ関連スケジュール</h1>
        <p className="page-subtitle">
          年間計画と直近の重要イベント（最終更新: {data.last_updated}）
        </p>
      </div>

      <ScheduleClient data={data} />
    </div>
  );
}
