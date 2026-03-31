import type { Metadata } from "next";
import { notFound } from "next/navigation";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { Municipality, BusinessSummary } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import Breadcrumb from "@/components/Breadcrumb";
import PrintButton from "@/components/PrintButton";
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
  const ogUrl = `https://gcinsight.jp/og?title=${encodeURIComponent(`${pref} ${cityName}`)}&subtitle=${encodeURIComponent("自治体別 標準化進捗")}&type=municipality${rateParam}`;
  return {
    title: `${pref} ${cityName} | 自治体別 標準化進捗 | GC Insight`,
    description: `${pref}${cityName}のガバメントクラウド移行状況。20業務の手続き進捗率・採用ベンダー・クラウド基盤を一覧表示。`,
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl],
    },
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

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

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
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: `${info.color}20`, color: info.color }}
    >
      {info.label}
    </span>
  );
}

function VendorChip({ vendorName, cloud }: { vendorName: string; cloud: string | null }) {
  const info = cloud ? (CLOUD_MAP[cloud] ?? { color: "#64748B" }) : null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
      style={{
        borderColor: info ? `${info.color}40` : "#e2e8f0",
        backgroundColor: info ? `${info.color}08` : "#f8fafc",
        color: "#374151",
      }}
    >
      {cloud && <CloudBadge cloud={cloud} />}
      <span>{vendorName}</span>
    </span>
  );
}

export default async function MunicipalityDetailPage({ params }: Props) {
  const { prefecture, city } = await params;
  const prefName = decodeURIComponent(prefecture);
  const cityName = decodeURIComponent(city);

  const municipalities = data.municipalities as Municipality[];
  const muni = municipalities.find(
    (m) => m.prefecture === prefName && m.city === cityName
  );
  if (!muni) notFound();

  const isTokutei = tokuteiData.municipalities.some(
    (m: { prefecture: string; city: string }) =>
      m.prefecture === prefName && m.city === cityName
  );

  const businesses = data.businesses as BusinessSummary[];
  const bizRates = businesses.map((biz) => ({
    name: biz.business,
    rate: muni.business_rates[biz.business] as number | null,
    nationalAvg: biz.avg_rate,
  })).sort((a, b) => (a.rate ?? 999) - (b.rate ?? 999));

  const overallRate = muni.overall_rate as number | null;

  // 同県の他自治体（進捗率降順、最大6件）
  const samePrefCities = municipalities
    .filter((m) => m.prefecture === prefName && m.city !== cityName)
    .sort((a, b) => ((b.overall_rate as number) ?? 0) - ((a.overall_rate as number) ?? 0))
    .slice(0, 6);

  // Supabaseから採用ベンダー情報取得
  const { data: muniRecord } = await supabase
    .from("municipalities")
    .select("id")
    .eq("prefecture", prefName)
    .eq("city", cityName)
    .single();

  // business → { vendorName, cloud } のマップ
  const vendorByBusiness: Record<string, { vendorName: string; cloud: string | null }> = {};
  // business列がnullの行のベンダー（一覧表示用）
  const vendorsWithoutBusiness: { vendorName: string; cloud: string | null }[] = [];

  if (muniRecord) {
    const { data: pkgRows } = await supabase
      .from("municipality_packages")
      .select(`
        business,
        packages (
          package_name,
          vendors ( name, cloud_platform )
        )
      `)
      .eq("municipality_id", muniRecord.id);

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
        } else {
          // business未設定だがベンダー情報はある
          if (vendorName !== "不明" && !vendorsWithoutBusiness.some((v) => v.vendorName === vendorName)) {
            vendorsWithoutBusiness.push({ vendorName, cloud });
          }
        }
      }
    }
  }

  // 主なベンダー一覧（担当業務数降順）
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

  return (
    <div className="space-y-6 municipality-detail">
      <Breadcrumb
        items={[
          { label: "業務完了率", href: "/#business-cards" },
          { label: prefName },
          { label: cityName },
        ]}
      />

      {/* 印刷時のみ表示されるヘッダー（画面上は hidden） */}
      <div className="municipality-print-header hidden">
        <div className="print-logo">GCInsight — gcinsight.jp</div>
        <div className="print-source">
          出典: 総務省・デジタル庁公表データ　出力日時: {new Date().toLocaleDateString("ja-JP")}
        </div>
      </div>

      {/* ヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm text-gray-500">{prefName}</span>
          {isTokutei && (
            <span
              className="inline-block px-2 py-0.5 rounded text-white text-xs font-bold"
              style={{ backgroundColor: "#64748B" }}
            >
              特定移行
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="page-title">{cityName}</h1>
          <PrintButton prefName={prefName} cityName={cityName} />
        </div>
        {overallRate !== null && (
          <p className="page-subtitle">
            全体進捗率:{" "}
            <span className="font-bold" style={{ color: getTextColor(overallRate) }}>
              {formatRate(overallRate)}
            </span>
            　ステータス:{" "}
            <span className="font-bold" style={{ color: getStatusColor(overallRate) }}>
              {getStatusLabel(overallRate)}
            </span>
          </p>
        )}
      </div>

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
                {v.count > 0 && (
                  <span className="text-[10px] text-gray-400">{v.count}業務</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">採用ベンダー情報は現時点では未収録です。</p>
        )}
      </div>

      {/* 20業務の進捗率（ベンダー列付き） */}
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
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${biz.rate * 100}%`, backgroundColor: getBarColor(biz.rate) }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs tabular-nums hidden md:table-cell" style={{ color: "var(--color-text-muted)" }}>
                      <span>{formatRate(biz.nationalAvg)}</span>
                      <span
                        className="ml-1 font-semibold"
                        style={{ color: diff >= 0 ? "#378445" : "#b91c1c" }}
                      >
                        {diff >= 0 ? "+" : ""}{(diff * 100).toFixed(1)}pt
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                        style={{ color: getStatusColor(biz.rate), backgroundColor: `${getStatusColor(biz.rate)}15` }}
                      >
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
                <a
                  key={m.city}
                  href={`/municipalities/${encodeURIComponent(prefName)}/${encodeURIComponent(m.city)}`}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {m.city}
                  {r != null && (
                    <span className="font-bold tabular-nums" style={{ color }}>
                      {(r * 100).toFixed(0)}%
                    </span>
                  )}
                </a>
              );
            })}
            <a
              href={`/prefectures/${encodeURIComponent(prefName)}`}
              className="inline-flex items-center text-xs px-3 py-1.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {prefName}一覧 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
