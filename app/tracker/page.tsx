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
    <div className="max-w-lg mx-auto space-y-6 sm:max-w-3xl">
      {/* ── ページヘッダー ── */}
      <header>
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          ガバメントクラウド移行状況
        </h1>
      </header>

      {/* ── カウントダウンバナー ── */}
      <section>
        <div
          className="p-4 rounded-xl shadow-sm text-center"
          style={{ backgroundColor: "var(--color-error)" }}
        >
          <p className="text-sm font-medium text-white">
            移行完了期限まで残り{" "}
            <span className="text-2xl font-bold tabular-nums">
              {remainingDays.toLocaleString()}
            </span>{" "}
            日
          </p>
          <p className="text-xs text-white/80">（{deadlineFormatted}）</p>
        </div>
      </section>

      {/* ── 全体ステータス ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-secondary)" }}>
          全体ステータス
        </h2>
        <div className="card p-4 space-y-4">
          {/* 完了率 + プログレスバー */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>完了率</span>
              <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                {completionPct}%
              </span>
            </div>
            <div
              className="w-full rounded-full h-2.5"
              style={{ backgroundColor: "var(--color-border)" }}
              role="progressbar"
              aria-valuenow={parseFloat(completionPct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`完了率 ${completionPct}%`}
            >
              <div
                className="h-2.5 rounded-full"
                style={{
                  width: `${completionPct}%`,
                  backgroundColor: "var(--color-brand-primary)",
                }}
              />
            </div>
            <p className="text-xs mt-1 tabular-nums" style={{ color: "var(--color-text-muted)" }}>
              {completeCount.toLocaleString()} / {TOTAL.toLocaleString()}
            </p>
          </div>

          {/* 対象 / 遷移 グリッド */}
          <div className="grid grid-cols-2 gap-4 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>対象団体</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                {TOTAL.toLocaleString()}
                <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-secondary)" }}>件</span>
              </p>
              <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                (全体の {completedPct}%)
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>遷移自治体</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                {completeCount.toLocaleString()}
                <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-secondary)" }}>団体</span>
              </p>
              <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                (全体の {completedPct}%)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── クイックフィルター ── */}
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
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            {label} ▸
          </Link>
        ))}
      </section>

      {/* ── ステータス内訳 ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-secondary)" }}>
          ステータス内訳
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatusCard
            label="完了"
            count={completeCount}
            color="var(--color-status-complete)"
          />
          <StatusCard
            label="順調"
            count={ontrackCount}
            color="var(--color-status-ok)"
          />
          <StatusCard
            label="要注意"
            count={atriskCount}
            color="var(--color-status-warn)"
            darkText
          />
          <StatusCard
            label="危険"
            count={criticalCount}
            color="var(--color-status-critical)"
          />
        </div>
        {/* 特定移行認定 — フル幅 */}
        <div className="mt-3">
          <StatusCard
            label="特定移行認定"
            count={TOKUTEI_COUNT}
            color="var(--color-status-tokutei)"
          />
        </div>
      </section>

      {/* ── 都道府県別データ ── */}
      <RegionalDataSection prefectures={sortedPrefectures} />

      {/* ── 遅延リスク一覧 ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-secondary)" }}>
          遅延リスク
        </h2>
        <div
          className="card p-4 rounded-xl"
          style={{ border: "2px solid var(--color-status-critical)" }}
        >
          <p className="text-sm font-bold mb-3" style={{ color: "var(--color-status-critical)" }}>
            遅延リスク自治体 TOP 5（{summary.data_month}）
          </p>
          <ol className="text-sm space-y-2" style={{ color: "var(--color-text-primary)" }}>
            {top5Risk.map((m, i) => (
              <li
                key={`${m.prefecture}-${m.city}`}
                className="flex justify-between"
              >
                <span className="tabular-nums">
                  {i + 1}. {m.prefecture} {m.city}{" "}
                  {((m.overall_rate ?? 0) * 100).toFixed(1)}%
                </span>
                <span className="font-bold" style={{ color: "var(--color-status-critical)" }}>
                  （危険）
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
            <Link
              href="/risks"
              className="text-sm font-medium hover:underline"
              style={{ color: "var(--color-brand-primary)" }}
            >
              全リスク自治体を見る →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 出典 ── */}
      <SourceAttribution sourceIds={PAGE_SOURCES.dashboard} />
    </div>
  );
}

/* ── local components ── */

function StatusCard({
  label,
  count,
  color,
  darkText = false,
}: {
  label: string;
  count: number;
  color: string;
  darkText?: boolean;
}) {
  return (
    <div
      className="p-3 rounded-xl shadow-sm flex justify-between items-start"
      style={{ backgroundColor: color }}
    >
      <div>
        <p
          className="text-xs font-bold"
          style={{ color: darkText ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)" }}
        >
          {label}
        </p>
        <p
          className="text-2xl font-bold tabular-nums"
          style={{ color: darkText ? "rgba(0,0,0,0.9)" : "#fff" }}
        >
          {count.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
