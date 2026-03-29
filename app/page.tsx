import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import migrationStats from "@/public/data/migration_stats.json";
import Link from "next/link";
import FreshnessBanner from "@/components/FreshnessBanner";
import HeroSection from "@/components/HeroSection";
import JapanMap from "@/components/JapanMap";
import PrefectureRanking from "@/components/PrefectureRanking";
import SourceAttribution from "@/components/SourceAttribution";
import ThreeMetricsWidget from "@/components/ThreeMetricsWidget";
import BusinessCards from "@/components/BusinessCards";
import { PAGE_SOURCES } from "@/lib/sources";
import { COST_CONSTANTS } from "@/lib/constants";
import { Municipality } from "@/lib/types";

export const metadata: Metadata = {
  title:
    "GC Insight｜全国1,741自治体の「現在地」と「遅延リスク」を可視化",
  description: `システム移行率38.4%（13,283/34,592システム）、全20業務完了の自治体はわずか${data.summary.completed_count}団体（3.7%）。1,741自治体のガバメントクラウド移行進捗・コスト・遅延リスクを可視化するダッシュボード。`,
  alternates: { canonical: "/" },
  openGraph: {
    title: "GC Insight — 全国ガバメントクラウド移行ダッシュボード",
    description: `システム移行率38.4%・全20業務完了は${data.summary.completed_count}団体（3.7%）。1,741自治体のガバメントクラウド移行進捗をリアルタイム可視化。`,
    images: [
      {
        url: `/og?title=${encodeURIComponent("全国1,741自治体の「現在地」と「遅延リスク」を可視化")}&subtitle=${encodeURIComponent(`移行完了 ${data.summary.completed_count} / 1,741自治体`)}&rate=${data.summary.completed_count / data.summary.total}`,
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

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#F59E0B";
  return "#b91c1c";
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

function calcRemainingDays(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline + "T23:59:59+09:00");
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

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

  // 特定移行の都道府県別カウント
  const tokuteiByPref: Record<string, number> = {};
  for (const m of tokuteiData.municipalities as { prefecture: string; city: string }[]) {
    tokuteiByPref[m.prefecture] = (tokuteiByPref[m.prefecture] ?? 0) + 1;
  }
  const TOKUTEI_MUNI_COUNT = tokuteiSet.size;
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

  // 遅延リスク（特定移行を除外した危機自治体）
  const riskMunis = risk_municipalities.filter(
    (m) => !tokuteiSet.has(`${m.prefecture}/${m.city}`)
  );
  const top20Risk = riskMunis.slice(0, 20);

  const remainingDays = calcRemainingDays(summary.deadline);
  const completedPct = ((completeCount / TOTAL) * 100).toFixed(1);

  // 業務別: 完了率降順
  const sortedBusinesses = [...businesses].sort((a, b) => b.avg_rate - a.avg_rate);


  return (
    <div className="space-y-6">
      {/* ========== Hero セクション ========== */}
      <HeroSection
        remainingDays={remainingDays}
        deadline={summary.deadline}
        totalMunicipalities={TOTAL}
        completeCount={completeCount}
        tokuteiCount={TOKUTEI_OFFICIAL}
        dataMonth={summary.data_month}
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

      {/* データ鮮度バナー */}
      <FreshnessBanner dataMonth={summary.data_month} pageLabel="ダッシュボード" />

      {/* ========== ステータス分布バー（統合版） ========== */}
      <div className="status-bar-card">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            全 {TOTAL.toLocaleString()} 自治体の移行ステータス
          </h2>
          <Link href="/tokutei" className="text-xs font-medium no-underline hover:underline" style={{ color: "var(--color-brand-primary)" }}>
            特定移行とは？ →
          </Link>
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ height: 32 }}>
          {[
            { label: "完了", count: completeCount, color: "#378445" },
            { label: "順調", count: ontrackCount, color: "#1D4ED8" },
            { label: "要注意", count: atriskCount, color: "#F59E0B" },
            { label: "危機", count: criticalCount, color: "#b91c1c" },
            { label: "特定移行", count: TOKUTEI_OFFICIAL, color: "#64748B" },
          ].map((s) => (
            <div
              key={s.label}
              style={{ width: `${(s.count / TOTAL) * 100}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.count.toLocaleString()}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
          {[
            { label: "完了", count: completeCount, color: "#378445", sub: "全20業務100%" },
            { label: "順調", count: ontrackCount, color: "#1D4ED8", sub: "75%以上" },
            { label: "要注意", count: atriskCount, color: "#F59E0B", sub: "50〜75%" },
            { label: "危機", count: criticalCount, color: "#b91c1c", sub: "50%未満" },
            { label: "特定移行", count: TOKUTEI_OFFICIAL, color: "#64748B", sub: "期限延長" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-sm font-semibold tabular-nums" style={{ color: s.color }}>
                {s.count.toLocaleString()}
              </span>
              <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {s.label}
              </span>
              <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                {s.sub}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========== 進捗率の注釈バナー ========== */}
      <div className="rounded-xl px-5 py-3 flex items-start gap-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
        <span style={{ color: "#dc2626", fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠</span>
        <p className="text-xs leading-relaxed" style={{ color: "#991b1b" }}>
          <strong>手続き進捗率は移行完了ではありません。</strong>
          準備工程を含むため、全20業務が完了した自治体は <strong>{completeCount} / {TOTAL.toLocaleString()}（{completedPct}%）</strong> にとどまります。
        </p>
      </div>

      {/* ========== 業務別 手続き進捗率 ========== */}
      <BusinessCards
        businesses={sortedBusinesses}
        total={TOTAL}
      />

      {/* 日本地図ヒートマップ */}
      <JapanMap prefectures={prefectures} />

      {/* ========== 初見者向け「特定移行」ガイド ========== */}
      <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{ backgroundColor: "#f0f5ff" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <strong style={{ color: "var(--color-gov-primary)" }}>特定移行</strong>（{TOKUTEI_OFFICIAL.toLocaleString()}団体）は期限延長が認められた別枠です。{" "}
          <Link href="/tokutei" className="font-medium underline" style={{ color: "var(--color-gov-primary)" }}>
            詳しくは特定移行ページへ →
          </Link>
        </p>
      </div>

      {/* ========== 次に調べる（回遊CTA） ========== */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>次に調べる</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="/risks" className="explore-card">
            <span className="explore-card-badge" style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}>
              {riskMunis.length}件
            </span>
            <span className="explore-card-title">遅延リスク自治体</span>
            <span className="explore-card-desc">進捗50%未満の自治体を地域・人口帯で絞り込む</span>
          </Link>

          <Link href="/benchmark" className="explore-card">
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

          <Link href="/report?from=home_cta" className="explore-card" style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}>
            <span className="explore-card-badge" style={{ backgroundColor: "#BFDBFE", color: "#1E40AF" }}>
              無料PDF
            </span>
            <span className="explore-card-title" style={{ color: "#1E40AF" }}>全体レポート</span>
            <span className="explore-card-desc">全国サマリーを報告資料向けにダウンロード</span>
          </Link>
        </div>
      </div>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.dashboard} pageId="dashboard" />
    </div>
  );
}

