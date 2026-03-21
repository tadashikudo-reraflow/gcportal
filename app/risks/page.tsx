import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { Municipality } from "@/lib/types";
import RiskFilter from "./RiskFilter";
import RelatedArticles from "@/components/RelatedArticles";
import { CLUSTERS } from "@/lib/clusters";
import Link from "next/link";
import FreshnessBanner from "@/components/FreshnessBanner";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";

export const metadata: Metadata = {
  title:
    "ガバメントクラウド移行 遅延リスク自治体一覧 | ガバメントクラウド移行状況ダッシュボード",
  description:
    "2026年3月末期限までにガバメントクラウド移行が完了していない遅延リスク自治体の一覧。完了率・都道府県フィルターで検索可能。特定移行認定団体を除く。",
  openGraph: {
    title: "遅延リスク自治体一覧 — GCInsight",
    description:
      "2026年3月末期限に間に合わない遅延リスク自治体を完了率順に一覧表示。",
    images: [
      {
        url: `/og?title=${encodeURIComponent("遅延リスク自治体一覧")}&subtitle=${encodeURIComponent("2026年3月末期限の移行遅延リスクを可視化")}&type=risk`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

export default function RisksPage() {
  const { summary } = data;

  // 特定移行認定自治体のSetを構築（除外用）
  const tokuteiSet = new Set<string>(
    (tokuteiData.municipalities as { prefecture: string; city: string }[]).map(
      (m) => `${m.prefecture}/${m.city}`
    )
  );

  const allRisk: Municipality[] = data.risk_municipalities as Municipality[];

  // 特定移行認定自治体を除外した純粋な遅延リスク
  const riskMunicipalities = allRisk.filter(
    (m) => !tokuteiSet.has(`${m.prefecture}/${m.city}`)
  );
  const tokuteiOverlapCount = allRisk.length - riskMunicipalities.length;

  // 各自治体の「最も遅れている業務」を算出
  const rows = riskMunicipalities.map((muni, i) => {
    const rates = muni.business_rates;
    const entries = Object.entries(rates).filter(
      ([, v]) => v !== null && v !== undefined
    ) as [string, number][];

    let worstBusiness = "—";
    let worstRate = 0;

    if (entries.length > 0) {
      const [name, rate] = entries.reduce((prev, curr) =>
        curr[1] < prev[1] ? curr : prev
      );
      worstBusiness = name;
      worstRate = rate;
    }

    return {
      rank: i + 1,
      prefecture: muni.prefecture,
      city: muni.city,
      overall_rate: muni.overall_rate ?? 0,
      worst_business: worstBusiness,
      worst_rate: worstRate,
    };
  });

  // 都道府県一覧（重複排除・五十音順）
  const prefectures = [...new Set(riskMunicipalities.map((m) => m.prefecture))].sort();

  // 全自治体数（特定移行含む1,741全体）
  const TOTAL_MUNICIPALITIES = 1741;
  const TOKUTEI_COUNT = tokuteiData.total_count as number;
  const riskRatio = (riskMunicipalities.length / TOTAL_MUNICIPALITIES) * 100;

  // 完了率分布
  const dist = {
    critical: rows.filter((r) => r.overall_rate < 10).length,   // 10%未満
    danger:   rows.filter((r) => r.overall_rate >= 10 && r.overall_rate < 25).length, // 10-25%
    warning:  rows.filter((r) => r.overall_rate >= 25 && r.overall_rate < 50).length, // 25-50%
  };

  // 平均完了率
  const avgRate = rows.length > 0
    ? rows.reduce((s, r) => s + r.overall_rate, 0) / rows.length
    : 0;

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="pb-2">
        <h1 className="page-title">遅延リスク 自治体一覧</h1>
        <p className="page-subtitle">
          2026年3月31日の移行期限に向け、完了率50%未満かつ特定移行認定を受けていない自治体
        </p>
      </div>

      {/* 特定移行除外の注記 */}
      {tokuteiOverlapCount > 0 && (
        <div
          className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "#f3e8ff", border: "1px solid #d8b4fe" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <path d="M13 16h-1v-4h-1m1-4h.01" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span style={{ color: "#6d28d9" }}>
            このリストからデジタル庁の<strong>特定移行支援システム認定 {tokuteiOverlapCount}自治体</strong>は除外しています。
            特定移行団体は別途{" "}
            <Link href="/tokutei" className="underline font-semibold">特定移行認定ページ</Link>
            でご確認いただけます。
          </span>
        </div>
      )}

      {/* 全体サマリー */}
      <div className="card p-5">
        {/* メインKPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#b91c1c" }}>
              {riskMunicipalities.length}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>遅延リスク自治体数</p>
            <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
              全体の {riskRatio.toFixed(1)}%（{TOTAL_MUNICIPALITIES.toLocaleString()}自治体中）
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#d97706" }}>
              {avgRate.toFixed(1)}%
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>危機自治体の平均完了率</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--color-brand-secondary)" }}>
              {prefectures.length}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>対象都道府県</p>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold" style={{ color: "#b91c1c" }}>
              2026/3/31
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>移行期限まで</p>
            <p className="text-xs tabular-nums font-semibold" style={{ color: "#b91c1c" }}>
              {Math.max(0, Math.ceil((new Date("2026-03-31").getTime() - Date.now()) / 86400000))}日
            </p>
          </div>
        </div>

        {/* 危機レベル分布 */}
        {rows.length > 0 && (
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              危機レベル分布（完了率別）
            </p>
            <div className="flex rounded-lg overflow-hidden h-7 text-xs font-bold">
              {dist.critical > 0 && (
                <div
                  className="flex items-center justify-center text-white"
                  style={{ width: `${(dist.critical / rows.length) * 100}%`, backgroundColor: "#b91c1c" }}
                  title={`危険: ${dist.critical}件`}
                >
                  {dist.critical}件
                </div>
              )}
              {dist.danger > 0 && (
                <div
                  className="flex items-center justify-center text-white"
                  style={{ width: `${(dist.danger / rows.length) * 100}%`, backgroundColor: "#d97706" }}
                  title={`警戒: ${dist.danger}件`}
                >
                  {dist.danger}件
                </div>
              )}
              {dist.warning > 0 && (
                <div
                  className="flex items-center justify-center"
                  style={{ width: `${(dist.warning / rows.length) * 100}%`, backgroundColor: "#fef3c7", color: "#92400e" }}
                  title={`注意: ${dist.warning}件`}
                >
                  {dist.warning}件
                </div>
              )}
            </div>
            <div className="flex gap-4 mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#b91c1c" }} />危険 &lt;10%</span>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#d97706" }} />警戒 10-25%</span>
              <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#fef3c7", border: "1px solid #d97706" }} />注意 25-50%</span>
            </div>
          </div>
        )}
      </div>

      {/* テーブル（フィルター付き Client Component） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <RiskFilter rows={rows} prefectures={prefectures} />
      </div>

      {/* 特定移行案内 */}
      <div className="card p-5 flex items-start gap-4" style={{ borderLeft: "4px solid #7c3aed" }}>
        <div className="text-2xl leading-none flex-shrink-0">🏛️</div>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: "#6d28d9" }}>
            特定移行支援システム認定とは
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            デジタル庁が認定した特定移行支援システムの対象となった自治体（{TOKUTEI_COUNT.toLocaleString()}団体）は、
            2026年3月末の期限延長が認められ、別途移行計画が策定されます。
            これらは遅延とは異なる扱いのため、本リストからは除外されています。
          </p>
          <Link
            href="/tokutei"
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold underline"
            style={{ color: "#7c3aed" }}
          >
            特定移行認定自治体を確認する →
          </Link>
        </div>
      </div>

      <FreshnessBanner dataMonth={summary.data_month} pageLabel="遅延リスク" />
      <SourceAttribution sourceIds={PAGE_SOURCES.risks} pageId="risks" />

      <RelatedArticles cluster={CLUSTERS.risk} />
    </div>
  );
}
