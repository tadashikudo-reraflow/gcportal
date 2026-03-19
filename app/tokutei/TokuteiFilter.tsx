"use client";

import { useState, useMemo } from "react";

interface TokuteiRow {
  no: number;
  prefecture: string;
  city: string;
  overall_rate: number | null;
}

interface TokuteiFilterProps {
  rows: TokuteiRow[];
  prefectures: string[];
}

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return (rate * 100).toFixed(1) + "%";
}

function getRateColor(rate: number | null): string {
  if (rate === null) return "#9ca3af";
  if (rate >= 0.5) return "#d97706";
  return "#b91c1c";
}

export default function TokuteiFilter({ rows, prefectures }: TokuteiFilterProps) {
  const [selectedPref, setSelectedPref] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (selectedPref && r.prefecture !== selectedPref) return false;
      if (search && !r.city.includes(search) && !r.prefecture.includes(search)) return false;
      return true;
    });
  }, [rows, selectedPref, search]);

  return (
    <div>
      {/* フィルター UI */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={selectedPref}
          onChange={(e) => setSelectedPref(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "#7c3aed" } as React.CSSProperties}
        >
          <option value="">全都道府県</option>
          {prefectures.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="市区町村名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 w-48"
          style={{ "--tw-ring-color": "#7c3aed" } as React.CSSProperties}
        />
        {(selectedPref || search) && (
          <button
            onClick={() => { setSelectedPref(""); setSearch(""); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            クリア
          </button>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length.toLocaleString()} 件表示
        </span>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium w-10">No.</th>
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium">都道府県</th>
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium">市区町村</th>
              <th className="text-right py-2.5 px-2 text-xs text-gray-500 font-medium">完了率（参考）</th>
              <th className="text-left py-2.5 px-2 text-xs text-gray-500 font-medium">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={`${row.prefecture}-${row.city}`}
                className="border-b border-gray-50 hover:bg-purple-50 transition-colors"
              >
                <td className="py-2.5 px-2 text-xs text-gray-400">{row.no}</td>
                <td className="py-2.5 px-2 text-gray-600 text-xs">{row.prefecture}</td>
                <td className="py-2.5 px-2 font-medium text-gray-800">{row.city}</td>
                <td className="py-2.5 px-2 text-right">
                  <span className="font-bold text-sm" style={{ color: getRateColor(row.overall_rate) }}>
                    {formatRate(row.overall_rate)}
                  </span>
                </td>
                <td className="py-2.5 px-2">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: "#f3e8ff", color: "#7c3aed" }}
                  >
                    特定移行
                  </span>
                </td>
              </tr>
            ))}
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
