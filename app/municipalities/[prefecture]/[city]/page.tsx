import type { Metadata } from "next";
import { notFound } from "next/navigation";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { Municipality, BusinessSummary } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import Breadcrumb from "@/components/Breadcrumb";
import ArticleNewsletterBanner from "@/components/ArticleNewsletterBanner";
import { normalizeBusiness } from "@/lib/businessAlias";

type Props = { params: Promise<{ prefecture: string; city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { prefecture, city } = await params;
  const pref = decodeURIComponent(prefecture);
  const cityName = decodeURIComponent(city);
  const municipalities = data.municipalities as Municipality[];
  const muni = municipalities.find((m) => m.prefecture === pref && m.city === cityName);
  const rate = muni?.overall_rate as number | null | undefined;
  const rateParam = rate != null ? `&rate=${(rate * 100).toFixed(1)}` : "";
  const ogUrl = `https://gcinsight.jp/og?title=${encodeURIComponent(`${pref} ${cityName}`)}&subtitle=${encodeURIComponent("自治体別 標準化進捗・財政プロフィール")}&type=municipality${rateParam}`;
  return {
    title: `${pref} ${cityName} | 標準化進捗・財政プロフィール | GCInsight`,
    description: `${pref}${cityName}のガバメントクラウド移行状況。20業務の進捗率・採用ベンダー・標準財政規模・財政力指数を一覧表示。`,
    alternates: { canonical: `/municipalities/${encodeURIComponent(pref)}/${encodeURIComponent(cityName)}` },
    openGraph: { images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [ogUrl] },
  };
}

function getTextColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#EF4444";
}
function getBarColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#F59E0B";
  return "#b91c1c";
}
function formatRate(rate: number): string { return (rate * 100).toFixed(1) + "%"; }
function getStatusLabel(rate: number): string {
  if (rate >= 1.0) return "完了";
  if (rate >= 0.75) return "順調";
  if (rate >= 0.5) return "要注意";
  return "危機";
}
function getStatusColor(rate: number): string {
  if (rate >= 1.0) return "#378445";
  if (rate >= 0.75) return "#1D4ED8";
  if (rate >= 0.5) return "#d97706";
  return "#b91c1c";
}

const CLOUD_MAP: Record<string, { label: string; color: string }> = {
  AWS: { label: "AWS", color: "#FF9900" },
  Azure: { label: "Azure", color: "#0078D4" },
  GCP: { label: "GCP", color: "#4285F4" },
  OCI: { label: "OCI", color: "#F80000" },
  さくら: { label: "さくら", color: "#E05C9E" },
};

function CloudBadge({ cloud }: { cloud: string | null }) {
  if (!cloud) return <span className="text-[10px] text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">不明</span>;
  const info = CLOUD_MAP[cloud] ?? { label: cloud, color: "#64748B" };
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: `${info.color}20`, color: info.color }}>
      {info.label}
    </span>
  );
}

function VendorChip({ vendorName, cloud }: { vendorName: string; cloud: string | null }) {
  const info = cloud ? (CLOUD_MAP[cloud] ?? { color: "#64748B" }) : null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
      style={{
        borderColor: info ? `${info.color}40` : "#e2e8f0",
        backgroundColor: info ? `${info.color}08` : "#f8fafc",
        color: "#374151",
      }}>
      {cloud && <CloudBadge cloud={cloud} />}
      <span>{vendorName}</span>
    </span>
  );
}

