"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PopBandStat, MunicipalityWithBand, PkgData } from "./page";
import type { PrefectureSummary } from "@/lib/types";

/* ============================================================
   Helpers
   ============================================================ */

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#F59E0B";
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

type PopBand = "1万未満" | "1-5万" | "5-10万" | "10-30万" | "30万以上";
const ALL_BANDS: PopBand[] = ["1万未満", "1-5万", "5-10万", "10-30万", "30万以上"];

/* ============================================================
   Compare tab – colors for up to 4 selected municipalities
   ============================================================ */
const SLOT_COLORS = ["#1D4ED8", "#378445", "#F59E0B", "#64748B"];

/* ============================================================
   PKGデータ照合ヘルパー
   ============================================================ */

// standardization.json の自治体（prefecture + city）と Supabase municipalities を照合し、
// municipality_id を返す Map を構築
function buildMuniIdMap(
  pkgData: PkgData | null
): Map<string, number> {
  if (!pkgData) return new Map();
  const map = new Map<string, number>();
  for (const m of pkgData.supabaseMunicipalities) {
    const key = `${m.prefecture}__${m.city}`;
    map.set(key, m.id);
  }
  return map;
}

interface PackageEntry {
  business: string | null;
  packageName: string;
  vendorName: string;
  cloudPlatform: string | null;
}

function getPackagesForMuni(
  prefecture: string,
  city: string,
  muniIdMap: Map<string, number>,
  pkgData: PkgData | null
): PackageEntry[] {
  if (!pkgData) return [];
  const key = `${prefecture}__${city}`;
  const id = muniIdMap.get(key);
  if (!id) return [];
  const rows = pkgData.packagesByMunicipalityId[id] ?? [];
  return rows.map((row) => ({
    business: row.business ?? row.packages?.business ?? null,
    packageName: row.packages?.package_name ?? "—",
    vendorName: row.packages?.vendors?.short_name ?? row.packages?.vendors?.name ?? "—",
    cloudPlatform: row.packages?.vendors?.cloud_platform ?? null,
  }));
}

/* ============================================================
   同規模PKG採用傾向を計算（ランキングタブ用）
   ============================================================ */

interface VendorShare {
  vendorName: string;
  count: number;
  percent: number;
}

