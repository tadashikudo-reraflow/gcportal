import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { Municipality } from "@/lib/types";
import RiskFilter from "./RiskFilter";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import { CLUSTERS } from "@/lib/clusters";
import Link from "next/link";
import FreshnessBanner from "@/components/FreshnessBanner";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title:
    "ガバメントクラウド移行 遅延リスク自治体一覧 | ガバメントクラウド移行状況ダッシュボード",
  description:
    "2026年3月末を移行目標期限としてガバメントクラウド移行が完了していない遅延リスク自治体の一覧。完了率・都道府県フィルターで検索可能。特定移行支援対象団体を除く。",
  openGraph: {
    title: "遅延リスク自治体一覧 — GCInsight",
    description:
      "2026年3月末の移行目標期限に間に合わない遅延リスク自治体を完了率順に一覧表示。",
    images: [
      {
        url: `/og?title=${encodeURIComponent("遅延リスク自治体一覧")}&subtitle=${encodeURIComponent("2026年3月末移行目標の遅延リスクを可視化")}&type=risk`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/risks" },
};

export default function RisksPage() {
  const { summary } = data;

  // 特定移行支援対象自治体のSetを構築（除外用）
  const tokuteiSet = new Set<string>(
    (tokuteiData.municipalities as { prefecture: string; city: string }[]).map(
      (m) => `${m.prefecture}/${m.city}`
    )
  );

  const allRisk: Municipality[] = data.risk_municipalities as Municipality[];

  // 特定移行支援対象自治体を除外した純粋な遅延リスク
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
  const TOKUTEI_OFFICIAL = tokuteiData.total_count as number; // 公式総数935（都道府県含む）
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
      {/* パンくず + ページヘッダー */}
      <Breadcrumb items={[{ label: "遅延リスク自治体" }]} />
      <div className="pb-2">
        <h1 className="page-title">遅延リスク 自治体一覧</h1>
        <p className="page-subtitle">
          手続き進捗率50%未満かつ特定移行支援対象外の自治体（2026年3月末 移行目標）
        </p>
      </div>

      {/* 特定移行除外の注記 */}
      {tokuteiOverlapCount > 0 && (
        <div
          className="flex items-start gap-3 rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" className="flex-shrink-0 mt-0.5">
            <path d="M13 16h-1v-4h-1m1-4h.01" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          <span style={{ color: "#475569" }}>
            50%未満のうち<strong>{tokuteiOverlapCount}自治体</strong>は特定移行支援の対象として整理済み（移行計画延長）のため本リストから除外。{" "}
            <Link href="/tokutei" className="underline font-semibold">特定移行ページ →</Link>
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
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>危機自治体の平均 手続き進捗率</p>
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
            {Date.now() >= new Date("2026-03-31").getTime() ? (
              <>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>移行目標期限</p>
                <p className="text-xs font-semibold" style={{ color: "#b91c1c" }}>期限到達済み</p>
              </>
            ) : (
              <>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>移行目標期限まで</p>
                <p className="text-xs tabular-nums font-semibold" style={{ color: "#b91c1c" }}>
                  {Math.ceil((new Date("2026-03-31").getTime() - Date.now()) / 86400000)}日
                </p>
              </>
            )}
          </div>
        </div>

        {/* 50%未満の内訳バー（遅延リスク + 特定移行認定） */}
        {(() => {
          const total50 = riskMunicipalities.length + tokuteiOverlapCount;
          const riskPct = total50 > 0 ? (riskMunicipalities.length / total50) * 100 : 0;
          const tokuteiPct = total50 > 0 ? (tokuteiOverlapCount / total50) * 100 : 0;
          return (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
                手続き進捗率 50%未満の自治体（計 {total50}）
              </p>
              <div className="flex rounded-lg overflow-hidden h-8 text-xs font-bold">
                <div
                  className="flex items-center justify-center text-white"
                  style={{ width: `${riskPct}%`, backgroundColor: "#b91c1c" }}
                  title={`遅延リスク: ${riskMunicipalities.length}自治体`}
                >
                  遅延リスク {riskMunicipalities.length}
                </div>
                <div
                  className="flex items-center justify-center"
                  style={{ width: `${tokuteiPct}%`, backgroundColor: "#94a3b8", color: "#fff" }}
                  title={`特定移行認定: ${tokuteiOverlapCount}自治体`}
                >
                  特定移行認定 {tokuteiOverlapCount}
                </div>
              </div>
              <div className="flex gap-4 mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#b91c1c" }} />遅延リスク（期限超過懸念）</span>
                <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#94a3b8" }} />特定移行認定（延長対象）</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 移行目標超過のリスク（折りたたみ） */}
      <details className="card p-5" open>
        <summary className="text-base font-bold list-none flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          移行目標期限を超過した場合の想定リスク
        </summary>
        <div className="mt-3">
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
            ※ 罰則規定はなく、目標期限は法的強制力のない努力目標です。<Link href="/articles/gc-standardization-law-guide" className="underline ml-1" style={{ color: "var(--color-brand-secondary)" }}>詳しくはコラム →</Link>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: "財政", title: "補助金・財政支援の喪失" },
              { label: "連携", title: "自治体間連携からの孤立" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg p-3 flex items-center gap-3"
                style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
              >
                <span className="text-xs font-bold px-2 py-1 rounded-md flex-shrink-0" style={{ backgroundColor: "#fecaca", color: "#991b1b" }}>{item.label}</span>
                <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* テーブル（フィルター付き Client Component） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <RiskFilter rows={rows} prefectures={prefectures} />
      </div>

      {/* 特定移行案内 */}
      <div className="card p-5 flex items-start gap-3" style={{ backgroundColor: "#f1f5f9" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <div>
          <p className="text-sm font-bold mb-1" style={{ color: "#475569" }}>
            特定移行支援システム認定とは
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            特定移行支援の対象として整理された自治体（{TOKUTEI_OFFICIAL.toLocaleString()}団体）は移行計画延長として扱われるため、本リストから除外しています。
          </p>
          <Link
            href="/tokutei"
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold underline"
            style={{ color: "#475569" }}
          >
            特定移行認定自治体を確認する →
          </Link>
        </div>
      </div>

      {/* 指標の説明 */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-xs font-bold text-gray-700 mb-2">指標の定義</p>
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 font-semibold text-amber-700 mt-0.5">手続き進捗率（82%）</span>
            <span>= 40ステップ中の完了ステップ割合（作業着手ベース）。書類手続き・計画策定が完了していても、システムが実際にガバメントクラウドへ移行済みとは限りません。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 font-semibold text-green-700 mt-0.5">システム移行率（38.4%）</span>
            <span>= 実際にガバメントクラウドへ本番移行完了したシステムの割合（令和8年1月末時点、デジタル庁2026年2月27日公表）。</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            ※ 2つの指標の大きなギャップ（約44ポイント）が移行の実態を表しています。手続きは進んでいても、実際のシステム移行は大幅に遅れています。
          </p>
        </div>
      </div>

      <FreshnessBanner dataMonth={summary.data_month} pageLabel="遅延リスク" />
      <SourceAttribution sourceIds={PAGE_SOURCES.risks} pageId="risks" />

      <PageNavCards exclude="/risks" />
      <RelatedArticles cluster={CLUSTERS.risk} />
    </div>
  );
}
