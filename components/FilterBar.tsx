"use client";

import { useState, useCallback, useEffect } from "react";
import { REGIONS, POPULATION_BANDS, STATUS_OPTIONS } from "@/lib/regions";

/** /api/vendors レスポンスの型 */
type VendorOption = { id: number; name: string; short_name: string | null };

export type FilterConfig = {
  population?: boolean;
  region?: boolean;
  business?: boolean;
  vendor?: boolean;
  status?: boolean;
};

export type FilterValues = {
  population?: string;
  region?: string;
  business?: string;
  vendor?: string;
  status?: string;
};

type FilterBarProps = {
  filters: FilterConfig;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  /** 業務種別の選択肢（business filter有効時に渡す） */
  businessOptions?: string[];
};

export default function FilterBar({ filters, values, onChange, businessOptions }: FilterBarProps) {
  const [collapsed, setCollapsed] = useState(true);

  // ベンダー選択肢: vendor フィルタが有効な場合のみ /api/vendors から動的取得
  const [vendorOptions, setVendorOptions] = useState<VendorOption[]>([]);
  useEffect(() => {
    if (!filters.vendor) return;
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((json: { vendors?: VendorOption[] }) => {
        if (Array.isArray(json.vendors)) {
          setVendorOptions(json.vendors);
        }
      })
      .catch(() => {
        // フェッチ失敗時は空のまま（全ベンダー表示）
      });
  }, [filters.vendor]);

  // URL同期: 初回マウント時にURLパラメータから値を読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const initial: FilterValues = {};
    let changed = false;
    if (filters.population && params.get("population")) {
      initial.population = params.get("population")!;
      changed = true;
    }
    if (filters.region && params.get("region")) {
      initial.region = params.get("region")!;
      changed = true;
    }
    if (filters.business && params.get("business")) {
      initial.business = params.get("business")!;
      changed = true;
    }
    if (filters.vendor && params.get("vendor")) {
      initial.vendor = params.get("vendor")!;
      changed = true;
    }
    if (filters.status && params.get("status")) {
      initial.status = params.get("status")!;
      changed = true;
    }
    if (changed) {
      onChange({ ...values, ...initial });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL同期: 値変更時にURLパラメータを更新
  const syncUrl = useCallback((newValues: FilterValues) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(newValues)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, []);

  const handleChange = useCallback(
    (key: keyof FilterValues, value: string) => {
      const next = { ...values, [key]: value || undefined };
      onChange(next);
      syncUrl(next);
    },
    [values, onChange, syncUrl]
  );

  const handleClear = useCallback(() => {
    const empty: FilterValues = {};
    onChange(empty);
    syncUrl(empty);
  }, [onChange, syncUrl]);

  const hasActiveFilter = Object.values(values).some((v) => v);
  const activeCount = Object.values(values).filter((v) => v).length;
  const regionNames = Object.keys(REGIONS);

  const selectClass =
    "text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]";

  const filterContent = (
    <div className="flex flex-wrap items-center gap-3">
      {filters.population && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">人口帯</label>
          <select
            value={values.population ?? ""}
            onChange={(e) => handleChange("population", e.target.value)}
            className={selectClass}
          >
            <option value="">全て</option>
            {POPULATION_BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {filters.region && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">地域</label>
          <select
            value={values.region ?? ""}
            onChange={(e) => handleChange("region", e.target.value)}
            className={selectClass}
          >
            <option value="">全地域</option>
            {regionNames.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      )}

      {filters.business && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">業務種別</label>
          <select
            value={values.business ?? ""}
            onChange={(e) => handleChange("business", e.target.value)}
            className={selectClass}
          >
            <option value="">全業務</option>
            {(businessOptions ?? []).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      {filters.vendor && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">ベンダー</label>
          <select
            value={values.vendor ?? ""}
            onChange={(e) => handleChange("vendor", e.target.value)}
            className={selectClass}
          >
            <option value="">全ベンダー</option>
            {vendorOptions.map((v) => {
              const label = v.short_name ?? v.name;
              return (
                <option key={v.id} value={String(v.id)}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {filters.status && (
        <div className="flex items-center gap-1.5">
          <label className="text-xs font-medium text-gray-500 whitespace-nowrap">ステータス</label>
          <select
            value={values.status ?? ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className={selectClass}
          >
            <option value="">全て</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasActiveFilter && (
        <button
          onClick={handleClear}
          className="text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap"
        >
          クリア
        </button>
      )}
    </div>
  );

  return (
    <div className="mb-4">
      {/* モバイル: 折りたたみ */}
      <div className="sm:hidden">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="flex-shrink-0"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
          フィルター
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
              {activeCount}
            </span>
          )}
          <span className="text-gray-400 text-xs">{collapsed ? "+" : "-"}</span>
        </button>
        {!collapsed && filterContent}
      </div>

      {/* デスクトップ: 常時表示 */}
      <div className="hidden sm:block">{filterContent}</div>
    </div>
  );
}
