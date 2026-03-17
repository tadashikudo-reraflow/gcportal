"use client";

import { useState, useMemo } from "react";

interface MunicipalityRow {
  rank: number;
  prefecture: string;
  city: string;
  overall_rate: number;
  worst_business: string;
  worst_rate: number;
}

interface RiskFilterProps {
  rows: MunicipalityRow[];
  prefectures: string[];
}

function getRateTextColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#c8102e";
}

function getStatusBadge(rate: number): { label: string; className: string } {
  if (rate >= 1.0) return { label: "完了", className: "bg-green-100 text-green-800" };
  if (rate >= 0.8) return { label: "順調", className: "bg-blue-100 text-blue-800" };
  if (rate >= 0.5) return { label: "要注意", className: "bg-yellow-100 text-yellow-800" };
  return { label: "危機", className: "bg-red-100 text-red-800" };
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

export default function RiskFilter({ rows, prefectures }: RiskFilterProps) {
  const [selectedPref, setSelectedPref] = useState<string>("");

  const filtered = useMemo(() => {
    if (!selectedPref) return rows;
    return rows.filter((r) => r.prefecture === selectedPref);
  }, [rows, selectedPref]);

  return (
    <div>
      {/* フィルター UI */}
      <div className="flex items-center gap-3 mb-4">
        <label
          htmlFor="pref-filter"
          className="text-sm font-medium text-gray-700 whitespace-nowrap"
        >
          都道府県で絞り込み:
        </label>
        <select
          id="pref-filter"
          value={selectedPref}
          onChange={(e) => setSelectedPref(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全都道府県</option>
          {prefectures.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {selectedPref && (
          <button
            onClick={() => setSelectedPref("")}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            クリア
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} 件表示
        </span>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium w-10">
                順位
              </th>
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium">
                都道府県
              </th>
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium">
                市区町村
              </th>
              <th className="text-right py-2.5 px-2 text-xs text-gray-500 font-medium">
                完了率
              </th>
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium">
                最も遅れている業務
              </th>
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium">
                ステータス
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const badge = getStatusBadge(row.overall_rate);
              return (
                <tr
                  key={`${row.prefecture}-${row.city}`}
                  className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                >
                  <td className="py-2.5 px-2 text-xs text-gray-400">
                    {row.rank}
                  </td>
                  <td className="py-2.5 px-2 text-gray-600 text-xs">
                    {row.prefecture}
                  </td>
                  <td className="py-2.5 px-2 font-medium text-gray-800">
                    {row.city}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span
                      className="font-bold"
                      style={{ color: getRateTextColor(row.overall_rate) }}
                    >
                      {formatRate(row.overall_rate)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="text-gray-700 text-xs">
                      {row.worst_business}
                    </span>
                    <span
                      className="text-xs ml-1"
                      style={{ color: getRateTextColor(row.worst_rate) }}
                    >
                      ({formatRate(row.worst_rate)})
                    </span>
                  </td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">
          該当する自治体がありません
        </p>
      )}
    </div>
  );
}
