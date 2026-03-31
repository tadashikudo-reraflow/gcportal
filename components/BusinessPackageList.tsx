"use client";

import { useState, useMemo } from "react";
import type { Vendor, Package } from "@/lib/supabase";
import { DATA_SOURCES } from "@/lib/sources";

const TEKIGO_LAST_ACCESSED = DATA_SOURCES["applic-tekigo-excel"]?.lastAccessed ?? "";

function getCloudBadgeStyle(
  platform: string | null,
  confirmed: boolean
): { bg: string; text: string } | null {
  const base: Record<string, { bg: string; text: string }> = {
    AWS:    { bg: "#ff9900", text: "#fff" },
    GCP:    { bg: "#1a73e8", text: "#fff" },
    Azure:  { bg: "#00b4ff", text: "#fff" },
    OCI:    { bg: "#b91c1c", text: "#fff" },
    Sakura: { bg: "#be185d", text: "#fff" },
  };
  if (!platform || !base[platform]) return null;
  const style = base[platform];
  if (!confirmed) return { bg: style.bg + "99", text: "#fff" };
  return style;
}

function displayValue(val: string | null | undefined): string {
  if (!val) return "調査中";
  const trimmed = val.trim();
  if (trimmed === "ー" || trimmed === "—" || trimmed === "-" || trimmed === "") return "調査中";
  return trimmed;
}

function displayConfirmedDate(date: string | null | undefined): string {
  if (!date || displayValue(date) === "調査中") {
    return TEKIGO_LAST_ACCESSED || "調査中";
  }
  return date;
}

type PackageWithVendor = Package & { vendors?: Vendor };

export default function BusinessPackageList({
  packages,
}: {
  packages: PackageWithVendor[];
}) {
  const [query, setQuery] = useState("");

  // 業務一覧（件数付き）
  const businesses = useMemo(() => {
    const map = new Map<string, number>();
    for (const pkg of packages) {
      const biz = pkg.business ?? "不明";
      map.set(biz, (map.get(biz) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "ja"))
      .map(([name, count]) => ({ name, count }));
  }, [packages]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return packages.filter((pkg) => {
      const name = (pkg.package_name ?? "").toLowerCase();
      const biz = (pkg.business ?? "").toLowerCase();
      const vendor = (pkg.vendors?.short_name ?? pkg.vendors?.name ?? "").toLowerCase();
      return name.includes(q) || biz.includes(q) || vendor.includes(q);
    });
  }, [query, packages]);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="card p-6">
      <h2
        className="text-sm font-bold mb-1 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="w-1 h-5 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: "var(--color-gov-primary)" }}
        />
        業務別パッケージ一覧
        <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
          {businesses.length}業務 / 計{packages.length}件
        </span>
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        業務名をクリックするか、キーワードで検索
      </p>

      {/* 業務チップ一覧 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {businesses.map(({ name, count }) => {
          const isActive = query.trim() === name;
          return (
            <button
              key={name}
              onClick={() => setQuery(isActive ? "" : name)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
              style={isActive ? {
                backgroundColor: "var(--color-brand-primary)",
                color: "#fff",
              } : {
                backgroundColor: "#f1f5f9",
                color: "var(--color-text-secondary)",
              }}
            >
              {name}
              <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 検索ボックス */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--color-text-muted)" }}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="パッケージ名・業務・ベンダーで絞り込み..."
          className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1"
          style={{ fontSize: 16 }}
        />
        {hasQuery && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 結果 */}
      {!hasQuery ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
          業務をクリックするかキーワードを入力してください
        </p>
      ) : results.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
          「{query}」に一致するパッケージが見つかりませんでした
        </p>
      ) : (
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
            {results.length}件
          </p>
          {/* デスクトップ: テーブル */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[18%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[17%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">パッケージ名</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">業務</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium whitespace-nowrap">ベンダー</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium whitespace-nowrap">クラウド</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium whitespace-nowrap">確認日</th>
                </tr>
              </thead>
              <tbody>
                {results.map((pkg, idx) => {
                  const vendor = pkg.vendors;
                  const platform = vendor?.cloud_platform ?? null;
                  const confirmed = vendor?.cloud_confirmed ?? false;
                  const badgeStyle = getCloudBadgeStyle(platform, confirmed);
                  return (
                    <tr key={`${pkg.id ?? idx}`} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-2 px-3 font-medium text-gray-800 truncate">
                        {displayValue(pkg.package_name)}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-500 truncate">
                        {pkg.business ?? "不明"}
                      </td>
                      <td className="py-2 px-3 text-gray-600 truncate">
                        {displayValue(vendor?.short_name ?? vendor?.name)}
                      </td>
                      <td className="py-2 px-3">
                        {badgeStyle ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                            style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                          >
                            {platform}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>調査中</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">
                        {displayConfirmedDate(pkg.confirmed_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* モバイル: カード */}
          <div className="sm:hidden space-y-2">
            {results.map((pkg, idx) => {
              const vendor = pkg.vendors;
              const platform = vendor?.cloud_platform ?? null;
              const confirmed = vendor?.cloud_confirmed ?? false;
              const badgeStyle = getCloudBadgeStyle(platform, confirmed);
              return (
                <div
                  key={`${pkg.id ?? idx}`}
                  className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg border border-gray-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {displayValue(pkg.package_name)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {pkg.business ?? "不明"} · {displayValue(vendor?.short_name ?? vendor?.name)}
                      <span className="text-gray-400 ml-1.5">{displayConfirmedDate(pkg.confirmed_date)}</span>
                    </p>
                  </div>
                  {badgeStyle ? (
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                    >
                      {platform}
                    </span>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-gray-400">調査中</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
