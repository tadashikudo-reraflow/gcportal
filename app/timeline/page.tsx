import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import { StandardizationData } from "@/lib/types";
import TimelineClient from "./TimelineClient";

export const metadata: Metadata = {
  title:
    "時系列トレンド｜標準化進捗の推移 | ガバメントクラウド移行状況ダッシュボード",
  description:
    "ガバメントクラウド移行の進捗率・完了自治体数を月次で可視化。都道府県別フィルタで地域ごとのトレンドも確認可能。",
};

/* ============================================================
   Mock historical data generator
   DB スナップショットが無い場合、standardization.json の現在値から
   過去12ヶ月分の推定データを逆算生成する。
   ============================================================ */

export interface SnapshotPoint {
  data_month: string;
  avg_rate: number;
  completed_count: number;
  critical_count: number;
  municipality_count: number;
}

export interface PrefectureTimelinePoint {
  data_month: string;
  prefecture: string;
  avg_rate: number;
}

function generateMockHistory(
  typedData: StandardizationData
): {
  snapshots: SnapshotPoint[];
  prefectureTimeline: PrefectureTimelinePoint[];
} {
  const { summary, prefectures } = typedData;

  // Parse current month
  const [curYear, curMonth] = summary.data_month.split("-").map(Number);

  const snapshots: SnapshotPoint[] = [];
  const prefectureTimeline: PrefectureTimelinePoint[] = [];

  // Generate 12 months of history
  for (let i = 11; i >= 0; i--) {
    let m = curMonth - i;
    let y = curYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    const monthStr = `${y}-${String(m).padStart(2, "0")}`;

    // Progress grows roughly linearly; earlier months had lower rates
    const progressFactor = (12 - i) / 12;
    // Use S-curve for more realistic growth
    const sCurve = 1 / (1 + Math.exp(-6 * (progressFactor - 0.5)));
    const rateAtMonth = summary.avg_rate * (0.3 + 0.7 * sCurve);

    const completedAtMonth = Math.round(
      summary.completed_count * sCurve
    );
    const criticalAtMonth = Math.round(
      summary.critical_count * (1.8 - 0.8 * sCurve)
    );

    snapshots.push({
      data_month: monthStr,
      avg_rate: Math.round(rateAtMonth * 10000) / 10000,
      completed_count: completedAtMonth,
      critical_count: Math.max(0, criticalAtMonth),
      municipality_count: summary.total,
    });

    // Prefecture-level data
    for (const pref of prefectures) {
      const prefRate = pref.avg_rate * (0.3 + 0.7 * sCurve);
      prefectureTimeline.push({
        data_month: monthStr,
        prefecture: pref.prefecture,
        avg_rate: Math.round(prefRate * 10000) / 10000,
      });
    }
  }

  return { snapshots, prefectureTimeline };
}

export default async function TimelinePage() {
  const typedData = data as StandardizationData;

  // Try DB snapshots first, fall back to mock
  let snapshots: SnapshotPoint[];
  let prefectureTimeline: PrefectureTimelinePoint[];
  let isMockData = false;

  try {
    const { getSnapshots } = await import("@/lib/snapshot");
    const dbSnapshots = await getSnapshots();

    if (dbSnapshots.length >= 2) {
      snapshots = dbSnapshots.map((s) => ({
        data_month: s.data_month,
        avg_rate: s.avg_rate,
        completed_count: s.completed_count,
        critical_count: s.critical_count,
        municipality_count: s.municipality_count,
      }));
      // Extract prefecture data from snapshot_data if available
      prefectureTimeline = [];
      for (const s of dbSnapshots) {
        const prefSummary = (
          s.snapshot_data as { prefecture_summary?: { prefecture: string; avg_rate: number }[] }
        )?.prefecture_summary;
        if (prefSummary) {
          for (const p of prefSummary) {
            prefectureTimeline.push({
              data_month: s.data_month,
              prefecture: p.prefecture,
              avg_rate: p.avg_rate,
            });
          }
        }
      }
    } else {
      throw new Error("Not enough snapshots");
    }
  } catch {
    // Fall back to mock data
    const mock = generateMockHistory(typedData);
    snapshots = mock.snapshots;
    prefectureTimeline = mock.prefectureTimeline;
    isMockData = true;
  }

  const prefectureNames = typedData.prefectures
    .map((p) => p.prefecture)
    .sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">時系列トレンド</h1>
        <p className="page-subtitle">
          標準化進捗の月次推移（データ基準: {typedData.summary.data_month}）
        </p>
      </div>

      <TimelineClient
        snapshots={snapshots}
        prefectureTimeline={prefectureTimeline}
        prefectureNames={prefectureNames}
        isMockData={isMockData}
        dataMonth={typedData.summary.data_month}
      />
    </div>
  );
}
