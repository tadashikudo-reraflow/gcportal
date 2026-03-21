"use client";

import { useState } from "react";
import type { PrefectureSummary } from "@/lib/types";

export default function RegionalDataSection({
  prefectures,
}: {
  prefectures: PrefectureSummary[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? prefectures : prefectures.slice(0, 4);
  const remaining = prefectures.length - 4;

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
        Regional Data
      </h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {visible.map((p, i) => {
          const pct = (p.avg_rate * 100).toFixed(1);
          return (
            <div
              key={p.prefecture}
              className={`p-3 flex flex-col gap-1 ${
                i < visible.length - 1 || remaining > 0
                  ? "border-b border-gray-50"
                  : ""
              }`}
            >
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{p.prefecture}</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: getRateColor(p.avg_rate) }}
                >
                  {pct}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getRateColor(p.avg_rate),
                  }}
                />
              </div>
            </div>
          );
        })}

        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="w-full p-3 text-xs text-gray-500 font-medium flex justify-between items-center hover:bg-gray-50 cursor-pointer"
          >
            {expanded
              ? "折りたたむ ▲"
              : `Other Regions (${remaining} Prefectures)`}
            {!expanded && <span>▼</span>}
          </button>
        )}
      </div>
    </section>
  );
}

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#10B981";
  if (rate >= 0.7) return "#3B82F6";
  if (rate >= 0.5) return "#F5B500";
  return "#EF4444";
}
