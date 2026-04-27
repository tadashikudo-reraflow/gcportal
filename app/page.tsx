import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import migrationStats from "@/public/data/migration_stats.json";
import Link from "next/link";
import NewsletterBanner from "@/components/NewsletterBanner";
import NewsletterExploreCard from "@/components/NewsletterExploreCard";
import HeroSection from "@/components/HeroSection";
import JapanMap from "@/components/JapanMap";
import SourceAttribution from "@/components/SourceAttribution";
import ThreeMetricsWidget from "@/components/ThreeMetricsWidget";
import BusinessCards from "@/components/BusinessCards";
import GlossaryTooltip from "@/components/GlossaryTooltip";
import PrefectureSelector from "@/components/PrefectureSelector";
import Callout from "@/components/Callout";
import { PAGE_SOURCES } from "@/lib/sources";
import { COST_CONSTANTS } from "@/lib/constants";
import { Municipality } from "@/lib/types";

// 完了率: ゼロ除算・null安全。SSRでデータ取得失敗時も NaN/Infinity を出さない
const _total = data?.summary?.total ?? 0;
const _completed = data?.summary?.completed_count ?? 0;
const completionRate = _total > 0 ? (_completed / _total) * 100 : 0;
const completionRateStr = completionRate.toFixed(1);

