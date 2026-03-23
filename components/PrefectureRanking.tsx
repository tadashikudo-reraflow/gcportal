"use client";

import { useState } from "react";
import Link from "next/link";

type PrefectureData = {
  prefecture: string;
  avg_rate: number;
  count: number;
  completed: number;
  critical: number;
};

type Props = {
  prefectures: PrefectureData[];
  tokuteiByPref: Record<string, number>;
};

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#FA6414";
  return "#b91c1c";
}

function getStatusLabel(rate: number): string {
  if (rate >= 1.0) return "完了";
  if (rate >= 0.8) return "順調";
  if (rate >= 0.5) return "要注意";
  return "危機";
}

function getStatusBadgeStyle(rate: number): { bg: string; text: string } {
  if (rate >= 0.9) return { bg: "#d1fae5", text: "#166534" };
  if (rate >= 0.7) return { bg: "#dbeafe", text: "#1e40af" };
  if (rate >= 0.5) return { bg: "#fff7ed", text: "#c2410c" };
  return { bg: "#fee2e2", text: "#991b1b" };
}

export default function PrefectureRanking({ prefectures, tokuteiByPref }: Props) {
  const [showAll, setShowAll] = useState(false);

  // 完了率の低い順に並べる（昇順）
  const sorted = [...prefectures].sort((a, b) => a.avg_rate - b.avg_rate);
  const displayed = showAll ? sorted : sorted.slice(0, 10);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ backgroundColor: "var(--color-gov-primary)" }}>
              <th className="text-center py-2.5 px-2 text-xs font-medium w-10" style={{ color: "#fff" }}>#</th>
              <th className="text-left py-2.5 px-2 text-xs font-medium" style={{ color: "#fff" }}>都道府県</th>
              <th className="text-left py-2.5 px-2 text-xs font-medium min-w-[100px]" style={{ color: "#fff" }}>完了率</th>
              <th className="text-right py-2.5 px-2 text-xs font-medium" style={{ color: "#fff" }}>自治体</th>
              <th className="text-right py-2.5 px-2 text-xs font-medium" style={{ color: "#fff" }}>完了</th>
              <th className="text-right py-2.5 px-2 text-xs font-medium" style={{ color: "#fff" }}>危機</th>
              <th className="text-right py-2.5 px-2 text-xs font-medium" style={{ color: "#fff" }}>特定移行</th>
              <th className="text-center py-2.5 px-2 text-xs font-medium" style={{ color: "#fff" }}>状態</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((pref, i) => {
              const color = getRateColor(pref.avg_rate);
              const pct = pref.avg_rate * 100;
              const badge = getStatusBadgeStyle(pref.avg_rate);
              const tokutei = tokuteiByPref[pref.prefecture] ?? 0;
              return (
                <tr key={pref.prefecture} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-2 text-center text-xs text-gray-400">{i + 1}</td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Link
                      href={`/prefectures/${encodeURIComponent(pref.prefecture)}`}
                      className="font-medium text-gray-800 hover:underline"
                    >
                      {pref.prefecture}
                    </Link>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden min-w-[60px]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-xs font-bold w-11 flex-shrink-0 tabular-nums" style={{ color }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-right text-xs text-gray-600">{pref.count}</td>
                  <td className="py-2 px-2 text-right text-xs font-medium" style={{ color: "#378445" }}>{pref.completed}</td>
                  <td className="py-2 px-2 text-right text-xs" style={{ color: pref.critical > 0 ? "#b91c1c" : "#9ca3af", fontWeight: pref.critical > 0 ? 700 : 400 }}>
                    {pref.critical}
                  </td>
                  <td className="py-2 px-2 text-right text-xs" style={{ color: tokutei > 0 ? "#7c3aed" : "#9ca3af", fontWeight: tokutei > 0 ? 700 : 400 }}>
                    {tokutei}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {getStatusLabel(pref.avg_rate)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!showAll && sorted.length > 10 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
          style={{ color: "var(--color-gov-primary)", border: "1px solid var(--color-border)" }}
        >
          全 {sorted.length} 都道府県を表示 ▾
        </button>
      )}
      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full mt-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
          style={{ color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}
        >
          上位10件に戻す ▴
        </button>
      )}
    </div>
  );
}
