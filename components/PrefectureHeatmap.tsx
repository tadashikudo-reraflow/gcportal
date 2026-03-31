"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PrefectureData = {
  prefecture: string;
  avg_rate: number;
  count: number;
  completed: number;
  critical: number;
};

type PrefectureHeatmapProps = {
  prefectures: PrefectureData[];
};

function getHeatColor(rate: number): string {
  if (rate >= 0.8) return "#10B981";  // green
  if (rate >= 0.6) return "#F5B500";  // yellow
  if (rate >= 0.4) return "#FA6414";  // orange
  return "#FF6B6B";                    // red
}

function getHeatBg(rate: number): string {
  if (rate >= 0.8) return "#ecfdf5";
  if (rate >= 0.6) return "#fefce8";
  if (rate >= 0.4) return "#fff7ed";
  return "#fef2f2";
}

function getHeatTextColor(rate: number): string {
  if (rate >= 0.8) return "#065f46";
  if (rate >= 0.6) return "#713f12";
  if (rate >= 0.4) return "#9a3412";
  return "#991b1b";
}

export default function PrefectureHeatmap({ prefectures }: PrefectureHeatmapProps) {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);
  const router = useRouter();

  // Sort by count descending for treemap-like layout (larger areas first)
  const sorted = [...prefectures].sort((a, b) => b.count - a.count);
  const totalCount = sorted.reduce((sum, p) => sum + p.count, 0);

  const handleClick = (prefecture: string) => {
    router.push(`/progress?pref=${encodeURIComponent(prefecture)}`);
  };

  return (
    <div className="card p-6">
      <h2
        className="text-sm font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="w-1 h-5 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: "var(--color-brand-primary)" }}
        />
        都道府県ヒートマップ
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        面積は自治体数に比例、色は手続き進捗率を示します。クリックで都道府県詳細へ。
      </p>

      {/* Treemap-style grid */}
      <div
        className="flex flex-wrap gap-1"
        style={{ minHeight: 300 }}
      >
        {sorted.map((pref) => {
          const areaPercent = (pref.count / totalCount) * 100;
          // Minimum 3.5% width to keep readability, scale area
          const width = Math.max(3.5, areaPercent * 1.8);
          const isHovered = hoveredPref === pref.prefecture;
          const color = getHeatColor(pref.avg_rate);
          const bg = getHeatBg(pref.avg_rate);
          const textColor = getHeatTextColor(pref.avg_rate);

          return (
            <button
              key={pref.prefecture}
              onClick={() => handleClick(pref.prefecture)}
              onMouseEnter={() => setHoveredPref(pref.prefecture)}
              onMouseLeave={() => setHoveredPref(null)}
              className="relative rounded-lg transition-all duration-150 text-left cursor-pointer"
              style={{
                width: `calc(${width}% - 4px)`,
                minWidth: 64,
                minHeight: 56,
                flexGrow: pref.count > 50 ? 2 : 1,
                backgroundColor: bg,
                borderLeft: `3px solid ${color}`,
                padding: "6px 8px",
                boxShadow: isHovered
                  ? `0 4px 12px rgba(0,0,0,0.15)`
                  : "0 1px 2px rgba(0,0,0,0.04)",
                transform: isHovered ? "scale(1.03)" : "scale(1)",
                zIndex: isHovered ? 10 : 1,
                border: `1px solid ${isHovered ? color : "transparent"}`,
                borderLeftWidth: "3px",
                borderLeftColor: color,
              }}
              title={`${pref.prefecture}: 手続き進捗率 ${(pref.avg_rate * 100).toFixed(1)}% / ${pref.count}自治体`}
            >
              <p
                className="text-xs font-bold leading-tight truncate"
                style={{ color: textColor }}
              >
                {pref.prefecture}
              </p>
              <p
                className="tabular-nums font-black leading-none mt-1"
                style={{ fontSize: 16, color: textColor }}
              >
                {(pref.avg_rate * 100).toFixed(1)}%
              </p>
              <p
                className="text-xs mt-0.5 leading-tight"
                style={{ color: textColor, opacity: 0.7 }}
              >
                {pref.count}自治体
              </p>

              {/* Hover tooltip */}
              {isHovered && (
                <div
                  className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-50"
                  style={{
                    backgroundColor: "#1e293b",
                    color: "#f1f5f9",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  <p className="font-bold">{pref.prefecture}</p>
                  <p>手続き進捗率: <span className="font-black">{(pref.avg_rate * 100).toFixed(1)}%</span></p>
                  <p>自治体数: {pref.count} / 完了: {pref.completed} / 危機: {pref.critical}</p>
                  <div
                    className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0"
                    style={{
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: "6px solid #1e293b",
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">手続き進捗率:</span>
        {[
          { label: "80%以上", color: "#10B981", bg: "#ecfdf5" },
          { label: "60-80%", color: "#F5B500", bg: "#fefce8" },
          { label: "40-60%", color: "#FA6414", bg: "#fff7ed" },
          { label: "40%未満", color: "#FF6B6B", bg: "#fef2f2" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-4 h-3 rounded-sm inline-block"
              style={{ backgroundColor: item.bg, borderLeft: `2px solid ${item.color}` }}
            />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