function computeBandVendorShare(
  band: PopBand,
  municipalities: MunicipalityWithBand[],
  muniIdMap: Map<string, number>,
  pkgData: PkgData | null
): VendorShare[] {
  if (!pkgData) return [];
  const sameBand = municipalities.filter((m) => m.popBand === band);
  const vendorCount: Record<string, number> = {};

  for (const m of sameBand) {
    const key = `${m.prefecture}__${m.city}`;
    const id = muniIdMap.get(key);
    if (!id) continue;
    const rows = pkgData.packagesByMunicipalityId[id] ?? [];
    const seenVendors = new Set<string>();
    for (const row of rows) {
      const vName = row.packages?.vendors?.short_name ?? row.packages?.vendors?.name;
      if (vName && !seenVendors.has(vName)) {
        seenVendors.add(vName);
        vendorCount[vName] = (vendorCount[vName] ?? 0) + 1;
      }
    }
  }

  const total = sameBand.length;
  if (total === 0) return [];

  return Object.entries(vendorCount)
    .map(([vendorName, count]) => ({
      vendorName,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/* ============================================================
   Compare tab – Autocomplete Input
   ============================================================ */
function MuniAutocomplete({
  municipalities,
  value,
  onChange,
  placeholder,
  excludeCities,
  slotColor,
}: {
  municipalities: MunicipalityWithBand[];
  value: string;
  onChange: (city: string) => void;
  placeholder: string;
  excludeCities: string[];
  slotColor: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return municipalities
      .filter(
        (m) =>
          !excludeCities.includes(m.city) &&
          (m.city.toLowerCase().includes(q) || m.prefecture.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [query, municipalities, excludeCities]);

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={value ? value : query}
        onChange={(e) => {
          if (value) {
            onChange("");
          }
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          if (!value) setIsOpen(true);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{
          borderColor: value ? slotColor : "var(--color-border, #e2e8f0)",
          backgroundColor: value ? `${slotColor}10` : "var(--color-gov-bg, #f8fafc)",
        }}
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-1"
          style={{ color: "var(--color-muted, #64748b)" }}
          aria-label="クリア"
        >
          ×
        </button>
      )}
      {isOpen && filtered.length > 0 && (
        <div
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border shadow-lg"
          style={{
            backgroundColor: "var(--color-gov-bg, #fff)",
            borderColor: "var(--color-border, #e2e8f0)",
          }}
        >
          {filtered.map((m) => (
            <button
              key={`${m.prefecture}-${m.city}`}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between"
              onClick={() => {
                onChange(m.city);
                setQuery("");
                setIsOpen(false);
              }}
            >
              <span>
                {m.city}
                <span className="ml-1 text-xs" style={{ color: "var(--color-muted, #64748b)" }}>
                  ({m.prefecture})
                </span>
              </span>
              <span className="font-medium" style={{ color: getRateColor(m.overall_rate ?? 0) }}>
                {formatRate(m.overall_rate ?? 0)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Compare tab – Radar Chart (SVG)
   ============================================================ */
function RadarChart({
  items,
  dimensions,
}: {
  items: { label: string; values: number[]; color: string }[];
  dimensions: string[];
}) {
  const n = dimensions.length;
  if (n < 3) return null;

  const cx = 150;
  const cy = 150;
  const r = 110;

  const angles = dimensions.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2);
  const rings = [0.25, 0.5, 0.75, 1.0];
  const axisPoints = angles.map((a) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  }));

  function makePolygon(values: number[]): string {
    return values
      .map((v, i) => {
        const x = cx + r * v * Math.cos(angles[i]);
        const y = cy + r * v * Math.sin(angles[i]);
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={angles
            .map((a) => `${cx + r * ring * Math.cos(a)},${cy + r * ring * Math.sin(a)}`)
            .join(" ")}
          fill="none"
          stroke="var(--color-border, #e2e8f0)"
          strokeWidth="0.5"
        />
      ))}
      {axisPoints.map((p, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--color-border, #e2e8f0)" strokeWidth="0.5" />
          <text
            x={cx + (r + 18) * Math.cos(angles[i])}
            y={cy + (r + 18) * Math.sin(angles[i])}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="var(--color-muted, #64748b)"
          >
            {dimensions[i].length > 5 ? dimensions[i].slice(0, 5) + "…" : dimensions[i]}
          </text>
        </g>
      ))}
      {items.map((item, idx) => (
        <polygon
          key={idx}
          points={makePolygon(item.values)}
          fill={item.color}
          fillOpacity="0.12"
          stroke={item.color}
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

/* ============================================================
   Compare tab – inner component
   ============================================================ */
function CompareTab({
  municipalities,
  dataMonth,
  pkgData,
  initialCities,
  onCitiesChange,
}: {
  municipalities: MunicipalityWithBand[];
  dataMonth: string;
  pkgData: PkgData | null;
  initialCities: string[];
  onCitiesChange: (cities: string[]) => void;
}) {
  const STORAGE_KEY = "benchmark_compare";

  // initialCities (URLパラメータ) → localStorage → デフォルトの優先順
  const [selected, setSelected] = useState<string[]>(() => {
    if (initialCities.some(Boolean)) {
      return [...initialCities, "", "", ""].slice(0, 4);
    }
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as string[];
          return [...parsed, "", "", "", ""].slice(0, 4);
        }
      } catch { /* ignore */ }
    }
    return ["", "", "", ""];
  });

  const muniIdMap = useMemo(() => buildMuniIdMap(pkgData), [pkgData]);

  // 選択変更時: localStorage保存 + URL更新コールバック
  const handleSelect = useCallback((idx: number, city: string) => {
    setSelected((prev) => {
      const next = [...prev];
      next[idx] = city;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next.filter(Boolean)));
      } catch { /* ignore */ }
      onCitiesChange(next);
      return next;
    });
  }, [onCitiesChange]);

  const selectedMunis = useMemo(() => {
    return selected
      .map((city) => municipalities.find((m) => m.city === city))
      .filter((m): m is MunicipalityWithBand => !!m);
  }, [selected, municipalities]);

  const businessNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of selectedMunis) {
      for (const key of Object.keys(m.business_rates)) {
        set.add(key);
      }
    }
    return Array.from(set).sort();
  }, [selectedMunis]);

  const radarDimensions = useMemo(() => {
    const priority = [
      "住民記録",
      "固定資産税",
      "国民健康保険",
      "介護保険",
      "児童手当",
      "生活保護",
      "戸籍",
      "選挙人名簿管理",
    ];
    return priority.filter((b) => businessNames.includes(b)).slice(0, 8);
  }, [businessNames]);

  const radarItems = useMemo(() => {
    return selectedMunis.map((m, i) => ({
      label: m.city,
      values: radarDimensions.map((dim) => m.business_rates[dim] ?? 0),
      color: SLOT_COLORS[selected.indexOf(m.city)] ?? SLOT_COLORS[i],
    }));
  }, [selectedMunis, radarDimensions, selected]);

  // 採用パッケージデータ（自治体×業務別）
  const pkgByMuni = useMemo(() => {
    if (!pkgData) return {};
    const result: Record<string, PackageEntry[]> = {};
    for (const m of selectedMunis) {
      result[m.city] = getPackagesForMuni(m.prefecture, m.city, muniIdMap, pkgData);
    }
    return result;
  }, [selectedMunis, pkgData, muniIdMap]);

  const hasPkgData = pkgData !== null && selectedMunis.some((m) => (pkgByMuni[m.city]?.length ?? 0) > 0);

  const [copiedCompare, setCopiedCompare] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopy = useCallback(() => {
    if (selectedMunis.length === 0) return;
    const lines = [`自治体比較結果（${dataMonth}時点）`, ""];
    for (const m of selectedMunis) {
      lines.push(`■ ${m.city}（${m.prefecture}）`);
      lines.push(`  進捗率: ${formatRate(m.overall_rate ?? 0)}`);
      const topBiz = Object.entries(m.business_rates)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
        .slice(0, 5);
      for (const [biz, rate] of topBiz) {
        lines.push(`  ${biz}: ${formatRate(rate ?? 0)}`);
      }
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopiedCompare(true);
      setTimeout(() => setCopiedCompare(false), 2000);
    });
  }, [selectedMunis, dataMonth]);

  const handleCopyUrl = useCallback(() => {
    const cities = selected.filter(Boolean);
    if (cities.length === 0) return;
    const params = new URLSearchParams({ tab: "compare", cities: cities.join(",") });
    const url = `${window.location.origin}/benchmark?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    });
  }, [selected]);

  const excludeCities = selected.filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Municipality Selectors */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-gov-dark, #1e293b)" }}>
          比較する自治体を選択（最大4つ）
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((idx) => (
            <MuniAutocomplete
              key={idx}
              municipalities={municipalities}
              value={selected[idx]}
              onChange={(city) => handleSelect(idx, city)}
              placeholder={`自治体 ${idx + 1}`}
              excludeCities={excludeCities.filter((c) => c !== selected[idx])}
              slotColor={SLOT_COLORS[idx]}
            />
          ))}
        </div>
        {/* URL共有ボタン */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleCopyUrl}
            disabled={!selected.some(Boolean)}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
            style={{
              backgroundColor: copiedUrl ? "#378445" : "var(--color-section-bg, #f1f5f9)",
              color: copiedUrl ? "#fff" : "var(--color-text-primary, #1e293b)",
              border: "1px solid var(--color-border, #e2e8f0)",
            }}
          >
            {copiedUrl ? "URLをコピーしました" : "この比較をURLで共有"}
          </button>
        </div>
      </div>

      {selectedMunis.length === 0 && (
        <div className="card p-12 text-center" style={{ color: "var(--color-muted, #64748b)" }}>
          <p className="text-lg mb-2">自治体を選択してください</p>
          <p className="text-sm">上のフィールドに自治体名を入力すると候補が表示されます</p>
        </div>
      )}

      {selectedMunis.length > 0 && (
        <>
          {/* Comparison Table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--color-gov-nav, #f1f5f9)" }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--color-gov-dark, #1e293b)" }}>
                    項目
                  </th>
                  {selectedMunis.map((m, i) => (
                    <th
                      key={m.city}
                      className="text-center px-4 py-3 font-medium"
                      style={{
                        color: SLOT_COLORS[selected.indexOf(m.city)] ?? SLOT_COLORS[i],
                        borderBottom: `3px solid ${SLOT_COLORS[selected.indexOf(m.city)] ?? SLOT_COLORS[i]}`,
                      }}
                    >
                      {m.city}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Basic info */}
                <tr style={{ backgroundColor: "var(--color-gov-bg, #f8fafc)" }}>
                  <td colSpan={selectedMunis.length + 1} className="px-4 py-2 font-bold text-xs" style={{ color: "var(--color-muted, #64748b)" }}>
                    基本情報
                  </td>
                </tr>
                <tr className="border-b" style={{ borderColor: "var(--color-border, #e2e8f0)" }}>
                  <td className="px-4 py-2">都道府県</td>
                  {selectedMunis.map((m) => (
                    <td key={m.city} className="text-center px-4 py-2">
                      {m.prefecture}
                    </td>
                  ))}
                </tr>

                {/* Overall rate */}
                <tr style={{ backgroundColor: "var(--color-gov-bg, #f8fafc)" }}>
                  <td colSpan={selectedMunis.length + 1} className="px-4 py-2 font-bold text-xs" style={{ color: "var(--color-muted, #64748b)" }}>
                    移行進捗率
                  </td>
                </tr>
                <tr className="border-b" style={{ borderColor: "var(--color-border, #e2e8f0)" }}>
                  <td className="px-4 py-2">総合進捗率</td>
                  {selectedMunis.map((m, i) => {
                    const color = getRateColor(m.overall_rate ?? 0);
                    const slotIdx = selected.indexOf(m.city);
                    return (
                      <td key={m.city} className="px-4 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-lg" style={{ color }}>
                            {formatRate(m.overall_rate ?? 0)}
                          </span>
                          <div
                            className="w-full h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: "var(--color-border, #e2e8f0)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${(m.overall_rate ?? 0) * 100}%`,
                                backgroundColor: SLOT_COLORS[slotIdx] ?? SLOT_COLORS[i],
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Business rates */}
                <tr style={{ backgroundColor: "var(--color-gov-bg, #f8fafc)" }}>
                  <td colSpan={selectedMunis.length + 1} className="px-4 py-2 font-bold text-xs" style={{ color: "var(--color-muted, #64748b)" }}>
                    業務別進捗
                  </td>
                </tr>
                {businessNames.map((biz) => (
                  <tr key={biz} className="border-b" style={{ borderColor: "var(--color-border, #e2e8f0)" }}>
                    <td className="px-4 py-1.5 text-xs">{biz}</td>
                    {selectedMunis.map((m) => {
                      const rate = m.business_rates[biz];
                      return (
                        <td key={m.city} className="text-center px-4 py-1.5 text-xs">
                          {rate != null ? (
                            <span style={{ color: getRateColor(rate) }}>{formatRate(rate)}</span>
                          ) : (
                            <span style={{ color: "var(--color-muted, #64748b)" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* 採用パッケージセクション */}
                {hasPkgData && (
                  <>
                    <tr style={{ backgroundColor: "var(--color-gov-bg, #f8fafc)" }}>
                      <td colSpan={selectedMunis.length + 1} className="px-4 py-2 font-bold text-xs" style={{ color: "var(--color-muted, #64748b)" }}>
                        採用パッケージ
                      </td>
                    </tr>
                    {selectedMunis.map((m) => {
                      const pkgs = pkgByMuni[m.city] ?? [];
                      return (
                        <tr key={`pkg-${m.city}`} className="border-b align-top" style={{ borderColor: "var(--color-border, #e2e8f0)" }}>
                          <td className="px-4 py-2 text-xs font-medium whitespace-nowrap">
                            {m.city}
                          </td>
                          <td colSpan={selectedMunis.length} className="px-4 py-2">
                            {pkgs.length === 0 ? (
                              <span className="text-xs" style={{ color: "var(--color-muted, #64748b)" }}>データなし</span>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {pkgs.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border"
                                    style={{
                                      backgroundColor: "var(--color-section-bg, #f8fafc)",
                                      borderColor: "var(--color-border, #e2e8f0)",
                                    }}
                                  >
                                    <span className="font-medium">{p.vendorName}</span>
                                    <span style={{ color: "var(--color-muted, #64748b)" }}>
                                      {p.packageName !== "—" ? `/ ${p.packageName}` : ""}
                                    </span>
                                    {p.cloudPlatform && (
                                      <span
                                        className="px-1 rounded text-[10px]"
                                        style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}
                                      >
                                        {p.cloudPlatform}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Radar Chart */}
          {radarDimensions.length >= 3 && selectedMunis.length >= 2 && (
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-gov-dark, #1e293b)" }}>
                業務別比較レーダー
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--color-muted, #64748b)" }}>
                主要業務8分野の進捗率を多角的に比較
              </p>
              <RadarChart items={radarItems} dimensions={radarDimensions} />
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {radarItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export */}
          <div className="flex justify-end">
            <button
              onClick={handleCopy}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{
                backgroundColor: copiedCompare ? "#378445" : "var(--color-brand-primary, #1D4ED8)",
                color: "#fff",
              }}
            >
              {copiedCompare ? "コピーしました" : "比較結果をコピー"}
            </button>
          </div>
        </>
      )}

      <div className="text-xs text-right" style={{ color: "var(--color-muted, #64748b)" }}>
        データ基準月: {dataMonth}
      </div>
    </div>
  );
}

/* ============================================================
   Component
   ============================================================ */

interface BenchmarkClientProps {
  popBandStats: PopBandStat[];
  municipalities: MunicipalityWithBand[];
  prefectures: PrefectureSummary[];
  dataMonth: string;
  pkgData: PkgData | null;
}

export default function BenchmarkClient({
  popBandStats,
  municipalities,
  prefectures,
  dataMonth,
  pkgData,
}: BenchmarkClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URLパラメータからタブ・比較自治体を初期化
  const initialTab = (searchParams.get("tab") as "ranking" | "compare") ?? "ranking";
  const initialCitiesRaw = searchParams.get("cities") ?? "";
  const initialCities = initialCitiesRaw ? initialCitiesRaw.split(",").slice(0, 4) : [];

  /* --- Tab state --- */
  const [activeTab, setActiveTab] = useState<"ranking" | "compare">(initialTab);

  /* --- Ranking tab state --- */
  const [prefBandFilter, setPrefBandFilter] = useState<PopBand | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuni, setSelectedMuni] = useState<MunicipalityWithBand | null>(null);
  const [copied, setCopied] = useState(false);

  const muniIdMap = useMemo(() => buildMuniIdMap(pkgData), [pkgData]);

  // rankingタブ: localStorage復元
  const RANKING_STORAGE_KEY = "benchmark_ranking";
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RANKING_STORAGE_KEY);
      if (saved) {
        const { query, bandFilter } = JSON.parse(saved) as { query?: string; bandFilter?: string };
        if (bandFilter) setPrefBandFilter(bandFilter as PopBand | "all");
        if (query) setSearchQuery(query);
      }
    } catch { /* ignore */ }
  }, []);

  // rankingタブ: 変更時にlocalStorageへ保存
  useEffect(() => {
    try {
      localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify({ query: searchQuery, bandFilter: prefBandFilter }));
    } catch { /* ignore */ }
  }, [searchQuery, prefBandFilter]);

  /* --- URL更新（compareタブ） --- */
  const handleCompareCitiesChange = useCallback((cities: string[]) => {
    const activeCities = cities.filter(Boolean);
    const params = new URLSearchParams({ tab: "compare" });
    if (activeCities.length > 0) params.set("cities", activeCities.join(","));
    router.replace(`/benchmark?${params.toString()}`, { scroll: false });
  }, [router]);

  /* --- Derived: Prefecture ranking with band filter --- */
  const prefectureRanking = useMemo(() => {
    const filtered =
      prefBandFilter === "all"
        ? municipalities
        : municipalities.filter((m) => m.popBand === prefBandFilter);

    const map = new Map<string, { rates: number[]; completed: number; critical: number }>();
    for (const m of filtered) {
      const rate = m.overall_rate ?? 0;
      let entry = map.get(m.prefecture);
      if (!entry) {
        entry = { rates: [], completed: 0, critical: 0 };
        map.set(m.prefecture, entry);
      }
      entry.rates.push(rate);
      if (rate >= 1.0) entry.completed++;
      if (rate < 0.5) entry.critical++;
    }

    return Array.from(map.entries())
      .map(([prefecture, { rates, completed, critical }]) => ({
        prefecture,
        avgRate: rates.reduce((a, c) => a + c, 0) / rates.length,
        count: rates.length,
        completed,
        critical,
      }))
      .sort((a, b) => b.avgRate - a.avgRate);
  }, [municipalities, prefBandFilter]);

  /* --- Derived: Search results --- */
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return municipalities
      .filter(
        (m) =>
          m.city.toLowerCase().includes(q) || m.prefecture.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [municipalities, searchQuery]);

  /* --- Derived: Same-prefecture and same-band peers --- */
  const samePrefMunis = useMemo(() => {
    if (!selectedMuni) return [];
    return municipalities
      .filter(
        (m) => m.prefecture === selectedMuni.prefecture && m.city !== selectedMuni.city
      )
      .sort((a, b) => (b.overall_rate ?? 0) - (a.overall_rate ?? 0))
      .slice(0, 10);
  }, [municipalities, selectedMuni]);

  const sameBandStats = useMemo(() => {
    if (!selectedMuni) return null;
    const peers = municipalities.filter((m) => m.popBand === selectedMuni.popBand);
    const rates = peers.map((m) => m.overall_rate ?? 0).sort((a, b) => a - b);
    const avg = rates.reduce((a, c) => a + c, 0) / rates.length;
    const myRate = selectedMuni.overall_rate ?? 0;
    const rank = peers.filter((m) => (m.overall_rate ?? 0) > myRate).length + 1;
    return { avg, total: peers.length, rank };
  }, [municipalities, selectedMuni]);

  /* --- 同規模PKG採用傾向 --- */
  const bandVendorShare = useMemo(() => {
    if (!selectedMuni || !pkgData) return [];
    return computeBandVendorShare(selectedMuni.popBand, municipalities, muniIdMap, pkgData);
  }, [selectedMuni, pkgData, municipalities, muniIdMap]);

  /* --- Budget template copy --- */
  const handleCopyBudgetTemplate = useCallback(() => {
    if (!selectedMuni) return;
    const myRate = selectedMuni.overall_rate ?? 0;
    const lines: string[] = [];
    lines.push("自治体ベンチマーク比較データ（議会説明資料用）");
    lines.push(`出力日\t${new Date().toISOString().slice(0, 10)}`);
    lines.push(`データ基準月\t${dataMonth}`);
    lines.push("");
    lines.push("【対象自治体】");
    lines.push(`自治体名\t${selectedMuni.prefecture} ${selectedMuni.city}`);
    lines.push(`人口帯\t${selectedMuni.popBand}`);
    lines.push(`全体 手続き進捗率\t${formatRate(myRate)}`);
    lines.push(`全国ステータス\t${getStatusLabel(myRate)}`);
    lines.push("");

    if (sameBandStats) {
      lines.push("【同規模自治体との比較】");
      lines.push(`人口帯\t${selectedMuni.popBand}`);
      lines.push(`同帯平均 手続き進捗率\t${formatRate(sameBandStats.avg)}`);
      lines.push(`同帯内順位\t${sameBandStats.rank}位 / ${sameBandStats.total}団体`);
      lines.push(
        `平均との差\t${myRate >= sameBandStats.avg ? "+" : ""}${((myRate - sameBandStats.avg) * 100).toFixed(1)}pt`
      );
      lines.push("");
    }

    lines.push("【業務別進捗】");
    lines.push("業務名\t進捗率");
    const rates = selectedMuni.business_rates;
    for (const [biz, rate] of Object.entries(rates)) {
      if (rate !== null && rate !== undefined) {
        lines.push(`${biz}\t${formatRate(rate)}`);
      }
    }
    lines.push("");

    if (samePrefMunis.length > 0) {
      lines.push(`【${selectedMuni.prefecture}内の他自治体（上位10団体）】`);
      lines.push("自治体名\t進捗率");
      for (const m of samePrefMunis) {
        lines.push(`${m.city}\t${formatRate(m.overall_rate ?? 0)}`);
      }
    }

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [selectedMuni, sameBandStats, samePrefMunis, dataMonth]);

  /* ============================================================
     Tabs
     ============================================================ */
  const tabs = [
    { key: "ranking" as const, label: "ランキング" },
    { key: "compare" as const, label: "自治体比較" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div
        className="flex border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-5 py-2.5 text-sm font-medium transition-colors -mb-px"
            style={{
              color:
                activeTab === tab.key
                  ? "var(--color-gov-primary)"
                  : "var(--color-text-secondary)",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid var(--color-gov-primary)"
                  : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TAB: ランキング
          ============================================================ */}
      {activeTab === "ranking" && (
        <div className="space-y-8">
          {/* SECTION 1: 人口帯別の手続き進捗率比較 */}
          <section className="card p-5 sm:p-6">
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: "var(--color-gov-primary)" }}
            >
              人口帯別の手続き進捗率比較
            </h2>
            <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
              自治体名の末尾（市/町/村/区）と主要都市リストに基づく推定分類
            </p>

            <div className="space-y-4">
              {popBandStats.map((s) => {
                const pct = s.avgRate * 100;
                return (
                  <div key={s.band}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{s.band}</span>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        <span>{s.count}団体</span>
                        <span className="text-green-700">{s.completedCount}完了</span>
                        {s.criticalCount > 0 && (
                          <span className="text-red-700">{s.criticalCount}危機</span>
                        )}
                        <span
                          className="font-bold text-sm"
                          style={{ color: getRateColor(s.avgRate) }}
                        >
                          {formatRate(s.avgRate)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="w-full h-7 rounded-md overflow-hidden"
                      style={{ backgroundColor: "var(--color-section-bg)" }}
                    >
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: getRateColor(s.avgRate),
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 2: 都道府県別ランキング */}
          <section className="card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2
                  className="text-lg font-bold mb-1"
                  style={{ color: "var(--color-gov-primary)" }}
                >
                  都道府県別ランキング
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  人口帯フィルタで同規模自治体を比較
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setPrefBandFilter("all")}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: prefBandFilter === "all" ? "var(--color-brand-primary)" : "var(--color-section-bg)",
                    color: prefBandFilter === "all" ? "#fff" : "var(--color-text-primary)",
                  }}
                >
                  全体
                </button>
                {ALL_BANDS.map((band) => (
                  <button
                    key={band}
                    onClick={() => setPrefBandFilter(band)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: prefBandFilter === band ? "var(--color-brand-primary)" : "var(--color-section-bg)",
                      color: prefBandFilter === band ? "#fff" : "var(--color-text-primary)",
                    }}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "var(--color-gov-primary)" }}>
                    <th className="text-center py-2.5 px-3 text-xs font-medium w-14" style={{ color: "#fff" }}>
                      順位
                    </th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium" style={{ color: "#fff" }}>
                      都道府県
                    </th>
                    <th className="text-left py-2.5 px-3 text-xs font-medium min-w-[160px]" style={{ color: "#fff" }}>
                      平均 手続き進捗率
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium" style={{ color: "#fff" }}>
                      対象数
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium" style={{ color: "#fff" }}>
                      完了
                    </th>
                    <th className="text-right py-2.5 px-3 text-xs font-medium" style={{ color: "#fff" }}>
                      危機
                    </th>
                    <th className="text-center py-2.5 px-3 text-xs font-medium" style={{ color: "#fff" }}>
                      状況
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prefectureRanking.map((p, i) => {
                    const badge = getStatusBadgeStyle(p.avgRate);
                    return (
                      <tr
                        key={p.prefecture}
                        className="border-b transition-colors hover:bg-gray-50"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <td className="text-center py-2.5 px-3 font-medium text-sm">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium">{p.prefecture}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 rounded-sm"
                              style={{
                                width: `${Math.max(p.avgRate * 100, 2)}%`,
                                backgroundColor: getRateColor(p.avgRate),
                                opacity: 0.7,
                                maxWidth: "120px",
                              }}
                            />
                            <span
                              className="text-xs font-bold whitespace-nowrap"
                              style={{ color: getRateColor(p.avgRate) }}
                            >
                              {formatRate(p.avgRate)}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-2.5 px-3">{p.count}</td>
                        <td className="text-right py-2.5 px-3 text-green-700">{p.completed}</td>
                        <td className="text-right py-2.5 px-3 text-red-700">{p.critical}</td>
                        <td className="text-center py-2.5 px-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {getStatusLabel(p.avgRate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {prefBandFilter !== "all" && (
              <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
                ※ 人口帯「{prefBandFilter}」の自治体のみで集計
              </p>
            )}
          </section>

          {/* SECTION 3: 類似団体検索 */}
          <section className="card p-5 sm:p-6">
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: "var(--color-gov-primary)" }}
            >
              類似団体検索
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
              自治体名を入力して、同規模・同都道府県の自治体と比較
            </p>

            <div className="relative max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedMuni(null);
                }}
                placeholder="自治体名で検索（例: 世田谷区、松本市）"
                className="w-full px-4 py-2.5 rounded-lg text-sm border focus:outline-none focus:ring-2"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "#fff",
                }}
              />
            </div>

            {searchResults.length > 0 && !selectedMuni && (
              <div
                className="mt-2 max-w-md rounded-lg border shadow-sm overflow-hidden"
                style={{ borderColor: "var(--color-border)", backgroundColor: "#fff" }}
              >
                {searchResults.map((m) => (
                  <button
                    key={`${m.prefecture}-${m.city}`}
                    onClick={() => {
                      setSelectedMuni(m);
                      setSearchQuery(m.city);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors border-b flex items-center justify-between"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <span>
                      <span className="font-medium">{m.city}</span>
                      <span className="ml-2" style={{ color: "var(--color-text-secondary)" }}>
                        {m.prefecture}
                      </span>
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: getRateColor(m.overall_rate ?? 0) }}
                    >
                      {formatRate(m.overall_rate ?? 0)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedMuni && (
              <div className="mt-5 space-y-5">
                <div
                  className="rounded-lg p-4 sm:p-5"
                  style={{ backgroundColor: "var(--color-section-bg)" }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold">
                        {selectedMuni.prefecture} {selectedMuni.city}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        <span>人口帯: {selectedMuni.popBand}</span>
                        {sameBandStats && (
                          <span>
                            同帯順位: {sameBandStats.rank}位/{sameBandStats.total}団体
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: getRateColor(selectedMuni.overall_rate ?? 0) }}
                      >
                        {formatRate(selectedMuni.overall_rate ?? 0)}
                      </span>
                      {(() => {
                        const badge = getStatusBadgeStyle(selectedMuni.overall_rate ?? 0);
                        return (
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: badge.bg, color: badge.text }}
                          >
                            {getStatusLabel(selectedMuni.overall_rate ?? 0)}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {sameBandStats && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <span style={{ color: "var(--color-text-secondary)" }}>
                        同規模平均 {formatRate(sameBandStats.avg)}
                      </span>
                      {(() => {
                        const diff = (selectedMuni.overall_rate ?? 0) - sameBandStats.avg;
                        const isPositive = diff >= 0;
                        return (
                          <span
                            className="font-bold"
                            style={{ color: isPositive ? "#378445" : "#b91c1c" }}
                          >
                            ({isPositive ? "+" : ""}
                            {(diff * 100).toFixed(1)}pt)
                          </span>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold mb-3" style={{ color: "var(--color-gov-primary)" }}>
                    業務別進捗
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(selectedMuni.business_rates)
                      .filter(([, v]) => v !== null && v !== undefined)
                      .sort(([, a], [, b]) => (a as number) - (b as number))
                      .map(([biz, rate]) => {
                        const r = rate as number;
                        return (
                          <div
                            key={biz}
                            className="flex items-center gap-2 px-3 py-2 rounded-md"
                            style={{ backgroundColor: "var(--color-section-bg)" }}
                          >
                            <span className="text-xs flex-1 truncate">{biz}</span>
                            <div className="w-20 h-3 rounded-sm overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
                              <div
                                className="h-full rounded-sm"
                                style={{
                                  width: `${r * 100}%`,
                                  backgroundColor: getRateColor(r),
                                  opacity: 0.8,
                                }}
                              />
                            </div>
                            <span
                              className="text-xs font-bold w-12 text-right"
                              style={{ color: getRateColor(r) }}
                            >
                              {formatRate(r)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* 同規模PKG採用傾向 */}
                {pkgData && bandVendorShare.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold mb-1" style={{ color: "var(--color-gov-primary)" }}>
                      同規模自治体のPKG採用傾向
                    </h4>
                    <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
                      人口帯「{selectedMuni.popBand}」の自治体で採用されているベンダー（自治体単位でカウント）
                    </p>
                    <div className="space-y-2">
                      {bandVendorShare.map((v) => (
                        <div key={v.vendorName} className="flex items-center gap-3">
                          <span className="text-xs w-24 truncate font-medium">{v.vendorName}</span>
                          <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ backgroundColor: "var(--color-section-bg)" }}>
                            <div
                              className="h-full rounded-sm transition-all duration-500"
                              style={{
                                width: `${v.percent}%`,
                                backgroundColor: "#1D4ED8",
                                opacity: 0.7,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold w-12 text-right" style={{ color: "#1D4ED8" }}>
                            {v.percent}%
                          </span>
                          <span className="text-xs w-12 text-right" style={{ color: "var(--color-text-secondary)" }}>
                            {v.count}団体
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {samePrefMunis.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold mb-3" style={{ color: "var(--color-gov-primary)" }}>
                      {selectedMuni.prefecture}の他自治体（上位10団体）
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ backgroundColor: "var(--color-section-bg)" }}>
                            <th className="text-left py-2 px-3 text-xs font-medium">自治体名</th>
                            <th className="text-left py-2 px-3 text-xs font-medium">人口帯</th>
                            <th className="text-left py-2 px-3 text-xs font-medium min-w-[120px]">進捗率</th>
                            <th className="text-center py-2 px-3 text-xs font-medium">状況</th>
                          </tr>
                        </thead>
                        <tbody>
                          {samePrefMunis.map((m) => {
                            const badge = getStatusBadgeStyle(m.overall_rate ?? 0);
                            return (
                              <tr
                                key={m.city}
                                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                style={{ borderColor: "var(--color-border)" }}
                                onClick={() => {
                                  setSelectedMuni(m);
                                  setSearchQuery(m.city);
                                }}
                              >
                                <td className="py-2 px-3 font-medium">{m.city}</td>
                                <td className="py-2 px-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                  {m.popBand}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="h-3 rounded-sm"
                                      style={{
                                        width: `${Math.max((m.overall_rate ?? 0) * 100, 2)}%`,
                                        backgroundColor: getRateColor(m.overall_rate ?? 0),
                                        opacity: 0.7,
                                        maxWidth: "80px",
                                      }}
                                    />
                                    <span
                                      className="text-xs font-bold"
                                      style={{ color: getRateColor(m.overall_rate ?? 0) }}
                                    >
                                      {formatRate(m.overall_rate ?? 0)}
                                    </span>
                                  </div>
                                </td>
                                <td className="text-center py-2 px-3">
                                  <span
                                    className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium"
                                    style={{ backgroundColor: badge.bg, color: badge.text }}
                                  >
                                    {getStatusLabel(m.overall_rate ?? 0)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* SECTION 4: 比較データ出力 */}
          <section className="card p-5 sm:p-6">
            <h2
              className="text-lg font-bold mb-1"
              style={{ color: "var(--color-gov-primary)" }}
            >
              比較データをコピー
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
              選択した自治体のベンチマークデータをテーブル形式でクリップボードにコピー
            </p>

            {!selectedMuni ? (
              <div
                className="rounded-lg p-6 text-center text-sm"
                style={{ backgroundColor: "var(--color-section-bg)", color: "var(--color-text-muted)" }}
              >
                上の「類似団体検索」で自治体を選択してください
              </div>
            ) : (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse">
                    <tbody>
                      <tr style={{ backgroundColor: "var(--color-gov-primary)" }}>
                        <td
                          colSpan={2}
                          className="py-2.5 px-4 font-bold text-sm"
                          style={{ color: "#fff" }}
                        >
                          {selectedMuni.prefecture} {selectedMuni.city} ベンチマークデータ
                        </td>
                      </tr>
                      <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <td
                          className="py-2 px-4 font-medium text-xs w-40"
                          style={{ backgroundColor: "var(--color-section-bg)" }}
                        >
                          人口帯
                        </td>
                        <td className="py-2 px-4 text-sm">{selectedMuni.popBand}</td>
                      </tr>
                      <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                        <td
                          className="py-2 px-4 font-medium text-xs"
                          style={{ backgroundColor: "var(--color-section-bg)" }}
                        >
                          全体 手続き進捗率
                        </td>
                        <td
                          className="py-2 px-4 text-sm font-bold"
                          style={{ color: getRateColor(selectedMuni.overall_rate ?? 0) }}
                        >
                          {formatRate(selectedMuni.overall_rate ?? 0)}
                        </td>
                      </tr>
                      {sameBandStats && (
                        <>
                          <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                            <td
                              className="py-2 px-4 font-medium text-xs"
                              style={{ backgroundColor: "var(--color-section-bg)" }}
                            >
                              同規模平均
                            </td>
                            <td className="py-2 px-4 text-sm">{formatRate(sameBandStats.avg)}</td>
                          </tr>
                          <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                            <td
                              className="py-2 px-4 font-medium text-xs"
                              style={{ backgroundColor: "var(--color-section-bg)" }}
                            >
                              同帯内順位
                            </td>
                            <td className="py-2 px-4 text-sm">
                              {sameBandStats.rank}位 / {sameBandStats.total}団体
                            </td>
                          </tr>
                        </>
                      )}
                      <tr style={{ backgroundColor: "var(--color-gov-primary)" }}>
                        <td
                          colSpan={2}
                          className="py-2 px-4 font-bold text-xs"
                          style={{ color: "#fff" }}
                        >
                          業務別進捗
                        </td>
                      </tr>
                      {Object.entries(selectedMuni.business_rates)
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([biz, rate]) => (
                          <tr
                            key={biz}
                            className="border-b"
                            style={{ borderColor: "var(--color-border)" }}
                          >
                            <td
                              className="py-1.5 px-4 text-xs"
                              style={{ backgroundColor: "var(--color-section-bg)" }}
                            >
                              {biz}
                            </td>
                            <td
                              className="py-1.5 px-4 text-sm font-medium"
                              style={{ color: getRateColor(rate as number) }}
                            >
                              {formatRate(rate as number)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleCopyBudgetTemplate}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
                  style={{
                    backgroundColor: copied ? "#378445" : "var(--color-brand-primary)",
                  }}
                >
                  {copied ? "コピーしました" : "クリップボードにコピー（タブ区切り）"}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {/* ============================================================
          TAB: 自治体比較
          ============================================================ */}
      {activeTab === "compare" && (
        <CompareTab
          municipalities={municipalities}
          dataMonth={dataMonth}
          pkgData={pkgData}
          initialCities={initialCities}
          onCitiesChange={handleCompareCitiesChange}
        />
      )}
    </div>
  );
}