export const metadata: Metadata = {
  title:
    "ガバメントクラウド移行ダッシュボード｜1,741自治体の進捗・コスト・遅延を可視化｜GCInsight",
  description: `移行完了わずか${_completed}団体（${completionRateStr}%）、コスト平均2.3倍。全国1,741自治体のガバメントクラウド移行進捗・コスト・遅延リスクをリアルタイム可視化する無料ダッシュボード。`,
  alternates: { canonical: "/" },
  openGraph: {
    title: "GC Insight — 全国ガバメントクラウド移行ダッシュボード",
    description: `システム移行率38.4%・全20業務完了は${_completed}団体（${completionRateStr}%）。1,741自治体のガバメントクラウド移行進捗をリアルタイム可視化。`,
    images: [
      {
        url: `/og?title=${encodeURIComponent("全国1,741自治体の「現在地」と「遅延リスク」を可視化")}&subtitle=${encodeURIComponent(`移行完了 ${_completed} / 1,741自治体`)}&rate=${_total > 0 ? _completed / _total : 0}`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

// 5段階ステータス
function getStatus(rate: number, isTokutei: boolean): "tokutei" | "complete" | "ontrack" | "atrisk" | "critical" {
  if (isTokutei) return "tokutei";
  if (rate >= 1.0) return "complete";
  if (rate >= 0.75) return "ontrack";
  if (rate >= 0.5) return "atrisk";
  return "critical";
}

function calcRemainingDays(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline + "T23:59:59+09:00");
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ステータスバーのセグメント定義（クリック先付き）
const STATUS_SEGMENTS = [
  { label: "完了", color: "#378445", sub: "全20業務100%", href: "/progress?status=completed" },
  { label: "順調", color: "#1D4ED8", sub: "75%以上", href: "/progress?status=on_track" },
  { label: "要注意", color: "#F59E0B", sub: "50〜75%", href: "/progress?status=warning" },
  { label: "危機", color: "#b91c1c", sub: "50%未満", href: "/progress?status=critical" },
  { label: "特定移行", color: "#64748B", sub: "期限延長", href: "/progress?status=tokutei" },
];

export default function DashboardPage() {
  const { summary, prefectures, businesses, risk_municipalities } = data;
  const allMunis = (data as { municipalities: Municipality[] }).municipalities;

  // 特定移行認定Set
  const tokuteiSet = new Set<string>(
    (tokuteiData.municipalities as { prefecture: string; city: string }[]).map(
      (m) => `${m.prefecture}/${m.city}`
    )
  );
  const TOKUTEI_OFFICIAL = tokuteiData.total_count as number;
  const TOTAL = summary.total;

  // 5段階分類
  let completeCount = 0;
  let ontrackCount = 0;
  let atriskCount = 0;
  let criticalCount = 0;

  for (const m of allMunis) {
    const isTokutei = tokuteiSet.has(`${m.prefecture}/${m.city}`);
    if (isTokutei) continue;
    const s = getStatus(m.overall_rate ?? 0, false);
    if (s === "complete") completeCount++;
    else if (s === "ontrack") ontrackCount++;
    else if (s === "atrisk") atriskCount++;
    else criticalCount++;
  }

  const statusCounts: Record<string, number> = {
    完了: completeCount,
    順調: ontrackCount,
    要注意: atriskCount,
    危機: criticalCount,
    特定移行: TOKUTEI_OFFICIAL,
  };

  // 遅延リスク（特定移行を除外した危機自治体）
  const riskMunis = risk_municipalities.filter(
    (m) => !tokuteiSet.has(`${m.prefecture}/${m.city}`)
  );

  const remainingDays = calcRemainingDays(summary.deadline);
  // 業務別: 完了率降順
  const sortedBusinesses = [...businesses].sort((a, b) => b.avg_rate - a.avg_rate);

  return (
    <div className="space-y-12">
      {/* ========== Hero セクション ========== */}
      <HeroSection
        remainingDays={remainingDays}
        deadline={summary.deadline}
        totalMunicipalities={TOTAL}
        completeCount={completeCount}
        tokuteiCount={TOKUTEI_OFFICIAL}
        dataMonth={summary.data_month}
        municipalities={allMunis}
      />

      {/* ========== 3指標比較ウィジェット（ヒーロー直下） ========== */}
      <ThreeMetricsWidget
        completeRate={completeCount / TOTAL}
        systemRate={migrationStats.completion_rate}
        stepRate={summary.avg_rate}
        completeCount={completeCount}
        totalMunicipalities={TOTAL}
        completedSystems={migrationStats.completed_systems}
        totalSystems={migrationStats.total_systems}
      />

      {/* ========== 差別化ストリップ（ThreeMetrics直後） ========== */}
      <div
        className="card p-4"
        style={{ borderLeft: "4px solid #00338D" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <p className="text-xs font-bold" style={{ color: "#00338D" }}>
              民間唯一の総合GCダッシュボード — 22機能中18項目に対応
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["CSPコスト試算", "パッケージDB", "開示請求データ", "FinOps分析"].map((f) => (
                <span key={f} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#00338D18", color: "#00338D" }}>
                  {f}
                </span>
              ))}
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f3f4f6", color: "#4b5563" }}>
                総務省・デジタル庁にはない独自機能
              </span>
            </div>
          </div>
          <Link
            href="/compare"
            className="text-xs font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap text-center"
            style={{ backgroundColor: "#00338D", color: "#fff" }}
          >
            機能比較を見る →
          </Link>
        </div>
      </div>

      {/* ========== ニュースレター登録バナー ========== */}
      <NewsletterBanner />

      {/* ========== 日本地図ヒートマップ（ThreeMetrics直後） ========== */}
      <div>
        {/* 都道府県ドロップダウン */}
        <div className="flex items-center gap-3 mb-4">
          <label
            htmlFor="pref-select"
            className="text-xs lg:text-sm font-medium flex-shrink-0"
            style={{ color: "var(--color-text-secondary)" }}
          >
            都道府県を選択
          </label>
          <PrefectureSelector />
        </div>
        <p className="text-xs lg:text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          都道府県をクリックで詳細を確認
        </p>
        <JapanMap prefectures={prefectures} />
      </div>

      {/* ========== ステータス分布バー（クリック可能） ========== */}
      <div className="status-bar-card">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm lg:text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
            全 {TOTAL.toLocaleString()} 自治体の移行ステータス
          </h2>
          <Link href="/progress?status=tokutei" className="text-xs lg:text-sm font-medium no-underline hover:underline" style={{ color: "var(--color-brand-primary)" }}>
            特定移行とは？ →
          </Link>
        </div>

        {/* クリッカブルバー */}
        <div className="flex rounded-xl overflow-hidden" style={{ height: 32 }} role="img" aria-label={`移行ステータス内訳: ${STATUS_SEGMENTS.map((s) => `${s.label} ${statusCounts[s.label] ?? 0}団体`).join("、")}`}>
          {STATUS_SEGMENTS.map((s) => {
            const count = statusCounts[s.label] ?? 0;
            return (
              <Link
                key={s.label}
                href={s.href}
                style={{
                  width: `${(count / TOTAL) * 100}%`,
                  backgroundColor: s.color,
                  display: "block",
                  transition: "opacity 0.15s",
                }}
                title={`${s.label}: ${count.toLocaleString()}団体 — クリックで詳細`}
                className="hover:opacity-80 cursor-pointer"
              />
            );
          })}
        </div>

        {/* クリッカブル凡例 */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
          {STATUS_SEGMENTS.map((s) => {
            const count = statusCounts[s.label] ?? 0;
            return (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-2 no-underline hover:opacity-75 transition-opacity"
              >
                <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm lg:text-base font-semibold tabular-nums" style={{ color: s.color }}>
                  {count.toLocaleString()}
                </span>
                <span className="text-xs lg:text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {s.label}
                </span>
                <span className="text-[10px] lg:text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {s.sub}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Footnote（赤バナー廃止・amber footnoteに格下げ） */}
        <p
          className="mt-3 text-[11px] px-3 py-1.5 rounded-lg"
          style={{ color: "#78350f", backgroundColor: "#fef3c7" }}
        >
          ※ <GlossaryTooltip term="手続き進捗率">手続き進捗率</GlossaryTooltip>は移行完了を意味しません
        </p>
      </div>

      {/* ========== 業務別 手続き進捗率（ワースト5デフォルト） ========== */}
      <BusinessCards
        businesses={sortedBusinesses}
        total={TOTAL}
      />

      {/* ========== 初見者向け「特定移行」ガイド ========== */}
      <Callout variant="info">
        <p>
          <GlossaryTooltip term="特定移行"><strong style={{ color: "var(--color-gov-primary)" }}>特定移行</strong></GlossaryTooltip>
          （{TOKUTEI_OFFICIAL.toLocaleString()}団体）は期限延長が認められた別枠です。{" "}
          <Link href="/articles/gc-tokutei-vs-delay" className="font-medium underline" style={{ color: "var(--color-gov-primary)" }}>
            詳しくはコラムで解説 →
          </Link>
        </p>
      </Callout>

      {/* ========== 次に調べる（回遊CTA・視覚階層あり） ========== */}
      <div>
        <p className="text-xs lg:text-sm font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>次に調べる</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* 主要2枚: 大カード（col-span-2） */}
          <Link
            href="/progress?status=critical"
            className="explore-card col-span-2 sm:col-span-1"
            style={{ padding: "1.25rem 1.5rem" }}
          >
            <span className="explore-card-badge" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}>
              {riskMunis.length}件
            </span>
            <span className="explore-card-title" style={{ fontSize: "1rem" }}>遅延リスク自治体</span>
            <span className="explore-card-desc">進捗50%未満の自治体を地域・人口帯で絞り込む</span>
          </Link>

          <NewsletterExploreCard />

          {/* 残り4枚: 小カード */}
          <Link href="/progress" className="explore-card">
            <span className="explore-card-badge" style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}>
              比較
            </span>
            <span className="explore-card-title">自治体を比較</span>
            <span className="explore-card-desc">人口帯・都道府県で類似団体の進捗をベンチマーク</span>
          </Link>

          <Link href="/costs" className="explore-card">
            <span className="explore-card-badge" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
              {COST_CONSTANTS.avgCostIncrease}倍
            </span>
            <span className="explore-card-title">コスト増の要因</span>
            <span className="explore-card-desc">ベンダー別コスト比較と高騰の背景を分析</span>
          </Link>

          <Link href="/finops" className="explore-card">
            <span className="explore-card-badge" style={{ backgroundColor: "#CCFBF1", color: "#0f766e" }}>
              FinOps
            </span>
            <span className="explore-card-title">コスト最適化</span>
            <span className="explore-card-desc">同規模自治体との比較でコスト適正水準を確認</span>
          </Link>

          <Link href="/packages" className="explore-card">
            <span className="explore-card-badge" style={{ backgroundColor: "#F3E8FF", color: "#6B21A8" }}>
              パッケージ
            </span>
            <span className="explore-card-title">導入パッケージ</span>
            <span className="explore-card-desc">ベンダー別の採用状況と自治体数を一覧で確認</span>
          </Link>

          <Link href="/compare" className="explore-card col-span-2 sm:col-span-1" style={{ padding: "1.25rem 1.5rem" }}>
            <span className="explore-card-badge" style={{ backgroundColor: "#00338D18", color: "#00338D" }}>
              22機能比較
            </span>
            <span className="explore-card-title" style={{ fontSize: "1rem" }}>GCInsight vs 総務省 vs デジタル庁</span>
            <span className="explore-card-desc">コスト試算・パッケージDB・開示請求データなど独自機能を3サービスで比較</span>
          </Link>
        </div>
      </div>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.dashboard} pageId="dashboard" dataMonth={summary.data_month} />
    </div>
  );
}

