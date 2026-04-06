import type { Metadata } from "next";
import { readFileSync } from "fs";
import { join } from "path";
import { Info } from "lucide-react";
import ProgressClient from "./ProgressClient";
import Breadcrumb from "@/components/Breadcrumb";
import RelatedArticles from "@/components/RelatedArticles";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import ReportLeadCta from "@/components/ReportLeadCta";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "自治体システム標準化 進捗ダッシュボード【2026年最新】｜GCInsight",
  description:
    "全国1,741自治体×20業務の標準化進捗を都道府県・人口帯・業務別に一覧。遅延リスク自治体・特定移行935団体も統合表示。",
  alternates: { canonical: "/progress" },
};

/* ──────────────────── Types (exported for ProgressClient) ──────────────────── */

export interface ProgressVendor {
  name: string;
  cloud: string;
  businesses: string[];
}

export interface ProgressMunicipality {
  prefecture: string;
  city: string;
  overall_rate: number;
  business_rates: Record<string, number>;
  popBand: string;
  isTokutei: boolean;
  vendors: ProgressVendor[];
}

export interface PrefectureSummary {
  prefecture: string;
  avg_rate: number;
  count: number;
  completed: number;
  critical: number;
  tokutei_count: number;
}

export interface ProgressData {
  summary: {
    data_month: string;
    deadline: string;
    total: number;
    avg_rate: number;
    completed_count: number;
    critical_count: number;
  };
  prefectures: PrefectureSummary[];
  businesses: {
    business: string;
    avg_rate: number;
    completed: number;
    critical: number;
  }[];
  municipalities: ProgressMunicipality[];
  dataMonth: string;
}

/* ──────────────────── Helpers ──────────────────── */

function sizeToPopBand(size: string | null | undefined): string {
  if (!size) return "C";
  if (size.includes("政令")) return "A";
  if (size.includes("中核")) return "B";
  if (size.includes("町")) return "D";
  if (size.includes("村")) return "E";
  return "C"; // 一般市
}

/* ──────────────────── Server Component ──────────────────── */

export default async function ProgressPage() {
  // 1. Read static JSON
  const stdPath = join(process.cwd(), "public/data/standardization.json");
  const tokPath = join(process.cwd(), "public/data/tokutei_municipalities.json");
  const stdData = JSON.parse(readFileSync(stdPath, "utf-8"));
  const tokData = JSON.parse(readFileSync(tokPath, "utf-8"));

  // 2. Build tokutei set
  const tokuteiSet = new Set<string>();
  for (const m of tokData.municipalities ?? []) {
    tokuteiSet.add(`${m.prefecture}_${m.city}`);
  }

  // 3. Supabase fetch (vendor info)
  type VendorInfo = { name: string; cloud: string; businesses: string[] };
  const vendorsByMuni = new Map<string, VendorInfo[]>();
  const supabaseMuniSize = new Map<string, string>(); // key → size_category

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const [muniRes, mpRes] = await Promise.all([
        supabase
          .from("municipalities")
          .select("id, prefecture, city, size_category")
          .order("prefecture"),
        supabase
          .from("municipality_packages")
          .select(
            "municipality_id, business, packages(package_name, vendors(name, cloud_platform))"
          )
          .limit(5000),
      ]);

      // Build ID → key map + size map
      const idToKey = new Map<number, string>();
      for (const m of muniRes.data ?? []) {
        const key = `${m.prefecture}_${m.city}`;
        idToKey.set(m.id, key);
        supabaseMuniSize.set(key, m.size_category ?? "");
      }

      // Aggregate vendor info per municipality
      // Supabase JOIN results need unknown cast due to nested array types
      for (const row of (mpRes.data ?? []) as unknown as Array<{
        municipality_id: number;
        business: string;
        packages?: { package_name: string; vendors?: { name: string; cloud_platform: string } };
      }>) {
        const key = idToKey.get(row.municipality_id);
        if (!key || !row.packages?.vendors) continue;
        const vName = row.packages.vendors.name;
        const vCloud = row.packages.vendors.cloud_platform ?? "";
        const biz = row.business;

        if (!vendorsByMuni.has(key)) vendorsByMuni.set(key, []);
        const arr = vendorsByMuni.get(key)!;
        let existing = arr.find((v) => v.name === vName && v.cloud === vCloud);
        if (!existing) {
          existing = { name: vName, cloud: vCloud, businesses: [] };
          arr.push(existing);
        }
        if (!existing.businesses.includes(biz)) existing.businesses.push(biz);
      }
    } catch {
      // Supabase unavailable — continue without vendor data
    }
  }

  // 4. Merge data
  const municipalities: ProgressMunicipality[] = (stdData.municipalities ?? []).map(
    (m: { prefecture: string; city: string; overall_rate: number; business_rates: Record<string, number> }) => {
      const key = `${m.prefecture}_${m.city}`;
      return {
        prefecture: m.prefecture,
        city: m.city,
        overall_rate: m.overall_rate ?? 0,
        business_rates: m.business_rates ?? {},
        popBand: sizeToPopBand(supabaseMuniSize.get(key)),
        isTokutei: tokuteiSet.has(key),
        vendors: vendorsByMuni.get(key) ?? [],
      };
    }
  );

  // 5. Prefecture summaries with tokutei count
  const prefectures: PrefectureSummary[] = (stdData.prefectures ?? []).map(
    (p: { prefecture: string; avg_rate: number; count: number; completed: number; critical: number }) => {
      const tokCount = municipalities.filter(
        (m) => m.prefecture === p.prefecture && m.isTokutei
      ).length;
      return { ...p, tokutei_count: tokCount };
    }
  );

  const data: ProgressData = {
    summary: {
      data_month: stdData.summary.data_month,
      deadline: stdData.summary.deadline,
      total: stdData.summary.total,
      avg_rate: stdData.summary.avg_rate,
      completed_count: stdData.summary.completed_count,
      critical_count: stdData.summary.critical_count,
    },
    prefectures,
    businesses: stdData.businesses ?? [],
    municipalities,
    dataMonth: stdData.summary.data_month,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "進捗ダッシュボード" }]} />
      <div className="pb-4">
        <h1 className="page-title">標準化進捗ダッシュボード</h1>
        <p className="page-subtitle">
          全国{data.summary.total.toLocaleString()}自治体の標準化20業務の進捗状況
        </p>
      </div>

      {/* 特定移行とは（ミニ解説） */}
      <div
        className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
        style={{ backgroundColor: "#eff6ff", border: "1px solid #93c5fd" }}
      >
        <Info size={16} color="#1d4ed8" className="flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p style={{ color: "#1e40af" }}>
          <span className="font-semibold">特定移行</span>とは、技術的・運用的に移行困難としてデジタル庁が認定した自治体・システムです。「遅延」とは異なり、期限延長のうえ移行継続中のステータスです。
          {" "}
          <a href="/articles/gc-tokutei-vs-delay" className="underline font-medium hover:opacity-80">
            特定移行と遅延の違いを詳しく →
          </a>
        </p>
      </div>

      <ProgressClient data={data} />

      <SourceAttribution
        sourceIds={PAGE_SOURCES.prefectures ?? []}
        pageId="progress"
      />
      <ReportLeadCta source="progress" compact title="全国移行進捗の詳細分析をPDFで確認" description="都道府県別・人口帯別の進捗分布と遅延構造をまとめたレポートです。" />
      <RelatedArticles cluster={CLUSTERS.risk} />
    </div>
  );
}
