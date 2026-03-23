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
import GlossaryTooltip from "@/components/GlossaryTooltip";
import { PAGE_SOURCES } from "@/lib/sources";
import { COST_CONSTANTS } from "@/lib/constants";

const avgRate = (data.summary.avg_rate * 100).toFixed(1);

export const metadata: Metadata = {
  title:
    "GC Insight｜全国1,741自治体の「現在地」と「遅延リスク」を可視化",
  description: `全国平均完了率${avgRate}%。1,741自治体のガバメントクラウド移行進捗・特定移行認定・遅延リスクを可視化するダッシュボード。`,
  alternates: { canonical: "/" },
  openGraph: {
    title: "GC Insight — 全国ガバメントクラウド移行ダッシュボード",
    description: `全国平均完了率${avgRate}%。1,741自治体の移行進捗をリアルタイム可視化。`,
    images: [
      {
        url: `/og?title=${encodeURIComponent("全国1,741自治体の「現在地」と「遅延リスク」を可視化")}&subtitle=${encodeURIComponent(`全国平均完了率 ${avgRate}%`)}&rate=${data.summary.avg_rate}`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

type StandardMunicipality = {
  prefecture: string;
  city: string;
  overall_rate: number;
  business_rates: Record<string, number>;
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
  if (rate >= 0.5) return "#FA6414";
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
  const allMunis = (data as { municipalities: StandardMunicipality[] }).municipalities;

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
    const s = getStatus(m.overall_rate, false);
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

  // Hero用の自治体リスト
  const heroMunis = allMunis.map((m) => ({ prefecture: m.prefecture, city: m.city }));

  return (
    <div className="space-y-6">
      {/* ========== Hero セクション ========== */}
      <HeroSection
        completionRate={summary.avg_rate}
        remainingDays={remainingDays}
        deadline={summary.deadline}
        totalMunicipalities={TOTAL}
        completeCount={completeCount}
        tokuteiCount={TOKUTEI_OFFICIAL}
        dataMonth={summary.data_month}
        municipalities={heroMunis}
      />

      {/* データ鮮度バナー */}
      <FreshnessBanner dataMonth={summary.data_month} pageLabel="ダッシュボード" />

      {/* ========== 5段階ステータスKPIカード ========== */}
      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          移行ステータス
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatusKpiCard count={completeCount} total={TOTAL} label="完了" sub="100%完了" color="#378445" cls="kpi-card kpi-card-complete" />
          <StatusKpiCard count={ontrackCount}  total={TOTAL} label="順調" sub="75%以上"  color="#1D4ED8" cls="kpi-card kpi-card-ontrack"  />
          <StatusKpiCard count={atriskCount}   total={TOTAL} label="要注意" sub="50〜75%" color="#FA6414" cls="kpi-card kpi-card-atrisk"   />
          <StatusKpiCard count={criticalCount} total={TOTAL} label="危機"   sub="50%未満" color="#B91C1C" cls="kpi-card kpi-card-critical" />
          <Link href="/tokutei" className="kpi-card kpi-card-tokutei block" style={{ textDecoration: "none" }}>
            <p className="tabular-nums" style={{ fontSize: 32, fontWeight: 800, color: "#7C3AED", margin: 0, lineHeight: 1 }}>
              {TOKUTEI_OFFICIAL.toLocaleString()}
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", marginTop: 6 }}>
              <GlossaryTooltip term="特定移行認定">特定移行</GlossaryTooltip>
            </p>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
              認定団体（うち市区町村{TOKUTEI_MUNI_COUNT}） →
            </p>
          </Link>
        </div>
      </div>

      {/* ステータス分布バー */}
      <div className="card px-5 py-3">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
          全 {TOTAL.toLocaleString()} 自治体のステータス分布
        </p>
        <div className="flex rounded-full overflow-hidden h-6">
          <div style={{ width: `${(completeCount / TOTAL) * 100}%`, backgroundColor: "#378445" }} title={`完了: ${completeCount}`} />
          <div style={{ width: `${(ontrackCount / TOTAL) * 100}%`, backgroundColor: "#1D4ED8" }} title={`順調: ${ontrackCount}`} />
          <div style={{ width: `${(atriskCount / TOTAL) * 100}%`, backgroundColor: "#FA6414" }} title={`要注意: ${atriskCount}`} />
          <div style={{ width: `${(criticalCount / TOTAL) * 100}%`, backgroundColor: "#b91c1c" }} title={`危機: ${criticalCount}`} />
          <div style={{ width: `${(TOKUTEI_MUNI_COUNT / TOTAL) * 100}%`, backgroundColor: "#7c3aed" }} title={`特定移行: ${TOKUTEI_MUNI_COUNT}`} />
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {[
            { label: "完了", color: "#378445", count: completeCount },
            { label: "順調", color: "#1D4ED8", count: ontrackCount },
            { label: "要注意", color: "#FA6414", count: atriskCount },
            { label: "危機", color: "#b91c1c", count: criticalCount },
            { label: "特定移行", color: "#7c3aed", count: TOKUTEI_MUNI_COUNT },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
              {s.label}: {s.count.toLocaleString()}
            </span>
          ))}
        </div>
      </div>

      {/* ========== 業務別完了率 ========== */}
      <div className="card p-6">
        <h2
          className="text-sm font-bold mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          業務別完了率
          <span className="text-xs font-normal ml-2" style={{ color: "var(--color-text-muted)" }}>完了率降順</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {sortedBusinesses.map((biz) => {
            const pct = biz.avg_rate * 100;
            const barColor = getRateColor(biz.avg_rate);
            return (
              <div
                key={biz.business}
                className="bg-white rounded-xl p-3 flex flex-col gap-2"
                style={{ border: "1px solid #E5E7EB" }}
              >
                <p
                  className="text-xs leading-snug"
                  style={{ color: "var(--color-text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  title={biz.business}
                >
                  {biz.business}
                </p>
                <p
                  className="tabular-nums font-black leading-none"
                  style={{ fontSize: 20, color: barColor }}
                >
                  {pct.toFixed(1)}%
                </p>
                <div className="rounded-full overflow-hidden" style={{ height: 8, backgroundColor: "#e5e7eb" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">凡例:</span>
          {[
            { label: "完了(90%+)", color: "#378445" },
            { label: "順調(70-89%)", color: "#1D4ED8" },
            { label: "要注意(50-69%)", color: "#FA6414" },
            { label: "危機(<50%)", color: "#b91c1c" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 日本地図ヒートマップ */}
      <JapanMap prefectures={prefectures} />

      {/* ========== 都道府県別一覧テーブル ========== */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          都道府県別
          <span className="text-xs font-normal ml-2" style={{ color: "var(--color-text-muted)" }}>完了率の低い順</span>
        </h2>
        <PrefectureRanking prefectures={prefectures} tokuteiByPref={tokuteiByPref} />
      </div>

      {/* ========== 初見者向け「特定移行」ガイド ========== */}
      <div className="rounded-xl px-5 py-3 flex items-center gap-3" style={{ backgroundColor: "#f0f5ff" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <strong style={{ color: "var(--color-gov-primary)" }}>特定移行</strong>（{TOKUTEI_OFFICIAL.toLocaleString()}団体）は期限延長が認められた別枠扱いです。{" "}
          <Link href="/tokutei" className="font-medium underline" style={{ color: "var(--color-gov-primary)" }}>
            詳しくは特定移行ページへ →
          </Link>
        </p>
      </div>

      {/* ========== 遅延リスク自治体TOP20 ========== */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          遅延リスク TOP20
          <span className="text-xs font-normal ml-2" style={{ color: "var(--color-text-muted)" }}>完了率50%未満・特定移行除く（全{riskMunis.length}件）</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">順位</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">都道府県</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">市区町村</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">完了率</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {top20Risk.map((muni, i) => {
                const rate = muni.overall_rate ?? 0;
                return (
                  <tr
                    key={`${muni.prefecture}-${muni.city}`}
                    className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-xs text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-2 text-gray-600 text-xs whitespace-nowrap">{muni.prefecture}</td>
                    <td className="py-2.5 px-2 font-medium text-gray-800 truncate max-w-[120px]">{muni.city}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="font-bold text-sm" style={{ color: getRateColor(rate) }}>
                        {formatRate(rate)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        危機
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            全 {riskMunis.length} 件中 TOP20 を表示
          </p>
          <Link
            href="/risks"
            className="text-xs font-medium hover:underline"
            style={{ color: "#003087" }}
          >
            全件表示 →
          </Link>
        </div>
      </div>

      {/* ========== CTA セクション（行動喚起） ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1枚目: インパクト数字付き（大きめ、2列ぶち抜き） */}
        <Link href="/risks" className="cta-card sm:col-span-2 sm:flex-row sm:items-center" style={{ flexDirection: "row", gap: "1.5rem" }}>
          <div className="flex flex-col items-center flex-shrink-0" style={{ minWidth: 80 }}>
            <span className="tabular-nums font-black" style={{ fontSize: 36, color: "#B91C1C", lineHeight: 1 }}>
              {riskMunis.length}
            </span>
            <span className="text-xs font-semibold mt-1" style={{ color: "#B91C1C" }}>自治体</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="cta-card-title">遅延リスク自治体</span>
            <span className="cta-card-desc">完了率50%未満を人口帯・地域でフィルター</span>
            <span className="cta-card-link">
              一覧を見る
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
          </div>
        </Link>

        {/* 2枚目: 標準カード（アイコン+テキスト） */}
        <Link href="/costs" className="cta-card">
          <div className="cta-card-icon" style={{ backgroundColor: "#FEF3C7" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <span className="cta-card-title">コスト分析</span>
          <span className="cta-card-desc">移行コスト平均{COST_CONSTANTS.avgCostIncrease}倍の要因をベンダー別に比較</span>
          <span className="cta-card-link">
            コスト分析を見る
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </span>
        </Link>

        {/* 3枚目: テキスト主体（アイコンなし、背景色付き） */}
        <Link
          href="/report"
          className="cta-card"
          style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <span className="cta-card-title" style={{ color: "#1E40AF" }}>
            全体レポート（PDF）
          </span>
          <span className="cta-card-desc">最新の全国サマリーを社内共有・報告資料に</span>
          <span className="cta-card-link">
            無料ダウンロード
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
        </Link>
      </div>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.dashboard} pageId="dashboard" />
    </div>
  );
}

function StatusKpiCard({ count, total, label, sub, color, cls }: {
  count: number; total: number; label: string; sub: string; color: string; cls: string;
}) {
  return (
    <div className={cls}>
      <p className="tabular-nums" style={{ fontSize: 32, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>
        {count.toLocaleString()}
      </p>
      <p style={{ fontSize: 12, fontWeight: 700, color, marginTop: 6 }}>{label}</p>
      <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
        ({((count / total) * 100).toFixed(1)}%) {sub}
      </p>
    </div>
  );
}
