"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Row = {
  prefecture: string;
  city: string;
  rate: number;
  isTokutei: boolean;
};

function getTextColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#EF4444";
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

function getStatusLabel(rate: number): string {
  if (rate >= 1.0) return "完了";
  if (rate >= 0.75) return "順調";
  if (rate >= 0.5) return "要注意";
  return "危機";
}

function getStatusColor(rate: number): string {
  if (rate >= 1.0) return "#378445";
  if (rate >= 0.75) return "#1D4ED8";
  if (rate >= 0.5) return "#d97706";
  return "#b91c1c";
}

const PAGE_SIZE = 20;

export default function BusinessTable({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter(
      (r) => r.city.includes(q) || r.prefecture.includes(q)
    );
  }, [rows, query]);

  const isFiltering = query.trim().length > 0;
  const displayed = isFiltering ? filtered : filtered.slice(0, PAGE_SIZE);
  const remaining = filtered.length - PAGE_SIZE;

  return (
    <div className="card overflow-hidden">
      {/* 検索バー */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} aria-hidden="true" />
          <input
            type="text"
            placeholder="自治体名・都道府県で検索…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
          />
        </div>
        <p className="text-xs text-gray-400 whitespace-nowrap">
          {isFiltering
            ? `${filtered.length} 件該当`
            : `全 ${rows.length.toLocaleString()} 団体`}
        </p>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200" style={{ backgroundColor: "#f8fafc" }}>
              <th className="text-left px-4 py-2 text-gray-400 font-medium w-10">#</th>
              <th className="text-left px-4 py-2 text-gray-400 font-medium hidden md:table-cell">都道府県</th>
              <th className="text-left px-4 py-2 text-gray-400 font-medium">市区町村</th>
              <th className="text-right px-4 py-2 text-gray-400 font-medium whitespace-nowrap">進捗率</th>
              <th className="text-center px-4 py-2 text-gray-400 font-medium whitespace-nowrap w-16">状態</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                  「{query}」に該当する自治体が見つかりません
                </td>
              </tr>
            ) : (
              displayed.map((row, i) => {
                const rank = isFiltering ? rows.indexOf(row) + 1 : i + 1;
                const href = `/municipalities/${encodeURIComponent(row.prefecture)}/${encodeURIComponent(row.city)}`;
                return (
                  <tr
                    key={`${row.prefecture}-${row.city}`}
                    className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer"
                    style={row.isTokutei ? { backgroundColor: "#f1f5f9" } : undefined}
                    onClick={() => window.location.href = href}
                  >
                    <td className="px-4 py-2 text-gray-400 text-xs">{rank}</td>
                    <td className="px-4 py-2 text-gray-500 hidden md:table-cell">{row.prefecture}</td>
                    <td className="px-4 py-2 text-gray-800 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span>
                          <span className="text-[10px] text-gray-400 md:hidden">{row.prefecture} </span>
                          <Link href={href} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                            {row.city}
                          </Link>
                        </span>
                        {row.isTokutei && (
                          <span
                            className="inline-block px-1 py-0 rounded text-white flex-shrink-0"
                            style={{ backgroundColor: "#64748B", fontSize: 9, fontWeight: 700, lineHeight: "14px" }}
                          >
                            特定移行
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-bold tabular-nums" style={{ color: getTextColor(row.rate) }}>
                      {formatRate(row.rate)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ color: getStatusColor(row.rate), backgroundColor: `${getStatusColor(row.rate)}15` }}
                      >
                        {getStatusLabel(row.rate)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 下部ヒント */}
      {!isFiltering && remaining > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            遅れている順に上位 {PAGE_SIZE} 件を表示。自治体名で検索すると絞り込めます。
          </p>
        </div>
      )}
    </div>
  );
}
