import type { Metadata } from "next";
import { notFound } from "next/navigation";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { Municipality, BusinessSummary } from "@/lib/types";
import Breadcrumb from "@/components/Breadcrumb";
import PageNavCards from "@/components/PageNavCards";
import BusinessTable from "./BusinessTable";

// SSG: 20業務分の静的パラメータを生成
export function generateStaticParams() {
  return data.businesses.map((biz: BusinessSummary) => ({
    business: biz.business,
  }));
}

type Props = { params: Promise<{ business: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { business } = await params;
  const businessName = decodeURIComponent(business);
  const biz = (data.businesses as BusinessSummary[]).find((b) => b.business === businessName);
  const avgRate = biz?.avg_rate;
  const rateParam = avgRate != null ? `&rate=${(avgRate * 100).toFixed(1)}` : "";
  const ogUrl = `https://gcinsight.jp/og?title=${encodeURIComponent(businessName)}&subtitle=${encodeURIComponent("業務別 自治体進捗一覧")}&type=business${rateParam}`;
  return {
    title: `${businessName} 自治体別進捗一覧 | GC Insight`,
    description: `${businessName}のガバメントクラウド移行 手続き進捗率を全国自治体別に一覧表示。遅延自治体・危機レベルを可視化。`,
    alternates: { canonical: `/businesses/${encodeURIComponent(businessName)}` },
    openGraph: {
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl],
    },
  };
}

// 色分けヘルパー
function getBorderColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#EF4444";
}

export default async function BusinessDetailPage({ params }: Props) {
  const { business } = await params;
  const businessName = decodeURIComponent(business);

  const bizSummary = data.businesses.find(
    (b: BusinessSummary) => b.business === businessName
  );
  if (!bizSummary) notFound();

  const municipalities = data.municipalities as Municipality[];
  const tokuteiSet = new Set(
    tokuteiData.municipalities.map(
      (m: { prefecture: string; city: string }) => `${m.prefecture}_${m.city}`
    )
  );

  // この業務のデータがある全自治体を進捗率昇順でソート
  const allMunis = municipalities
    .filter((m) => {
      const r = m.business_rates[businessName];
      return r !== null && r !== undefined;
    })
    .sort((a, b) => {
      const ra = a.business_rates[businessName] as number;
      const rb = b.business_rates[businessName] as number;
      return ra - rb;
    });

  const pct = bizSummary.avg_rate * 100;
  const borderColor = getBorderColor(bizSummary.avg_rate);

  // 進捗率帯別の分布
  const distribution = { critical: 0, atrisk: 0, ontrack: 0, complete: 0 };
  for (const m of allMunis) {
    const r = m.business_rates[businessName] as number;
    if (r >= 1.0) distribution.complete++;
    else if (r >= 0.75) distribution.ontrack++;
    else if (r >= 0.5) distribution.atrisk++;
    else distribution.critical++;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "業務完了率", href: "/#business-cards" },
          { label: businessName },
        ]}
      />

      {/* ヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">{businessName}</h1>
        <p className="page-subtitle">
          全国平均 手続き進捗率と自治体別の進捗一覧（全{allMunis.length.toLocaleString()}団体）
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="rounded-xl p-4 text-center"
          style={{ border: `2px solid ${borderColor}`, backgroundColor: "#fafbfc" }}
        >
          <p className="text-xs text-gray-500 mb-1">全国平均 進捗率</p>
          <p className="text-3xl font-black tabular-nums" style={{ color: borderColor }}>
            {pct.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-xl p-4 text-center bg-white" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-xs text-gray-500 mb-1">完了</p>
          <p className="text-2xl font-bold text-green-600">{bizSummary.completed}</p>
        </div>
        <div className="rounded-xl p-4 text-center bg-white" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-xs text-gray-500 mb-1">未完了</p>
          <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
            {data.summary.total - bizSummary.completed}
          </p>
        </div>
        <div className="rounded-xl p-4 text-center bg-white" style={{ border: "1px solid #E5E7EB" }}>
          <p className="text-xs text-gray-500 mb-1">危機（50%未満）</p>
          <p className="text-2xl font-bold text-red-700">{bizSummary.critical}</p>
        </div>
      </div>

      {/* 進捗率帯分布 */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-gray-500 mb-2">進捗率帯の分布</p>
        <div className="flex rounded-xl overflow-hidden" style={{ height: 24 }}>
          {[
            { label: "完了", count: distribution.complete, color: "#378445" },
            { label: "順調", count: distribution.ontrack, color: "#1D4ED8" },
            { label: "要注意", count: distribution.atrisk, color: "#F59E0B" },
            { label: "危機", count: distribution.critical, color: "#b91c1c" },
          ].map((s) => (
            <div
              key={s.label}
              style={{ width: `${(s.count / allMunis.length) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.count.toLocaleString()}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {[
            { label: "完了 100%", count: distribution.complete, color: "#378445" },
            { label: "順調 75%+", count: distribution.ontrack, color: "#1D4ED8" },
            { label: "要注意 50-75%", count: distribution.atrisk, color: "#F59E0B" },
            { label: "危機 <50%", count: distribution.critical, color: "#b91c1c" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
              <span className="text-xs font-semibold tabular-nums" style={{ color: s.color }}>
                {s.count.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 自治体一覧テーブル（検索・全件表示付き） */}
      <BusinessTable
        rows={allMunis.map((m) => ({
          prefecture: m.prefecture,
          city: m.city,
          rate: m.business_rates[businessName] as number,
          isTokutei: tokuteiSet.has(`${m.prefecture}_${m.city}`),
        }))}
      />

      <PageNavCards exclude={`/businesses/${encodeURIComponent(businessName)}`} />
    </div>
  );
}
