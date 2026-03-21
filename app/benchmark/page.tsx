import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import { Municipality, PrefectureSummary, StandardizationData } from "@/lib/types";
import BenchmarkClient from "./BenchmarkClient";

export const metadata: Metadata = {
  title: "自治体ベンチマーク比較｜人口帯別・都道府県別の進捗ランキング | ガバメントクラウド移行状況ダッシュボード",
  description:
    "人口帯別・都道府県別に自治体のガバメントクラウド移行進捗をベンチマーク比較。類似団体検索や予算要求テンプレート出力機能も搭載。",
};

/* ============================================================
   人口帯の分類ロジック
   standardization.json に人口データがないため、
   自治体名の末尾キーワードで推定分類する。
   - 「市」で終わる: 政令指定都市名リスト → 30万以上
                    それ以外 → 5-10万（中央値として仮置き）
   - 「町」で終わる → 1-5万
   - 「村」で終わる → 1万未満
   - 特別区（「区」）→ 10-30万
   ============================================================ */

const LARGE_CITIES = new Set([
  "札幌市", "仙台市", "さいたま市", "千葉市", "横浜市", "川崎市", "相模原市",
  "新潟市", "静岡市", "浜松市", "名古屋市", "京都市", "大阪市", "堺市",
  "神戸市", "岡山市", "広島市", "北九州市", "福岡市", "熊本市",
  // 中核市・施行時特例市（人口30万前後以上）
  "旭川市", "函館市", "青森市", "盛岡市", "秋田市", "山形市", "郡山市",
  "いわき市", "宇都宮市", "前橋市", "高崎市", "川越市", "越谷市", "船橋市",
  "柏市", "八王子市", "横須賀市", "藤沢市", "富山市", "金沢市", "長野市",
  "岐阜市", "豊橋市", "岡崎市", "豊田市", "一宮市", "春日井市", "四日市市",
  "大津市", "豊中市", "高槻市", "枚方市", "東大阪市", "姫路市", "尼崎市",
  "西宮市", "奈良市", "和歌山市", "鳥取市", "松江市", "倉敷市", "呉市",
  "福山市", "下関市", "高松市", "松山市", "高知市", "久留米市", "長崎市",
  "佐世保市", "大分市", "宮崎市", "鹿児島市", "那覇市",
]);

const MID_LARGE_CITIES = new Set([
  // 10-30万クラス（人口概算による代表例）
  "つくば市", "水戸市", "日立市", "土浦市", "小山市", "太田市", "伊勢崎市",
  "熊谷市", "所沢市", "春日部市", "草加市", "上尾市", "市川市", "松戸市",
  "市原市", "佐倉市", "習志野市", "流山市", "八千代市", "浦安市",
  "町田市", "府中市", "調布市", "西東京市", "小平市", "三鷹市", "日野市",
  "立川市", "武蔵野市", "多摩市", "青梅市", "国分寺市", "東久留米市",
  "平塚市", "茅ヶ崎市", "厚木市", "大和市", "小田原市", "秦野市",
  "長岡市", "上越市", "福井市", "甲府市", "松本市", "沼津市", "富士市",
  "磐田市", "焼津市", "掛川市", "藤枝市", "春日井市", "安城市", "西尾市",
  "津市", "鈴鹿市", "草津市", "彦根市", "茨木市", "八尾市", "寝屋川市",
  "岸和田市", "和泉市", "加古川市", "宝塚市", "伊丹市", "川西市",
  "山口市", "周南市", "徳島市", "今治市", "新居浜市", "佐賀市", "諫早市",
  "飯塚市", "春日市", "大野城市", "筑紫野市", "都城市", "延岡市",
  "別府市", "中津市", "薩摩川内市", "霧島市", "沖縄市", "うるま市",
]);

type PopBand = "1万未満" | "1-5万" | "5-10万" | "10-30万" | "30万以上";

function classifyPopBand(city: string): PopBand {
  if (LARGE_CITIES.has(city)) return "30万以上";
  if (MID_LARGE_CITIES.has(city)) return "10-30万";

  // 特別区
  if (city.endsWith("区")) return "10-30万";
  // 村
  if (city.endsWith("村")) return "1万未満";
  // 町
  if (city.endsWith("町")) return "1-5万";
  // 残りの「市」→ 5-10万（中小市）
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