function formatPopulation(n: number | null): string {
  if (!n) return "—";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万人`;
  return `${n.toLocaleString("ja-JP")}人`;
}

function formatFiscalScale(n: number | null): string {
  if (!n) return "—";
  // 単位: 千円 → 億円で表示
  const oku = n / 100000;
  if (oku >= 1000) return `${(oku / 1000).toFixed(1)}兆円`;
  if (oku >= 1) return `${oku.toFixed(0)}億円`;
  return `${(n / 1000).toFixed(0)}百万円`;
}

function FiscalStrengthBar({ value }: { value: number | null }) {
  if (!value) return <span className="text-gray-400 text-sm">—</span>;
  const pct = Math.min(value * 100, 150);
  const color = value >= 1.0 ? "#378445" : value >= 0.5 ? "#1D4ED8" : "#d97706";
  return (
    <div className="flex items-center gap-2">
      <span className="font-bold tabular-nums text-sm" style={{ color }}>{value.toFixed(2)}</span>
      <div className="flex-1 max-w-[80px] h-2 rounded-full overflow-hidden bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-gray-400">
        {value >= 1.0 ? "不交付" : value >= 0.5 ? "普通" : "要支援"}
      </span>
    </div>
  );
}

export default async function MunicipalityDetailPage({ params }: Props) {
  const { prefecture, city } = await params;
  const prefName = decodeURIComponent(prefecture);
  const cityName = decodeURIComponent(city);

  const municipalities = data.municipalities as Municipality[];
  const muni = municipalities.find((m) => m.prefecture === prefName && m.city === cityName);
  if (!muni) notFound();

  const isTokutei = tokuteiData.municipalities.some(
    (m: { prefecture: string; city: string }) => m.prefecture === prefName && m.city === cityName
  );

  const businesses = data.businesses as BusinessSummary[];
  const bizRates = businesses.map((biz) => ({
    name: biz.business,
    rate: muni.business_rates[biz.business] as number | null,
    nationalAvg: biz.avg_rate,
  })).sort((a, b) => (a.rate ?? 999) - (b.rate ?? 999));

  const overallRate = muni.overall_rate as number | null;

  const samePrefCities = municipalities
    .filter((m) => m.prefecture === prefName && m.city !== cityName)
    .sort((a, b) => ((b.overall_rate as number) ?? 0) - ((a.overall_rate as number) ?? 0))
    .slice(0, 6);

  // Supabaseからid取得（ベンダー情報に必須・常に存在するカラムのみ）
  const { data: muniBase } = await supabase
    .from("municipalities")
    .select("id")
    .eq("prefecture", prefName)
    .eq("city", cityName)
    .single();

  // 財政プロフィール（DBマイグレーション後に追加されるカラム・失敗しても影響しない）
  const { data: muniFinance } = await supabase
    .from("municipalities")
    .select("population, standard_fiscal_scale, fiscal_strength, financial_data_year")
    .eq("prefecture", prefName)
    .eq("city", cityName)
    .single();

  const vendorByBusiness: Record<string, { vendorName: string; cloud: string | null }> = {};
  const vendorsWithoutBusiness: { vendorName: string; cloud: string | null }[] = [];

  if (muniBase) {
    const { data: pkgRows } = await supabase
      .from("municipality_packages")
      .select(`business, packages ( package_name, vendors ( name, cloud_platform ) )`)
      .eq("municipality_id", muniBase.id);

    if (pkgRows) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of pkgRows as any[]) {
        const business = normalizeBusiness(row.business as string | null);
        const pkg = Array.isArray(row.packages) ? row.packages[0] : row.packages;
        const vendor = pkg ? (Array.isArray(pkg.vendors) ? pkg.vendors[0] : pkg.vendors) : null;
        const vendorName: string = vendor?.name ?? "不明";
        const cloud: string | null = vendor?.cloud_platform ?? null;
        if (business) {
          vendorByBusiness[business] = { vendorName, cloud };
        } else if (vendorName !== "不明" && !vendorsWithoutBusiness.some((v) => v.vendorName === vendorName)) {
          vendorsWithoutBusiness.push({ vendorName, cloud });
        }
      }
    }
  }

  const vendorSummaryMap: Record<string, { vendorName: string; cloud: string | null; count: number }> = {};
  for (const [, v] of Object.entries(vendorByBusiness)) {
    if (!vendorSummaryMap[v.vendorName]) vendorSummaryMap[v.vendorName] = { vendorName: v.vendorName, cloud: v.cloud, count: 0 };
    vendorSummaryMap[v.vendorName].count++;
  }
  for (const v of vendorsWithoutBusiness) {
    if (!vendorSummaryMap[v.vendorName]) vendorSummaryMap[v.vendorName] = { vendorName: v.vendorName, cloud: v.cloud, count: 0 };
  }
  const vendorSummary = Object.values(vendorSummaryMap).sort((a, b) => b.count - a.count);
  const hasVendorData = vendorSummary.length > 0;

  const population = muniFinance?.population ?? null;
  const stdFiscal = muniFinance?.standard_fiscal_scale ?? null;
  const fiscalStrength = muniFinance?.fiscal_strength ?? null;
  const dataYear = muniFinance?.financial_data_year ?? null;
  const hasFinanceData = population || stdFiscal || fiscalStrength;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "進捗ダッシュボード", href: "/progress" },
        { label: prefName },
        { label: cityName },
      ]} />

      {/* ヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm text-gray-500">{prefName}</span>
          {isTokutei && (
            <span className="inline-block px-2 py-0.5 rounded text-white text-xs font-bold"
              style={{ backgroundColor: "#64748B" }}>
              特定移行
            </span>
          )}
        </div>
        <h1 className="page-title">{cityName}</h1>
        {overallRate !== null && (
          <p className="page-subtitle">
            全体進捗率:{" "}
            <span className="font-bold" style={{ color: getTextColor(overallRate) }}>{formatRate(overallRate)}</span>
            　ステータス:{" "}
            <span className="font-bold" style={{ color: getStatusColor(overallRate) }}>{getStatusLabel(overallRate)}</span>
          </p>
        )}
      </div>

      {/* 財政プロフィール */}
      {hasFinanceData && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              財政プロフィール
            </h2>
            {dataYear && (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                総務省 {dataYear}年度
              </span>
            )}
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {population && (
              <div>
                <dt className="text-[11px] text-gray-400 mb-0.5">人口</dt>
                <dd className="text-base font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                  {formatPopulation(population)}
                </dd>
              </div>
            )}
            {stdFiscal && (
              <div>
                <dt className="text-[11px] text-gray-400 mb-0.5">標準財政規模</dt>
                <dd className="text-base font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                  {formatFiscalScale(stdFiscal)}
                </dd>
              </div>
            )}
            {fiscalStrength !== null && (
              <div>
                <dt className="text-[11px] text-gray-400 mb-1">財政力指数</dt>
                <dd><FiscalStrengthBar value={fiscalStrength} /></dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* 主な採用ベンダー */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          主な採用ベンダー
          {hasVendorData && (
            <span className="text-xs font-normal ml-2 text-gray-400">業務別に異なる場合があります</span>
          )}
        </h2>
        {hasVendorData ? (
          <div className="flex flex-wrap gap-2">
            {vendorSummary.map((v) => (
              <div key={v.vendorName} className="flex items-center gap-1.5">
                <VendorChip vendorName={v.vendorName} cloud={v.cloud} />
                {v.count > 0 && <span className="text-[10px] text-gray-400">{v.count}業務</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">採用ベンダー情報は現時点では未収録です。</p>
        )}
      </div>

      {/* 20業務の進捗率 */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            20業務 手続き進捗率
            <span className="text-xs font-normal ml-2 text-gray-400">進捗率 昇順</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200" style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-4 py-2 text-gray-400 font-medium">業務</th>
                {hasVendorData && (
                  <th className="text-left px-4 py-2 text-gray-400 font-medium hidden md:table-cell">ベンダー</th>
                )}
                <th className="text-right px-4 py-2 text-gray-400 font-medium">進捗率</th>
                <th className="text-right px-4 py-2 text-gray-400 font-medium hidden md:table-cell">全国平均</th>
                <th className="text-center px-4 py-2 text-gray-400 font-medium w-16">状態</th>
              </tr>
            </thead>
            <tbody>
              {bizRates.map((biz) => {
                if (biz.rate === null) return null;
                const diff = biz.rate - biz.nationalAvg;
                const vendor = vendorByBusiness[biz.name];
                return (
                  <tr key={biz.name} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-800 font-medium">{biz.name}</td>
                    {hasVendorData && (
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        {vendor ? (
                          <VendorChip vendorName={vendor.vendorName} cloud={vendor.cloud} />
                        ) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right">
                      <span className="font-bold tabular-nums" style={{ color: getTextColor(biz.rate) }}>
                        {formatRate(biz.rate)}
                      </span>
                      <div className="w-20 ml-auto mt-1 rounded-full overflow-hidden" style={{ height: 3, backgroundColor: "#e5e7eb" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${biz.rate * 100}%`, backgroundColor: getBarColor(biz.rate) }} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums hidden md:table-cell"
                      style={{ color: "var(--color-text-muted)" }}>
                      <span>{formatRate(biz.nationalAvg)}</span>
                      <span className="ml-1 font-semibold" style={{ color: diff >= 0 ? "#378445" : "#b91c1c" }}>
                        {diff >= 0 ? "+" : ""}{(diff * 100).toFixed(1)}pt
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ color: getStatusColor(biz.rate), backgroundColor: `${getStatusColor(biz.rate)}15` }}>
                        {getStatusLabel(biz.rate)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 同県の他自治体 */}
      {samePrefCities.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {prefName}の他の自治体
          </h2>
          <div className="flex flex-wrap gap-2">
            {samePrefCities.map((m) => {
              const r = m.overall_rate as number | null;
              const color = r == null ? "#94a3b8" : r >= 1.0 ? "#378445" : r >= 0.75 ? "#1D4ED8" : r >= 0.5 ? "#d97706" : "#b91c1c";
              return (
                <a key={m.city}
                  href={`/municipalities/${encodeURIComponent(prefName)}/${encodeURIComponent(m.city)}`}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}>
                  {m.city}
                  {r != null && (
                    <span className="font-bold tabular-nums" style={{ color }}>{(r * 100).toFixed(0)}%</span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ニュースレター CTA */}
      <ArticleNewsletterBanner />
    </div>
  );
}
