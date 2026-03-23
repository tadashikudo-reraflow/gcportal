"use client";

import { useState, useMemo } from "react";
import FilterBar, { FilterValues } from "@/components/FilterBar";
import { REGIONS, STATUS_OPTIONS, POPULATION_BANDS } from "@/lib/regions";

interface MunicipalityRow {
  rank: number;
  prefecture: string;
  city: string;
  overall_rate: number;
  worst_business: string;
  worst_rate: number;
  population?: number;
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

function getStatusBadge(rate: number): { label: string; className: string; key: string } {
  if (rate >= 1.0) return { label: "完了", className: "bg-green-100 text-green-800", key: "completed" };
  if (rate >= 0.8) return { label: "順調", className: "bg-blue-100 text-blue-800", key: "on_track" };
  if (rate >= 0.5) return { label: "要注意", className: "bg-yellow-100 text-yellow-800", key: "warning" };
  return { label: "危機", className: "bg-red-100 text-red-800", key: "critical" };
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

/** 都道府県から地域を逆引き */
function prefToRegion(pref: string): string | undefined {
  for (const [region, prefs] of Object.entries(REGIONS)) {
    if (prefs.includes(pref)) return region;
  }
  return undefined;
}

export default function RiskFilter({ rows, prefectures: _prefectures }: RiskFilterProps) {
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const filtered = useMemo(() => {
    let result = rows;

    // 地域フィルター
    if (filterValues.region) {
      const regionPrefs = REGIONS[filterValues.region];
      if (regionPrefs) {
        result = result.filter((r) => regionPrefs.includes(r.prefecture));
      }
    }

    // ステータスフィルター
    if (filterValues.status) {
      const statusKey = filterValues.status;
      result = result.filter((r) => {
        const badge = getStatusBadge(r.overall_rate);
        return badge.key === statusKey;
      });
    }

    // 人口帯フィルター（人口データがある場合のみ）
    if (filterValues.population) {
      const band = POPULATION_BANDS.find((b) => b.key === filterValues.population);
      if (band && rows.some((r) => r.population != null)) {
        result = result.filter((r) => {
          if (r.population == null) return true;
          return r.population >= band.min && r.population <= band.max;
        });
      }
    }

    return result;
  }, [rows, filterValues]);

  return (
    <div>
      <FilterBar
        filters={{ population: false, region: true, status: true }}
        values={filterValues}
        onChange={setFilterValues}
      />

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          {filtered.length} 件表示{filtered.length !== rows.length ? ` / ${rows.length}件中` : ""}
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
                地域
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
              const region = prefToRegion(row.prefecture);
              return (
                <tr
                  key={`${row.prefecture}-${row.city}`}
                  className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                >
                  <td className="py-2.5 px-2 text-xs text-gray-400">
                    {row.rank}
                  </td>
                  <td className="py-2.5 px-2 text-gray-600 text-xs whitespace-nowrap">
                    {row.prefecture}
                  </td>
                  <td className="py-2.5 px-2 text-gray-400 text-xs whitespace-nowrap">
                    {region ?? ""}
                  </td>
                  <td className="py-2.5 px-2 font-medium text-gray-800 truncate max-w-[120px]">
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
