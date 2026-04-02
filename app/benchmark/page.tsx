import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import populationBands from "@/public/data/population_bands.json";
import { Municipality, PrefectureSummary, StandardizationData } from "@/lib/types";
import { Vendor, Package, Municipality as SupaMunicipality, MunicipalityPackageRow } from "@/lib/supabase";
import BenchmarkClient from "./BenchmarkClient";
import Breadcrumb from "@/components/Breadcrumb";

// ISR: 1時間キャッシュ
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "自治体ベンチマーク比較｜人口帯別・都道府県別ランキング｜GCInsight",
  description:
    "人口帯別・都道府県別に自治体のガバメントクラウド移行進捗をベンチマーク比較。類似団体検索や比較データのコピー機能も搭載。",
  alternates: { canonical: "/benchmark" },
};

/* ============================================================
   人口帯の分類ロジック（2段階フォールバック方式）
   ============================================================ */

type PopBand = "1万未満" | "1-5万" | "5-10万" | "10-30万" | "30万以上";

const POPULATION_BAND_MAP = new Map<string, PopBand>(
  (Object.entries(populationBands.bands) as [PopBand, string[]][]).flatMap(
    ([band, cities]) => cities.map((city) => [city, band] as [string, PopBand])
  )
);

function classifyPopBand(city: string): PopBand {
  const fromJson = POPULATION_BAND_MAP.get(city);
  if (fromJson) return fromJson;

  if (city.endsWith("区")) return "10-30万";
  if (city.endsWith("村")) return "1万未満";
  if (city.endsWith("町")) return "1-5万";
  if (city.endsWith("市")) return "5-10万";

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

/* ============================================================
   Supabase PKGデータ取得
   ============================================================ */

type MunicipalityPackageWithPackage = MunicipalityPackageRow & {
  packages?: Package & { vendors?: Vendor };
};

export interface PkgData {
  supabaseMunicipalities: SupaMunicipality[];
  packagesByMunicipalityId: Record<number, MunicipalityPackageWithPackage[]>;
}

async function fetchPkgData(): Promise<PkgData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [municipalityRes, mpRes] = await Promise.all([
      supabase
        .from("municipalities")
        .select("id, prefecture, city, pref_city_code, size_category")
        .order("prefecture")
        .order("city"),
      supabase
        .from("municipality_packages")
        .select(
          "id, municipality_id, package_id, business, adoption_year, confidence, packages(id, package_name, business, vendor_id, confirmed_date, vendors(name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count))"
        )
        .limit(5000),
    ]);

    const supabaseMunicipalities: SupaMunicipality[] = municipalityRes.data ?? [];
    const mpRows = (mpRes.data ?? []) as unknown as MunicipalityPackageWithPackage[];

    const packagesByMunicipalityId: Record<number, MunicipalityPackageWithPackage[]> = {};
    for (const row of mpRows) {
      if (!packagesByMunicipalityId[row.municipality_id]) {
        packagesByMunicipalityId[row.municipality_id] = [];
      }
      packagesByMunicipalityId[row.municipality_id].push(row);
    }

    return { supabaseMunicipalities, packagesByMunicipalityId };
  } catch {
    return null;
  }
}

export default async function BenchmarkPage() {
  const typedData = data as StandardizationData;
  const { stats, municipalitiesWithBand } = computePopBandStats(
    typedData.municipalities as Municipality[]
  );
  const prefectures = typedData.prefectures as PrefectureSummary[];

  const pkgData = await fetchPkgData();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "自治体ベンチマーク比較" }]} />
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
        pkgData={pkgData}
      />
    </div>
  );
}
