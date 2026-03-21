import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import populationBands from "@/public/data/population_bands.json";
import { Municipality, PrefectureSummary, StandardizationData } from "@/lib/types";
import BenchmarkClient from "./BenchmarkClient";

export const metadata: Metadata = {
  title: "自治体ベンチマーク比較｜人口帯別・都道府県別の進捗ランキング | ガバメントクラウド移行状況ダッシュボード",
  description:
    "人口帯別・都道府県別に自治体のガバメントクラウド移行進捗をベンチマーク比較。類似団体検索や予算要求テンプレート出力機能も搭載。",
};

/* ============================================================
   人口帯の分類ロジック（2段階フォールバック方式）

   【精度: 高】public/data/population_bands.json によるルックアップ
     - 出典: 総務省住民基本台帳（2025年1月1日現在）
     - 対象: 政令指定都市20市・中核市62市・施行時特例市23市・特別区23区
     - これらの自治体は実人口データに基づき正確に分類される

   【精度: 低（推定）】JSONにヒットしなかった自治体のフォールバック
     - 「区」で終わる → 10-30万（政令市の行政区など）
     - 「村」で終わる → 1万未満
     - 「町」で終わる → 1-5万
     - 「市」で終わる → 5-10万（中小市の中央値として仮置き）
     - その他          → 1-5万（広域連合等）
   ============================================================ */

type PopBand = "1万未満" | "1-5万" | "5-10万" | "10-30万" | "30万以上";

// population_bands.json から自治体名→人口帯のルックアップMapを構築
const POPULATION_BAND_MAP = new Map<string, PopBand>(
  (Object.entries(populationBands.bands) as [PopBand, string[]][]).flatMap(
    ([band, cities]) => cities.map((city) => [city, band] as [string, PopBand])
  )
);

function classifyPopBand(city: string): PopBand {
  // 1st: 静的JSONによる実人口ベースのルックアップ（高精度）
  const fromJson = POPULATION_BAND_MAP.get(city);
  if (fromJson) return fromJson;

  // 2nd: 自治体名末尾キーワードによる推定（フォールバック）
  if (city.endsWith("区")) return "10-30万";
  if (city.endsWith("村")) return "1万未満";
  if (city.endsWith("町")) return "1-5万";
  if (city.endsWith("市")) return "5-10万";

  // その他（広域連合等）
  return "1-5万";
}

const POP_BANDS: PopBand[] = ["1万未満", "1-5万", "5-10万", "10-30万", "30万以上"];

export interface PopBandStat {
  band: PopBand;
  avgRate: number;
  count: number;
  completedCount: number;
  criticalCount: number;
}

export interface MunicipalityWithBand extends Municipality {
  popBand: PopBand;
}

function computePopBandStats(municipalities: Municipality[]): {
  stats: PopBandStat[];
  municipalitiesWithBand: MunicipalityWithBand[];
} {
  const buckets: Record<PopBand, { rates: number[]; completed: number; critical: number }> = {
    "1万未満": { rates: [], completed: 0, critical: 0 },
    "1-5万": { rates: [], completed: 0, critical: 0 },
    "5-10万": { rates: [], completed: 0, critical: 0 },
    "10-30万": { rates: [], completed: 0, critical: 0 },
    "30万以上": { rates: [], completed: 0, critical: 0 },
  };

  const municipalitiesWithBand: MunicipalityWithBand[] = [];

  for (const m of municipalities) {
    const band = classifyPopBand(m.city);
    const rate = m.overall_rate ?? 0;
    buckets[band].rates.push(rate);
    if (rate >= 1.0) buckets[band].completed++;
    if (rate < 0.5) buckets[band].critical++;
    municipalitiesWithBand.push({ ...m, popBand: band });
  }

  const stats: PopBandStat[] = POP_BANDS.map((band) => {
    const b = buckets[band];
    const avgRate = b.rates.length > 0 ? b.rates.reduce((a, c) => a + c, 0) / b.rates.length : 0;
    return {
      band,
      avgRate,
      count: b.rates.length,
      completedCount: b.completed,
      criticalCount: b.critical,
    };
  });

  return { stats, municipalitiesWithBand };
}

export default function BenchmarkPage() {
  const typedData = data as StandardizationData;
  const { stats, municipalitiesWithBand } = computePopBandStats(
    typedData.municipalities as Municipality[]
  );
  const prefectures = typedData.prefectures as PrefectureSummary[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">自治体ベンチマーク比較</h1>
        <p className="page-subtitle">
          人口帯別・都道府県別の標準化進捗を比較（データ基準: {typedData.summary.data_month}）
        </p>
      </div>

      <BenchmarkClient
        popBandStats={stats}
        municipalities={municipalitiesWithBand}
        prefectures={prefectures}
        dataMonth={typedData.summary.data_month}
      />
    </div>
  );
}
