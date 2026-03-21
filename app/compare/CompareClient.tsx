"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";

/* ============================================================
   Types
   ============================================================ */
interface MuniData {
  prefecture: string;
  city: string;
  overall_rate: number;
  business_rates: Record<string, number | null>;
}

interface Props {
  municipalities: MuniData[];
  dataMonth: string;
}

/* ============================================================
   Colors for up to 4 selected municipalities
   ============================================================ */
const SLOT_COLORS = ["#1D4ED8", "#378445", "#FA6414", "#7C3AED"];
const SLOT_BG = ["#EFF6FF", "#ECFDF5", "#FFF7ED", "#F5F3FF"];

/* ============================================================
   Helpers
   ============================================================ */
function fmt(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#FA6414";
  return "#b91c1c";
}

/* ============================================================
   Autocomplete Input
   ============================================================ */
function MuniAutocomplete({
  municipalities,
  value,
  onChange,
  placeholder,
  excludeCities,
  slotColor,
}: {
  municipalities: MuniData[];
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
              <span className="font-medium" style={{ color: getRateColor(m.overall_rate) }}>
                {fmt(m.overall_rate)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CSS Radar Chart
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

  // Angle for each dimension
  const angles = dimensions.map(
    (_, i) => (i * 2 * Math.PI) / n - Math.PI / 2
  );

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Axis endpoint positions
  const axisPoints = angles.map((a) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  }));

  // Polygon for each item
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
      {/* Grid rings */}
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

      {/* Axes */}
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

      {/* Data polygons */}
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
   Main Component
   ============================================================ */
export default function CompareClient({ municipalities, dataMonth }: Props) {
  const [selected, setSelected] = useState<string[]>(["", "", "", ""]);

  const selectedMunis = useMemo(() => {
    return selected
      .map((city) => municipalities.find((m) => m.city === city))
      .filter((m): m is MuniData => !!m);
  }, [selected, municipalities]);

  const handleSelect = useCallback((idx: number, city: string) => {
    setSelected((prev) => {
      const next = [...prev];
      next[idx] = city;
      return next;
    });
  }, []);

  // Get all unique business names from selected municipalities
  const businessNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of selectedMunis) {
      for (const key of Object.keys(m.business_rates)) {
        set.add(key);
      }
    }
    return Array.from(set).sort();
  }, [selectedMunis]);

  // Radar chart: pick up to 8 key businesses
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

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    if (selectedMunis.length === 0) return;
    const lines = [`自治体比較結果（${dataMonth}時点）`, ""];
    for (const m of selectedMunis) {
      lines.push(`■ ${m.city}（${m.prefecture}）`);
      lines.push(`  進捗率: ${fmt(m.overall_rate)}`);
      const topBiz = Object.entries(m.business_rates)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
        .slice(0, 5);
      for (const [biz, rate] of topBiz) {
        lines.push(`  ${biz}: ${fmt(rate ?? 0)}`);
      }
      lines.push("");
    }
    navigator.clipboard.writeText(lines.join("\n"));
  }, [selectedMunis, dataMonth]);

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
                    const color = getRateColor(m.overall_rate);
                    const slotIdx = selected.indexOf(m.city);
                    return (
                      <td key={m.city} className="px-4 py-2">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-lg" style={{ color }}>
                            {fmt(m.overall_rate)}
                          </span>
                          {/* Progress bar */}
                          <div
                            className="w-full h-2 rounded-full overflow-hidden"
                            style={{ backgroundColor: "var(--color-border, #e2e8f0)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${m.overall_rate * 100}%`,
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
                            <span style={{ color: getRateColor(rate) }}>{fmt(rate)}</span>
                          ) : (
                            <span style={{ color: "var(--color-muted, #64748b)" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
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
              {/* Legend */}
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
                backgroundColor: "var(--color-gov-primary, #1D4ED8)",
                color: "#fff",
              }}
            >
              比較結果をコピー
            </button>
          </div>
        </>
      )}

      {/* Data source */}
      <div className="text-xs text-right" style={{ color: "var(--color-muted, #64748b)" }}>
        データ基準月: {dataMonth}
      </div>
    </div>
  );
}
