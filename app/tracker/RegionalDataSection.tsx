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
      <h2
        className="text-xs font-bold uppercase tracking-wider mb-3"
        style={{ color: "var(--color-text-secondary)" }}
      >
        都道府県別データ
      </h2>
      <div className="card overflow-hidden">
        {visible.map((p, i) => {
          const pct = (p.avg_rate * 100).toFixed(1);
          return (
            <div
              key={p.prefecture}
              className="p-3 flex flex-col gap-1"
              style={
                i < visible.length - 1 || remaining > 0
                  ? { borderBottom: "1px solid var(--color-border)" }
                  : undefined
              }
            >
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {p.prefecture}
                </span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: getRateColor(p.avg_rate) }}
                >
                  {pct}%
                </span>
              </div>
              <div
                className="w-full rounded-full h-1.5"
                style={{ backgroundColor: "var(--color-border)" }}
                role="progressbar"
                aria-valuenow={parseFloat(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${p.prefecture} ${pct}%`}
              >
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
            aria-expanded={expanded}
            className="w-full px-3 py-3 text-sm font-medium flex justify-between items-center cursor-pointer"
            style={{ color: "var(--color-brand-primary)" }}
          >
            {expanded
              ? "折りたたむ"
              : `その他 ${remaining} 都道府県を表示`}
            <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
          </button>
        )}
      </div>
    </section>
  );
}

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "var(--color-status-complete)";
  if (rate >= 0.7) return "var(--color-status-ok)";
  if (rate >= 0.5) return "var(--color-status-warn)";
  return "var(--color-status-critical)";
}
