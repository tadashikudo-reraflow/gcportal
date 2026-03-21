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

/**
 * DBスナップショット1件 + standardization.json の現在値を合成してグラフ用データを生成。
 * DBが完全に空の場合は null を返す（呼び出し元でモックにフォールバック）。
 */
function buildFromDbAndCurrent(
  dbSnapshots: {
    data_month: string;
    avg_rate: number;
    completed_count: number;
    critical_count: number;
    municipality_count: number;
    snapshot_data: Record<string, unknown>;
  }[],
  typedData: StandardizationData
): { snapshots: SnapshotPoint[]; prefectureTimeline: PrefectureTimelinePoint[] } | null {
  if (dbSnapshots.length === 0) return null;

  const { summary, prefectures } = typedData;

  // DBスナップショットを時系列順でマッピング
  const snapshotMap = new Map(dbSnapshots.map((s) => [s.data_month, s]));

  // standardization.json の現在月がDBにまだ無ければ末尾に追加（現在値で補完）
  if (!snapshotMap.has(summary.data_month)) {
    snapshotMap.set(summary.data_month, {
      data_month: summary.data_month,
      avg_rate: summary.avg_rate,
      completed_count: summary.completed_count,
      critical_count: summary.critical_count,
      municipality_count: summary.total,
      snapshot_data: {
        at_risk_count: summary.at_risk_count,
        on_track_count: summary.on_track_count,
        prefecture_summary: prefectures.map((p) => ({
          prefecture: p.prefecture,
          avg_rate: p.avg_rate,
          count: p.count,
          completed: p.completed,
          critical: p.critical,
        })),
      },
    });
  }

  // data_month 昇順でソート
  const sorted = Array.from(snapshotMap.values()).sort((a, b) =>
    a.data_month.localeCompare(b.data_month)
  );

  const snapshots: SnapshotPoint[] = sorted.map((s) => ({
    data_month: s.data_month,
    avg_rate: s.avg_rate,
    completed_count: s.completed_count,
    critical_count: s.critical_count,
    municipality_count: s.municipality_count,
  }));

  const prefectureTimeline: PrefectureTimelinePoint[] = [];
  for (const s of sorted) {
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

  return { snapshots, prefectureTimeline };
}

export default async function TimelinePage() {
  const typedData = data as StandardizationData;

  // Try DB snapshots first, fall back to mock
  let snapshots: SnapshotPoint[];
  let prefectureTimeline: PrefectureTimelinePoint[];
  let isMockData = false;

  try {
    const { getSnapshots, seedInitialSnapshot } = await import("@/lib/snapshot");

    // テーブルが空なら初期シーディングを試みる
    await seedInitialSnapshot().catch(() => {
      // シーディング失敗は致命的ではない（後続でモックにフォールバック）
    });

    const dbSnapshots = await getSnapshots();
    const built = buildFromDbAndCurrent(dbSnapshots, typedData);

    if (built) {
      snapshots = built.snapshots;
      prefectureTimeline = built.prefectureTimeline;
      // DBが1件のみ（初期シード直後）でも実データとして扱う
      isMockData = false;
    } else {
      throw new Error("DB is empty");
    }
  } catch {
    // Fall back to mock data（DBが完全に空 or 接続エラーの場合のみ）
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
