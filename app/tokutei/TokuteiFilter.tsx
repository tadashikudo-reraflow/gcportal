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

function getRateBgColor(rate: number | null): string {
  if (rate === null) return "#f3f4f6";
  if (rate >= 0.5) return "#fef3c7";
  return "#fef2f2";
}

interface PrefGroup {
  prefecture: string;
  rows: TokuteiRow[];
  avgRate: number | null;
}

export default function TokuteiFilter({ rows, prefectures }: TokuteiFilterProps) {
  const [selectedPref, setSelectedPref] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [expandedPrefs, setExpandedPrefs] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (selectedPref && r.prefecture !== selectedPref) return false;
      if (search && !r.city.includes(search) && !r.prefecture.includes(search)) return false;
      return true;
    });
  }, [rows, selectedPref, search]);

  // 都道府県別にグループ化
  const groups: PrefGroup[] = useMemo(() => {
    const map = new Map<string, TokuteiRow[]>();
    for (const r of filtered) {
      const arr = map.get(r.prefecture) ?? [];
      arr.push(r);
      map.set(r.prefecture, arr);
    }
    // prefectures の順序を維持
    return prefectures
      .filter((p) => map.has(p))
      .map((p) => {
        const prefRows = map.get(p)!;
        const withRate = prefRows.filter((r) => r.overall_rate !== null);
        const avgRate = withRate.length > 0
          ? withRate.reduce((s, r) => s + (r.overall_rate ?? 0), 0) / withRate.length
          : null;
        return { prefecture: p, rows: prefRows, avgRate };
      });
  }, [filtered, prefectures]);

  const togglePref = (pref: string) => {
    setExpandedPrefs((prev) => {
      const next = new Set(prev);
      if (next.has(pref)) {
        next.delete(pref);
      } else {
        next.add(pref);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPrefs(new Set(groups.map((g) => g.prefecture)));
  };

  const collapseAll = () => {
    setExpandedPrefs(new Set());
  };

  return (
    <div>
      {/* フィルター UI */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={selectedPref}
          onChange={(e) => setSelectedPref(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2"
          style={{ "--tw-ring-color": "#475569" } as React.CSSProperties}
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
          style={{ "--tw-ring-color": "#475569" } as React.CSSProperties}
        />
        {(selectedPref || search) && (
          <button
            onClick={() => { setSelectedPref(""); setSearch(""); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            クリア
          </button>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={expandAll}
            className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            すべて展開
          </button>
          <button
            onClick={collapseAll}
            className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            すべて閉じる
          </button>
          <span className="text-xs text-gray-400">
            {filtered.length.toLocaleString()} 件 / {groups.length} 都道府県
          </span>
        </div>
      </div>

      {/* 都道府県別アコーディオン */}
      <div className="space-y-1">
        {groups.map((group) => {
          const isExpanded = expandedPrefs.has(group.prefecture);
          return (
            <div key={group.prefecture} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* 都道府県ヘッダー（クリックで展開/折りたたみ） */}
              <button
                onClick={() => togglePref(group.prefecture)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                style={{ backgroundColor: isExpanded ? "#f8fafc" : "#fafafa" }}
              >
                <div className="flex items-center gap-3">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="flex-shrink-0 transition-transform duration-200"
                    style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    <path d="M4 2L8 6L4 10" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm font-bold" style={{ color: "#002D72" }}>
                    {group.prefecture}
                  </span>
                  <span
                    className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full text-xs font-bold"
                    style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                  >
                    {group.rows.length}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-500">
                    {group.rows.length}自治体
                  </span>
                  <span style={{ color: getRateColor(group.avgRate) }}>
                    平均 手続き進捗率: <span className="font-bold">{formatRate(group.avgRate)}</span>
                  </span>
                </div>
              </button>

              {/* 展開時の自治体リスト */}
              {isExpanded && (
                <div className="border-t border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#f9fafb" }}>
                        <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium w-10">No.</th>
                        <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">市区町村</th>
                        <th className="text-right py-2 px-4 text-xs text-gray-500 font-medium">進捗率（参考）</th>
                        <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">ステータス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row) => (
                        <tr
                          key={`${row.prefecture}-${row.city}`}
                          className="border-b border-gray-50 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-2 px-4 text-xs text-gray-400">{row.no}</td>
                          <td className="py-2 px-4 font-medium text-gray-800 truncate max-w-[160px]">{row.city}</td>
                          <td className="py-2 px-4 text-right">
                            <span
                              className="inline-block px-2 py-0.5 rounded text-xs font-bold"
                              style={{
                                color: getRateColor(row.overall_rate),
                                backgroundColor: getRateBgColor(row.overall_rate),
                              }}
                            >
                              {formatRate(row.overall_rate)}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                            >
                              特定移行
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="py-16 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" className="mx-auto mb-3" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>該当する自治体がありません</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>フィルター条件を変更してください</p>
        </div>
      )}
    </div>
  );
}
