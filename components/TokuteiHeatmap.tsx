"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TokuteiHeatmapProps = {
  data: { prefecture: string; count: number }[];
};

function getCountColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio >= 0.8) return "#b91c1c";   // deep red
  if (ratio >= 0.6) return "#dc2626";   // red
  if (ratio >= 0.4) return "#f97316";   // orange
  if (ratio >= 0.2) return "#fbbf24";   // amber
  return "#6ee7b7";                      // light green
}

function getCountBg(count: number, max: number): string {
  const ratio = count / max;
  if (ratio >= 0.8) return "#fef2f2";
  if (ratio >= 0.6) return "#fff1f2";
  if (ratio >= 0.4) return "#fff7ed";
  if (ratio >= 0.2) return "#fffbeb";
  return "#ecfdf5";
}

function getCountTextColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio >= 0.6) return "#991b1b";
  if (ratio >= 0.4) return "#9a3412";
  if (ratio >= 0.2) return "#92400e";
  return "#065f46";
}

export default function TokuteiHeatmap({ data }: TokuteiHeatmapProps) {
  const [hoveredPref, setHoveredPref] = useState<string | null>(null);
  const router = useRouter();

  // JISコード順（propsの順序を維持）
  const totalCount = data.reduce((sum, p) => sum + p.count, 0);
  const maxCount = Math.max(...data.map((p) => p.count), 1);

  return (
    <div className="card p-5">
      <h2
        className="text-sm font-bold mb-2 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="w-1 h-5 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: "var(--color-brand-primary)" }}
        />
        都道府県別 認定自治体数
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        面積は認定団体数に比例、色は団体数の多さを示します。クリックで都道府県詳細へ。
      </p>

      <div className="flex flex-wrap gap-1" style={{ minHeight: 280 }}>
        {data.map((pref) => {
          const areaPercent = (pref.count / totalCount) * 100;
          const width = Math.max(3.5, areaPercent * 1.8);
          const isHovered = hoveredPref === pref.prefecture;
          const color = getCountColor(pref.count, maxCount);
          const bg = getCountBg(pref.count, maxCount);
          const textColor = getCountTextColor(pref.count, maxCount);

          return (
            <button
              key={pref.prefecture}
              onClick={() => router.push(`/progress?pref=${encodeURIComponent(pref.prefecture)}`)}
              onMouseEnter={() => setHoveredPref(pref.prefecture)}
              onMouseLeave={() => setHoveredPref(null)}
              className="relative rounded-lg transition-all duration-150 text-left cursor-pointer"
              style={{
                width: `calc(${width}% - 4px)`,
                minWidth: 64,
                minHeight: 56,
                flexGrow: pref.count > 30 ? 2 : 1,
                backgroundColor: bg,
                padding: "6px 8px",
                boxShadow: isHovered
                  ? "0 4px 12px rgba(0,0,0,0.15)"
                  : "0 1px 2px rgba(0,0,0,0.04)",
                transform: isHovered ? "scale(1.03)" : "scale(1)",
                zIndex: isHovered ? 10 : 1,
                borderTop: `1px solid ${isHovered ? color : "transparent"}`,
                borderRight: `1px solid ${isHovered ? color : "transparent"}`,
                borderBottom: `1px solid ${isHovered ? color : "transparent"}`,
                borderLeft: `3px solid ${color}`,
              }}
              title={`${pref.prefecture}: ${pref.count}団体`}
            >
              <p className="text-xs font-bold leading-tight truncate" style={{ color: textColor }}>
                {pref.prefecture}
              </p>
              <p
                className="tabular-nums font-black leading-none mt-1"
                style={{ fontSize: 18, color: textColor }}
              >
                {pref.count}
              </p>

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
                  <p>認定自治体数: <span className="font-black">{pref.count}</span></p>
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
        <span className="text-xs text-gray-500">認定団体数:</span>
        {[
          { label: "多い", color: "#b91c1c", bg: "#fef2f2" },
          { label: "やや多い", color: "#f97316", bg: "#fff7ed" },
          { label: "中程度", color: "#fbbf24", bg: "#fffbeb" },
          { label: "少ない", color: "#6ee7b7", bg: "#ecfdf5" },
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
