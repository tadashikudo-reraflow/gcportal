"use client";

import { useState } from "react";
import type { Vendor, Package } from "@/lib/supabase";

const INITIAL_COUNT = 10;

// クラウドバッジの色設定
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

/** "ー" や "—" を「調査中」に置換 */
function displayValue(val: string | null | undefined): string {
  if (!val) return "調査中";
  const trimmed = val.trim();
  if (trimmed === "ー" || trimmed === "—" || trimmed === "-" || trimmed === "") return "調査中";
  return trimmed;
}

type PackageWithVendor = Package & { vendors?: Vendor };

// 同一パッケージ名+ベンダーを統合した表示用型
type MergedPackage = {
  package_name: string;
  vendor: Vendor | undefined;
  business: string;
  confirmed_date: string | null;
  subCount: number; // 適合番号の数（サブシステム数）
};

/** 同一パッケージ名+ベンダーの重複をマージ */
function mergePackages(pkgs: PackageWithVendor[]): MergedPackage[] {
  const map = new Map<string, MergedPackage>();
  for (const pkg of pkgs) {
    const vendorName = pkg.vendors?.short_name ?? pkg.vendors?.name ?? "不明";
    const key = `${pkg.package_name}__${vendorName}`;
    const existing = map.get(key);
    if (existing) {
      existing.subCount++;
      // 最新の確認日を採用
      if (pkg.confirmed_date && (!existing.confirmed_date || pkg.confirmed_date > existing.confirmed_date)) {
        existing.confirmed_date = pkg.confirmed_date;
      }
    } else {
      map.set(key, {
        package_name: pkg.package_name,
        vendor: pkg.vendors,
        business: pkg.business ?? "不明",
        confirmed_date: pkg.confirmed_date,
        subCount: 1,
      });
    }
  }
  return Array.from(map.values());
}

function BusinessGroup({
  biz,
  pkgs,
}: {
  biz: string;
  pkgs: PackageWithVendor[];
}) {
  const [showAll, setShowAll] = useState(false);
  const merged = mergePackages(pkgs);
  const visiblePkgs = showAll ? merged : merged.slice(0, INITIAL_COUNT);
  const hasMore = merged.length > INITIAL_COUNT;

  return (
    <details className="group" open>
      <summary className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors select-none">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800 text-sm">{biz}</span>
          <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
            {merged.length}件
          </span>
        </div>
        <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
      </summary>

      <div className="mt-2">
        {/* デスクトップ: テーブル表示 */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">パッケージ名</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium whitespace-nowrap">ベンダー</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium whitespace-nowrap">クラウド</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium whitespace-nowrap">確認日</th>
              </tr>
            </thead>
            <tbody>
              {visiblePkgs.map((mp, idx) => {
                const vendor = mp.vendor;
                const platform = vendor?.cloud_platform ?? null;
                const confirmed = vendor?.cloud_confirmed ?? false;
                const badgeStyle = getCloudBadgeStyle(platform, confirmed);
                return (
                  <tr
                    key={`${mp.package_name}-${idx}`}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2 px-3 font-medium text-gray-800">
                      <span className="flex items-center gap-1.5">
                        {displayValue(mp.package_name)}
                        {mp.subCount > 1 && (
                          <span
                            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-xs font-bold"
                            style={{ backgroundColor: "#e0e7ff", color: "#3730a3", fontSize: 10 }}
                          >
                            {mp.subCount}件
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                      {displayValue(vendor?.short_name ?? vendor?.name)}
                    </td>
                    <td className="py-2 px-3">
                      {badgeStyle ? (
                        <span
                          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                        >
                          {platform}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>調査中</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">
                      {displayValue(mp.confirmed_date)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* モバイル: カード表示 */}
        <div className="sm:hidden space-y-2">
          {visiblePkgs.map((mp, idx) => {
            const vendor = mp.vendor;
            const platform = vendor?.cloud_platform ?? null;
            const confirmed = vendor?.cloud_confirmed ?? false;
            const badgeStyle = getCloudBadgeStyle(platform, confirmed);
            return (
              <div
                key={`${mp.package_name}-${idx}`}
                className="flex items-center justify-between gap-2 py-2.5 px-3 rounded-lg border border-gray-100"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {displayValue(mp.package_name)}
                    {mp.subCount > 1 && (
                      <span className="text-xs font-normal text-gray-400 ml-1">({mp.subCount}件)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {displayValue(vendor?.short_name ?? vendor?.name)}
                    {mp.confirmed_date && mp.confirmed_date !== "調査中" && (
                      <span className="text-gray-400 ml-1.5">{mp.confirmed_date}</span>
                    )}
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

        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-2 w-full py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              color: "#002D72",
              backgroundColor: "#002D7208",
              border: "1px solid #002D7220",
            }}
          >
            {showAll
              ? "折りたたむ"
              : `さらに表示（残り${merged.length - INITIAL_COUNT}件）`}
          </button>
        )}
      </div>
    </details>
  );
}

export default function BusinessPackageList({
  packages,
}: {
  packages: PackageWithVendor[];
}) {
  // 業務でグループ化
  const businessGroups: Record<string, PackageWithVendor[]> = {};
  for (const pkg of packages) {
    const biz = pkg.business ?? "不明";
    if (!businessGroups[biz]) businessGroups[biz] = [];
    businessGroups[biz].push(pkg);
  }
  const sortedBusinesses = Object.keys(businessGroups).sort();

  return (
    <div className="card p-6">
      <h2
        className="text-sm font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="w-1 h-5 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: "var(--color-gov-primary)" }}
        />
        業務別パッケージ一覧
        <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
          （{sortedBusinesses.length}業務 / 計{packages.length}件）
        </span>
      </h2>

      {sortedBusinesses.length === 0 ? (
        <p className="text-sm text-gray-400">データがありません。</p>
      ) : (
        <div className="space-y-4">
          {sortedBusinesses.map((biz) => (
            <BusinessGroup key={biz} biz={biz} pkgs={businessGroups[biz]} />
          ))}
        </div>
      )}
    </div>
  );
}
