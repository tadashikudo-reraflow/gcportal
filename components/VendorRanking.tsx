"use client";

import { useState } from "react";
import type { Vendor } from "@/lib/supabase";

const NAVY = "#002D72";
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

export default function VendorRanking({ vendors }: { vendors: Vendor[] }) {
  const [showAll, setShowAll] = useState(false);

  // ベンダーを採用団体数順にソート
  const rankedVendors = [...vendors].sort(
    (a, b) => (b.municipality_count ?? 0) - (a.municipality_count ?? 0)
  );
  const maxCount = rankedVendors[0]?.municipality_count ?? 1;

  const visibleVendors = showAll
    ? rankedVendors
    : rankedVendors.slice(0, INITIAL_COUNT);
  const hasMore = rankedVendors.length > INITIAL_COUNT;

  return (
    <div className="card p-5">
      <h2
        className="text-sm font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="w-1 h-5 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: "var(--color-gov-primary)" }}
        />
        ベンダー 採用団体ランキング
        <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
          {vendors.length}社
        </span>
      </h2>

      {rankedVendors.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>データがありません。</p>
      ) : (
        <>
          <div className="space-y-2">
            {visibleVendors.map((vendor, idx) => {
              const rank = idx + 1;
              const badgeStyle = getCloudBadgeStyle(vendor.cloud_platform, vendor.cloud_confirmed);
              const count = vendor.municipality_count ?? 0;
              const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={vendor.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: isTop3 ? NAVY + "08" : "transparent",
                    border: isTop3 ? `1px solid ${NAVY}25` : "1px solid transparent",
                  }}
                >
                  {/* 順位 */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold"
                    style={{
                      backgroundColor: isTop3 ? NAVY : "#e5e7eb",
                      color: isTop3 ? "white" : "#6b7280",
                    }}
                  >
                    {rank}
                  </div>

                  {/* ベンダー名＋バッジ */}
                  <div className="w-28 sm:w-36 flex-shrink-0">
                    <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>
                      {vendor.short_name ?? vendor.name}
                    </p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {badgeStyle && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                        >
                          {vendor.cloud_platform}
                        </span>
                      )}
                      {vendor.multitenancy && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: "#d1fae5", color: "#166534" }}>共同利用</span>
                      )}
                    </div>
                  </div>

                  {/* バー — 全ベンダー統一 navy */}
                  <div className="flex-1 min-w-0">
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${barPct}%`, backgroundColor: NAVY }}
                      />
                    </div>
                  </div>

                  {/* 採用数 */}
                  <div className="flex-shrink-0 text-right w-20">
                    {count > 0 ? (
                      <>
                        <span className="text-base font-extrabold tabular-nums" style={{ color: NAVY }}>
                          {count.toLocaleString()}
                        </span>
                        <span className="text-xs ml-0.5" style={{ color: "var(--color-text-muted)" }}>団体</span>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>調査中</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 w-full py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                color: NAVY,
                backgroundColor: NAVY + "08",
                border: `1px solid ${NAVY}20`,
              }}
            >
              {showAll
                ? "折りたたむ"
                : `さらに表示（残り${rankedVendors.length - INITIAL_COUNT}社）`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
