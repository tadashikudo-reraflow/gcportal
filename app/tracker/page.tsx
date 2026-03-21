import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import Link from "next/link";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import RegionalDataSection from "./RegionalDataSection";

/* ── helpers ── */

type StandardMunicipality = {
  prefecture: string;
  city: string;
  overall_rate: number;
  business_rates: Record<string, number>;
};

function getStatus(
  rate: number,
  isTokutei: boolean
): "tokutei" | "complete" | "ontrack" | "atrisk" | "critical" {
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

/* ── metadata ── */

const avgRate = (data.summary.avg_rate * 100).toFixed(1);

export const metadata: Metadata = {
  title: `移行トラッカー｜ガバメントクラウド移行状況（全国${avgRate}%完了）`,
  description: `全国平均完了率${avgRate}%。1,741自治体のガバメントクラウド移行をリアルタイム追跡。`,
  openGraph: {
    title: `移行トラッカー — 全国${avgRate}%完了`,
    description: `1,741自治体のガバメントクラウド移行進捗をモバイル最適化ビューで確認。`,
    images: [
      {
        url: `/og?title=${encodeURIComponent("移行トラッカー")}&subtitle=${encodeURIComponent(`全国平均完了率 ${avgRate}%`)}&rate=${data.summary.avg_rate}`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

/* ── page ── */

export default function TrackerPage() {
  const { summary, prefectures, risk_municipalities } = data;
  const allMunis = (data as { municipalities: StandardMunicipality[] })
    .municipalities;

  const tokuteiSet = new Set<string>(
    (
      tokuteiData.municipalities as { prefecture: string; city: string }[]
    ).map((m) => `${m.prefecture}/${m.city}`)
  );
  const TOKUTEI_COUNT = tokuteiData.total_count as number;
  const TOTAL = summary.total;

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

  const remainingDays = calcRemainingDays(summary.deadline);
  const completionPct = (summary.avg_rate * 100).toFixed(1);
  const completedPct = ((completeCount / TOTAL) * 100).toFixed(1);

  const sortedPrefectures = [...prefectures].sort(
    (a, b) => b.avg_rate - a.avg_rate
  );

  const riskMunis = risk_municipalities.filter(
    (m) => !tokuteiSet.has(`${m.prefecture}/${m.city}`)
  );
  const top5Risk = riskMunis.slice(0, 5);

  const deadlineFormatted = new Date(summary.deadline).toLocaleDateString(
    "ja-JP",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <div className="max-w-md mx-auto space-y-6 sm:max-w-2xl">
      {/* ── Page Header ── */}
      <header className="text-center">
        <h1 className="text-xl font-bold text-gray-800">
          ガバメントクラウド移行状況
        </h1>
      </header>

      {/* ── Alert Banner (Stitch: red bg, white text, rounded-xl) ── */}
      <section>
        <div className="bg-red-600 text-white p-3 rounded-xl shadow-sm text-center">
          <p className="text-sm font-medium">
            移行完了期限まで残り{" "}
            <span className="text-2xl font-bold tabular-nums">
              {remainingDays.toLocaleString()}
            </span>{" "}
            日
          </p>
          <p className="text-xs opacity-90">（{deadlineFormatted}）</p>
        </div>
      </section>

      {/* ── Global Status (Stitch: white card, progress bar) ── */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Global Status
        </h2>
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          {/* Completion Rate with progress bar */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm text-gray-600">完了率</span>
              <span className="text-2xl font-bold text-gray-800 tabular-nums">
                {completionPct}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 tabular-nums">
              {completeCount.toLocaleString()} / {TOTAL.toLocaleString()}
            </p>
          </div>

          {/* Target / Migrated grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">対象団体</p>
              <p className="text-lg font-bold tabular-nums">
                {TOTAL.toLocaleString()}
                <span className="text-xs font-normal ml-1">件</span>
              </p>
              <p className="text-[10px] text-gray-400 tabular-nums">
                (全体の {completedPct}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">遷移自治体</p>
              <p className="text-lg font-bold tabular-nums">
                {completeCount.toLocaleString()}
                <span className="text-xs font-normal ml-1">団体</span>
              </p>
              <p className="text-[10px] text-gray-400 tabular-nums">
                (全体の {completedPct}%)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Filters (Stitch: pill buttons) ── */}
      <section className="flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/businesses", label: "業務別" },
          { href: "/prefectures", label: "都道府県" },
          { href: "/risks", label: "リスク" },
          { href: "/tokutei", label: "特定移行" },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="flex-shrink-0 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-300 transition-colors"
          >
            {label} ▸
          </Link>
        ))}
      </section>

      {/* ── Status Breakdown (Stitch: solid color cards, 2x2 grid) ── */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Status Breakdown
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatusCard
            label="完了"
            count={completeCount}
            bgClass="bg-emerald-500"
            icon="✓"
          />
          <StatusCard
            label="順調"
            count={ontrackCount}
            bgClass="bg-blue-500"
            icon="↑"
          />
          <StatusCard
            label="要注意"
            count={atriskCount}
            bgClass="bg-yellow-500"
            icon="!"
          />
          <StatusCard
            label="危険"
            count={criticalCount}
            bgClass="bg-red-500"
            icon="✕"
          />
        </div>
        {/* Tokutei separate row */}
        <div className="mt-3">
          <div className="bg-violet-500 p-3 rounded-xl text-white flex justify-between items-start shadow-sm">
            <div>
              <p className="text-xs font-bold opacity-90">特定移行認定</p>
              <p className="text-2xl font-bold tabular-nums">{TOKUTEI_COUNT}</p>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center text-xs">
              ★
            </div>
          </div>
        </div>
      </section>

      {/* ── Regional Data (Stitch: progress bars per prefecture) ── */}
      <RegionalDataSection prefectures={sortedPrefectures} />

      {/* ── Critical Risk List (Stitch: red border + red bg section) ── */}
      <section className="border-2 border-red-500 rounded-xl overflow-hidden">
        <div className="bg-white p-4">
          <h2 className="text-sm font-bold text-red-600 mb-3">
            Critical Risk List
          </h2>
          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <h3 className="text-xs font-bold text-gray-800 mb-3">
              遅延リスク自治体 TOP 5（{summary.data_month}）
            </h3>
            <ol className="text-xs space-y-2 text-gray-700">
              {top5Risk.map((m, i) => (
                <li
                  key={`${m.prefecture}-${m.city}`}
                  className="flex justify-between"
                >
                  <span>
                    {i + 1}. {m.prefecture} {m.city}{" "}
                    {((m.overall_rate ?? 0) * 100).toFixed(1)}%
                  </span>
                  <span className="text-red-600 font-bold">（危険）</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-3 text-center">
            <Link
              href="/risks"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              全リスク自治体を見る →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <SourceAttribution sourceIds={PAGE_SOURCES.dashboard} />
    </div>
  );
}

/* ── local components ── */

function StatusCard({
  label,
  count,
  bgClass,
  icon,
}: {
  label: string;
  count: number;
  bgClass: string;
  icon: string;
}) {
  return (
    <div
      className={`${bgClass} p-3 rounded-xl text-white flex justify-between items-start shadow-sm`}
    >
      <div>
        <p className="text-xs font-bold opacity-90">{label}</p>
        <p className="text-2xl font-bold tabular-nums">
          {count.toLocaleString()}
        </p>
      </div>
      <div className="w-6 h-6 rounded-full border-2 border-white/50 flex items-center justify-center text-xs">
        {icon}
      </div>
    </div>
  );
}
