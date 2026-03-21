"use client";

import { useState, useMemo } from "react";
import type { SnapshotPoint, PrefectureTimelinePoint } from "./page";

interface Props {
  snapshots: SnapshotPoint[];
  prefectureTimeline: PrefectureTimelinePoint[];
  prefectureNames: string[];
  isMockData: boolean;
  dataMonth: string;
}

/* ============================================================
   Milestone markers
   ============================================================ */
const MILESTONES: { month: string; label: string; color: string }[] = [
  { month: "2025-03", label: "移行期限", color: "#FA6414" },
  { month: "2026-03", label: "最終期限", color: "#b91c1c" },
];

/* ============================================================
   Helpers
   ============================================================ */
function fmt(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

function shortMonth(m: string): string {
  const [, month] = m.split("-");
  return `${parseInt(month)}月`;
}

function trendArrow(current: number, previous: number): { symbol: string; color: string; diff: string } {
  const diff = current - previous;
  if (diff > 0.001)
    return { symbol: "▲", color: "var(--color-rate-complete, #378445)", diff: `+${(diff * 100).toFixed(1)}pt` };
  if (diff < -0.001)
    return { symbol: "▼", color: "var(--color-rate-critical, #b91c1c)", diff: `${(diff * 100).toFixed(1)}pt` };
  return { symbol: "→", color: "var(--color-muted, #64748b)", diff: "±0" };
}

/* ============================================================
   CSS Line Chart Component
   ============================================================ */
function LineChart({
  points,
  yMin = 0,
  yMax = 1,
  height = 280,
  milestoneMonths,
  label,
}: {
  points: { month: string; value: number }[];
  yMin?: number;
  yMax?: number;
  height?: number;
  milestoneMonths?: typeof MILESTONES;
  label?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (points.length === 0) return null;

  const range = yMax - yMin || 1;
  const paddingLeft = 48;
  const paddingRight = 16;
  const paddingTop = 24;
  const paddingBottom = 40;

  const chartWidth = 100; // percentage
  const innerHeight = height - paddingTop - paddingBottom;

  // Y-axis grid lines
  const ySteps = 5;
  const yLines = Array.from({ length: ySteps + 1 }, (_, i) => {
    const val = yMin + (range * i) / ySteps;
    const y = innerHeight - (innerHeight * i) / ySteps;
    return { val, y };
  });

  // X positions (evenly spaced)
  const xPositions = points.map((_, i) =>
    points.length === 1 ? 50 : (i / (points.length - 1)) * 100
  );

  // Y positions
  const yPositions = points.map(
    (p) => innerHeight - ((p.value - yMin) / range) * innerHeight
  );

  // SVG path for line
  const pathD = points
    .map((_, i) => {
      const x = paddingLeft + (xPositions[i] / 100) * (700 - paddingLeft - paddingRight);
      const y = paddingTop + yPositions[i];
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Find milestone indices
  const milestoneIndices = (milestoneMonths ?? [])
    .map((ms) => ({
      ...ms,
      idx: points.findIndex((p) => p.month === ms.month),
    }))
    .filter((ms) => ms.idx >= 0);

  return (
    <div className="relative w-full" style={{ minHeight: height }}>
      {label && (
        <div className="absolute top-0 left-12 text-xs" style={{ color: "var(--color-muted, #64748b)" }}>
          {label}
        </div>
      )}
      <svg
        viewBox={`0 0 700 ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {/* Y-axis grid */}
        {yLines.map(({ val, y }, i) => (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={paddingTop + y}
              x2={700 - paddingRight}
              y2={paddingTop + y}
              stroke="var(--color-border, #e2e8f0)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4 2"}
            />
            <text
              x={paddingLeft - 6}
              y={paddingTop + y + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-muted, #64748b)"
            >
              {(val * 100).toFixed(0)}%
            </text>
          </g>
        ))}

        {/* Milestone vertical lines */}
        {milestoneIndices.map((ms) => {
          const x = paddingLeft + (xPositions[ms.idx] / 100) * (700 - paddingLeft - paddingRight);
          return (
            <g key={ms.month}>
              <line
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={height - paddingBottom}
                stroke={ms.color}
                strokeWidth="1.5"
                strokeDasharray="6 3"
              />
              <text x={x} y={paddingTop - 6} textAnchor="middle" fontSize="10" fill={ms.color}>
                {ms.label}
              </text>
            </g>
          );
        })}

        {/* Line path */}
        <path d={pathD} fill="none" stroke="var(--color-gov-primary, #1D4ED8)" strokeWidth="2.5" />

        {/* Area fill */}
        <path
          d={`${pathD} L ${paddingLeft + (xPositions[points.length - 1] / 100) * (700 - paddingLeft - paddingRight)} ${height - paddingBottom} L ${paddingLeft + (xPositions[0] / 100) * (700 - paddingLeft - paddingRight)} ${height - paddingBottom} Z`}
          fill="var(--color-gov-primary, #1D4ED8)"
          opacity="0.08"
        />

        {/* Data points */}
        {points.map((p, i) => {
          const x = paddingLeft + (xPositions[i] / 100) * (700 - paddingLeft - paddingRight);
          const y = paddingTop + yPositions[i];
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={hoveredIdx === i ? 6 : 4}
                fill={hoveredIdx === i ? "var(--color-gov-primary, #1D4ED8)" : "#fff"}
                stroke="var(--color-gov-primary, #1D4ED8)"
                strokeWidth="2"
                style={{ cursor: "pointer", transition: "r 0.15s" }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
              {/* X-axis label */}
              <text
                x={x}
                y={height - paddingBottom + 18}
                textAnchor="middle"
                fontSize="10"
                fill="var(--color-muted, #64748b)"
              >
                {shortMonth(p.month)}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {hoveredIdx !== null && (() => {
          const p = points[hoveredIdx];
          const x = paddingLeft + (xPositions[hoveredIdx] / 100) * (700 - paddingLeft - paddingRight);
          const y = paddingTop + yPositions[hoveredIdx];
          const tooltipX = x > 500 ? x - 90 : x + 10;
          return (
            <g>
              <rect
                x={tooltipX}
                y={y - 36}
                width="80"
                height="30"
                rx="4"
                fill="var(--color-gov-dark, #1e293b)"
                opacity="0.92"
              />
              <text x={tooltipX + 40} y={y - 24} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {p.month}
              </text>
              <text x={tooltipX + 40} y={y - 12} textAnchor="middle" fontSize="12" fill="#fff" fontWeight="600">
                {fmt(p.value)}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

/* ============================================================
   Main Component
   ============================================================ */
export default function TimelineClient({
  snapshots,
  prefectureTimeline,
  prefectureNames,
  isMockData,
  dataMonth,
}: Props) {
  const [selectedPref, setSelectedPref] = useState<string>("");

  // KPI calculations
  const current = snapshots[snapshots.length - 1];
  const previous = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null;

  const rateTrend = previous
    ? trendArrow(current.avg_rate, previous.avg_rate)
    : null;
  const completedTrend = previous
    ? {
        diff: current.completed_count - previous.completed_count,
        symbol: current.completed_count >= previous.completed_count ? "▲" : "▼",
        color:
          current.completed_count >= previous.completed_count
            ? "var(--color-rate-complete, #378445)"
            : "var(--color-rate-critical, #b91c1c)",
      }
    : null;
  const criticalTrend = previous
    ? {
        diff: current.critical_count - previous.critical_count,
        symbol: current.critical_count <= previous.critical_count ? "▼" : "▲",
        color:
          current.critical_count <= previous.critical_count
            ? "var(--color-rate-complete, #378445)"
            : "var(--color-rate-critical, #b91c1c)",
      }
    : null;

  // Chart points
  const ratePoints = snapshots.map((s) => ({
    month: s.data_month,
    value: s.avg_rate,
  }));

  const completedPoints = snapshots.map((s) => ({
    month: s.data_month,
    value: s.completed_count,
  }));

  // Prefecture-filtered points
  const prefPoints = useMemo(() => {
    if (!selectedPref) return null;
    return prefectureTimeline
      .filter((p) => p.prefecture === selectedPref)
      .map((p) => ({ month: p.data_month, value: p.avg_rate }));
  }, [selectedPref, prefectureTimeline]);

  // Completed count chart needs different scale
  const maxCompleted = Math.max(...completedPoints.map((p) => p.value), 10);

  return (
    <div className="space-y-6">
      {/* Mock data notice */}
      {isMockData && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            backgroundColor: "var(--color-rate-atrisk-bg, #FFF7ED)",
            border: "1px solid var(--color-rate-atrisk, #FA6414)",
            color: "var(--color-rate-atrisk, #FA6414)",
          }}
        >
          ※ このデータは推定値です。実データは次回のスナップショット保存後に表示されます
        </div>
      )}

      {/* KPI Trend Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Avg Rate */}
        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: "var(--color-muted, #64748b)" }}>
            平均進捗率
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold" style={{ color: "var(--color-gov-primary, #1D4ED8)" }}>
              {fmt(current.avg_rate)}
            </span>
            {rateTrend && (
              <span className="text-sm font-medium" style={{ color: rateTrend.color }}>
                {rateTrend.symbol} {rateTrend.diff}
              </span>
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-muted, #64748b)" }}>
            前月比
          </div>
        </div>

        {/* Completed Count */}
        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: "var(--color-muted, #64748b)" }}>
            完了自治体数
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold" style={{ color: "var(--color-rate-complete, #378445)" }}>
              {current.completed_count}
            </span>
            {completedTrend && (
              <span className="text-sm font-medium" style={{ color: completedTrend.color }}>
                {completedTrend.symbol} {completedTrend.diff > 0 ? "+" : ""}
                {completedTrend.diff}
              </span>
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-muted, #64748b)" }}>
            / {current.municipality_count} 自治体
          </div>
        </div>

        {/* Critical Count */}
        <div className="card p-4">
          <div className="text-xs mb-1" style={{ color: "var(--color-muted, #64748b)" }}>
            危機的自治体数
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold" style={{ color: "var(--color-rate-critical, #b91c1c)" }}>
              {current.critical_count}
            </span>
            {criticalTrend && (
              <span className="text-sm font-medium" style={{ color: criticalTrend.color }}>
                {criticalTrend.symbol} {criticalTrend.diff > 0 ? "+" : ""}
                {criticalTrend.diff}
              </span>
            )}
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--color-muted, #64748b)" }}>
            進捗率 50% 未満
          </div>
        </div>
      </div>

      {/* Main Rate Chart */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-gov-dark, #1e293b)" }}>
          平均進捗率の推移
        </h2>
        <LineChart
          points={ratePoints}
          yMin={0}
          yMax={1}
          height={300}
          milestoneMonths={MILESTONES}
          label="進捗率"
        />
      </div>

      {/* Completed Count Chart */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-gov-dark, #1e293b)" }}>
          完了自治体数の推移
        </h2>
        <LineChart
          points={completedPoints}
          yMin={0}
          yMax={Math.ceil(maxCompleted * 1.2)}
          height={240}
          label="完了数"
        />
      </div>

      {/* Prefecture Filter */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-gov-dark, #1e293b)" }}>
            都道府県別トレンド
          </h2>
          <select
            value={selectedPref}
            onChange={(e) => setSelectedPref(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--color-border, #e2e8f0)",
              backgroundColor: "var(--color-gov-bg, #f8fafc)",
            }}
          >
            <option value="">都道府県を選択</option>
            {prefectureNames.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {prefPoints && prefPoints.length > 0 ? (
          <LineChart
            points={prefPoints}
            yMin={0}
            yMax={1}
            height={260}
            milestoneMonths={MILESTONES}
            label={selectedPref}
          />
        ) : (
          <div
            className="text-center py-12 text-sm"
            style={{ color: "var(--color-muted, #64748b)" }}
          >
            都道府県を選択すると、その地域の進捗推移が表示されます
          </div>
        )}
      </div>

      {/* Milestone Legend */}
      <div className="card p-4">
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-gov-dark, #1e293b)" }}>
          マイルストーン
        </h3>
        <div className="flex flex-wrap gap-4">
          {MILESTONES.map((ms) => (
            <div key={ms.month} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ms.color }}
              />
              <span style={{ color: "var(--color-gov-dark, #1e293b)" }}>
                {ms.month} — {ms.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Data source */}
      <div className="text-xs text-right" style={{ color: "var(--color-muted, #64748b)" }}>
        データ基準月: {dataMonth}
        {isMockData && " (推定)"}
      </div>
    </div>
  );
}
