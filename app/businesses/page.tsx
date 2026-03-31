import type { Metadata } from "next";
import Link from "next/link";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { Municipality, BusinessSummary } from "@/lib/types";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import { CLUSTERS } from "@/lib/clusters";
import Breadcrumb from "@/components/Breadcrumb";

// 特定移行自治体のSetを構築
const tokuteiSet = new Set(
  tokuteiData.municipalities.map((m: { prefecture: string; city: string }) => `${m.prefecture}_${m.city}`)
);

export const metadata: Metadata = {
  title: "自治体標準化20業務 移行進捗一覧 | ガバメントクラウド移行状況ダッシュボード",
  description: "住民記録・税務・福祉等の標準化20業務ごとのガバメントクラウド移行進捗を可視化。遅延している業務と手続き進捗率の全国比較。",
  alternates: { canonical: "/businesses" },
};

// 完了率に応じた枠線色（インラインスタイル用）
function getBorderColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#EF4444";
}

function getBarColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#EF4444";
}

function getTextColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#EF4444";
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

export default function BusinessesPage() {
  const businesses: BusinessSummary[] = [...data.businesses].sort(
    (a, b) => a.avg_rate - b.avg_rate
  );

  const municipalities: Municipality[] = data.municipalities as Municipality[];

  return (
    <div className="space-y-6">
      {/* パンくず + ページヘッダー */}
      <Breadcrumb items={[{ label: "業務別の進捗" }]} />
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">業務別 標準化進捗</h1>
        <p className="page-subtitle">
          全20業務の手続き進捗率を低い順に表示（全{data.summary.total.toLocaleString()}団体対象）
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: "#64748B", fontSize: 10, fontWeight: 700 }}>特定移行</span>
          <span>= 特定移行支援システム対象（{tokuteiData.municipalities.length}市区町村）。期限延長あり。</span>
          <Link href="/progress?status=tokutei" className="underline" style={{ color: "#475569" }}>詳細 →</Link>
        </div>
      </div>

      {/* 進捗率の注釈バナー */}
      <div className="rounded-xl px-5 py-3 flex items-start gap-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
        <span style={{ color: "#dc2626", fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠</span>
        <p className="text-xs leading-relaxed" style={{ color: "#991b1b" }}>
          <strong>手続き進捗率は移行完了ではありません。</strong>
          準備工程を含むため、全20業務完了は <strong>{data.summary.completed_count} / {data.summary.total.toLocaleString()}（{((data.summary.completed_count / data.summary.total) * 100).toFixed(1)}%）</strong> にとどまります。
        </p>
      </div>

      {/* 業務カード グリッド */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {businesses.map((biz, rank) => {
          const borderColor = getBorderColor(biz.avg_rate);
          const barColor = getBarColor(biz.avg_rate);
          const textColor = getTextColor(biz.avg_rate);
          const pct = biz.avg_rate * 100;

          // この業務で遅れている自治体TOP10（business_rates[biz.business]が低い順）
          const bottom10 = municipalities
            .filter((m) => {
              const r = m.business_rates[biz.business];
              return r !== null && r !== undefined;
            })
            .sort((a, b) => {
              const ra = a.business_rates[biz.business] as number;
              const rb = b.business_rates[biz.business] as number;
              return ra - rb;
            })
            .slice(0, 10);

          return (
            <div
              key={biz.business}
              className="bg-white rounded-lg border-2 p-5 shadow-sm"
              style={{ borderColor }}
            >
              {/* 業務名 + 順位 */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-400 font-medium">
                    進捗率 {rank + 1}位（低）
                  </span>
                  <h2 className="text-xl font-bold text-gray-800 mt-0.5">
                    {biz.business}
                  </h2>
                </div>
                <span
                  className="text-2xl font-extrabold leading-none mt-1"
                  style={{ color: textColor }}
                >
                  {formatRate(biz.avg_rate)}
                </span>
              </div>

              {/* プログレスバー */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">全国平均 手続き進捗率</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>

              {/* 完了 / 未完了 / 危機 カウント */}
              <div className="flex items-center gap-3 mb-4 text-sm flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  <span className="text-gray-600">
                    完了:{" "}
                    <strong className="text-green-600">{biz.completed}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  <span className="text-gray-600">
                    未完了:{" "}
                    <strong style={{ color: "#ef4444" }}>{data.summary.total - biz.completed}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  <span className="text-gray-600">
                    危機:{" "}
                    <strong className="text-red-600">{biz.critical}</strong>
                  </span>
                </div>
              </div>

              {/* 遅れている自治体 TOP10 */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  この業務で遅れている自治体 TOP10
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-1 text-gray-400 font-medium w-6">
                        #
                      </th>
                      <th className="text-left py-1 text-gray-400 font-medium">
                        都道府県
                      </th>
                      <th className="text-left py-1 text-gray-400 font-medium">
                        市区町村
                      </th>
                      <th className="text-right py-1 text-gray-400 font-medium">
                        進捗率
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bottom10.map((muni, i) => {
                      const r = muni.business_rates[biz.business] as number;
                      const isTokutei = tokuteiSet.has(`${muni.prefecture}_${muni.city}`);
                      return (
                        <tr
                          key={`${muni.prefecture}-${muni.city}`}
                          className="border-b border-gray-50"
                          style={isTokutei ? { backgroundColor: "#f1f5f9" } : undefined}
                        >
                          <td className="py-1 text-gray-400">{i + 1}</td>
                          <td className="py-1 text-gray-500">
                            {muni.prefecture}
                          </td>
                          <td className="py-1 text-gray-800 font-medium">
                            <span className="flex items-center gap-1">
                              {muni.city}
                              {isTokutei && (
                                <span className="inline-block px-1 py-0 rounded text-white" style={{ backgroundColor: "#64748B", fontSize: 9, fontWeight: 700, lineHeight: "14px" }}>特定移行</span>
                              )}
                            </span>
                          </td>
                          <td className="py-1 text-right font-bold" style={{ color: getTextColor(r) }}>
                            {formatRate(r)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <PageNavCards exclude="/businesses" />
      <RelatedArticles cluster={CLUSTERS.business} />
    </div>
  );
}
