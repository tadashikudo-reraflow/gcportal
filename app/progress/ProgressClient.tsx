"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useCallback, Suspense } from "react";
import type {
  ProgressData,
  ProgressMunicipality,
  PrefectureSummary,
} from "./page";

/* ══════════════════════════════════════════════════════════════
   Constants & Helpers
   ══════════════════════════════════════════════════════════════ */

const POP_LABELS: Record<string, string> = {
  A: "政令市",
  B: "中核市",
  C: "一般市",
  D: "町",
  E: "村",
};

type StatusKey = "completed" | "on_track" | "warning" | "critical" | "tokutei";

function getStatus(m: ProgressMunicipality): StatusKey {
  if (m.isTokutei) return "tokutei";
  if (m.overall_rate >= 1.0) return "completed";
  if (m.overall_rate >= 0.7) return "on_track";
  if (m.overall_rate >= 0.4) return "warning";
  return "critical";
}

const STATUS_CONFIG: Record<
  StatusKey,
  { label: string; bg: string; fg: string }
> = {
  completed: {
    label: "完了",
    bg: "var(--color-status-complete, #10B981)",
    fg: "#fff",
  },
  on_track: {
    label: "順調",
    bg: "var(--color-brand-primary, #0066FF)",
    fg: "#fff",
  },
  warning: {
    label: "要注意",
    bg: "var(--color-warning, #F5B500)",
    fg: "#333",
  },
  critical: { label: "危機", bg: "var(--color-error, #FF6B6B)", fg: "#fff" },
  tokutei: { label: "特定移行", bg: "#8B5CF6", fg: "#fff" },
};

function pct(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function rateColor(rate: number): string {
  if (rate >= 1.0) return "var(--color-status-complete, #10B981)";
  if (rate >= 0.7) return "var(--color-brand-primary, #0066FF)";
  if (rate >= 0.4) return "var(--color-warning, #F5B500)";
  return "var(--color-error, #FF6B6B)";
}

/* ══════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: StatusKey }) {
  const c = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {c.label}
    </span>
  );
}

function ProgressBar({ rate }: { rate: number }) {
  return (
    <div
      className="h-2 rounded-full w-full"
      style={{ backgroundColor: "var(--color-section-bg, #F0F0F0)" }}
    >
      <div
        className="h-2 rounded-full transition-all"
        style={{
          width: `${Math.min(rate * 100, 100)}%`,
          backgroundColor: rateColor(rate),
        }}
      />
    </div>
  );
}

/* filter pills */
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
      style={{
        backgroundColor: active
          ? "var(--color-brand-primary, #0066FF)"
          : "var(--color-section-bg, #F8F9FA)",
        color: active ? "#fff" : "var(--color-text-secondary, #64748b)",
        border: `1px solid ${active ? "var(--color-brand-primary, #0066FF)" : "var(--color-border, #E2E8F0)"}`,
      }}
    >
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   Filter Bar (shared across levels)
   ══════════════════════════════════════════════════════════════ */

function FilterBar({
  status,
  setStatus,
  pop,
  setPop,
  query,
  setQuery,
}: {
  status: string;
  setStatus: (v: string) => void;
  pop: string;
  setPop: (v: string) => void;
  query: string;
  setQuery: (v: string) => void;
}) {
  const statusOptions = [
    { key: "", label: "すべて" },
    { key: "completed", label: "完了" },
    { key: "on_track", label: "順調" },
    { key: "warning", label: "要注意" },
    { key: "critical", label: "危機" },
    { key: "tokutei", label: "特定移行" },
  ];
  const popOptions = [
    { key: "", label: "全人口帯" },
    { key: "A", label: "政令市" },
    { key: "B", label: "中核市" },
    { key: "C", label: "一般市" },
    { key: "D", label: "町" },
    { key: "E", label: "村" },
  ];

  return (
    <div className="card p-3 print:hidden space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {statusOptions.map((o) => (
          <FilterPill
            key={o.key}
            label={o.label}
            active={status === o.key}
            onClick={() => setStatus(o.key)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {popOptions.map((o) => (
          <FilterPill
            key={o.key}
            label={o.label}
            active={pop === o.key}
            onClick={() => setPop(o.key)}
          />
        ))}
      </div>
      <input
        type="text"
        placeholder="自治体名で検索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm"
        style={{
          border: "1px solid var(--color-border, #E2E8F0)",
          color: "var(--color-text-primary)",
          backgroundColor: "var(--color-surface-container-low, #fff)",
        }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Level 0 : National Overview
   ══════════════════════════════════════════════════════════════ */

function NationalOverview({
  data,
  prefectures,
  onSelectPref,
}: {
  data: ProgressData;
  prefectures: PrefectureSummary[];
  onSelectPref: (pref: string) => void;
}) {
  const sorted = useMemo(
    () => [...prefectures].sort((a, b) => a.avg_rate - b.avg_rate),
    [prefectures]
  );

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "全自治体数",
            value: data.summary.total.toLocaleString(),
            color: "var(--color-gov-primary, #002D72)",
          },
          {
            label: "全国平均進捗率",
            value: pct(data.summary.avg_rate),
            color: rateColor(data.summary.avg_rate),
          },
          {
            label: "完了団体",
            value: data.summary.completed_count.toString(),
            color: "var(--color-status-complete, #10B981)",
          },
          {
            label: "危機的団体",
            value: data.summary.critical_count.toString(),
            color: "var(--color-error, #FF6B6B)",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div
              className="text-xs mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {kpi.label}
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: kpi.color }}
            >
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Prefecture Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map((p) => (
          <button
            key={p.prefecture}
            onClick={() => onSelectPref(p.prefecture)}
            className="card p-3 text-left hover:shadow-md transition-shadow"
            style={{ cursor: "pointer" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--color-gov-primary, #002D72)" }}
              >
                {p.prefecture}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: rateColor(p.avg_rate) }}
              >
                {pct(p.avg_rate)}
              </span>
            </div>
            <ProgressBar rate={p.avg_rate} />
            <div className="flex gap-2 mt-2 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              <span>{p.count}団体</span>
              {p.completed > 0 && (
                <span style={{ color: "var(--color-status-complete)" }}>
                  完了{p.completed}
                </span>
              )}
              {p.critical > 0 && (
                <span style={{ color: "var(--color-error)" }}>
                  危機{p.critical}
                </span>
              )}
              {p.tokutei_count > 0 && (
                <span style={{ color: "#8B5CF6" }}>
                  特定{p.tokutei_count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Level 1 : Prefecture Detail
   ══════════════════════════════════════════════════════════════ */

function PrefectureDetail({
  prefName,
  prefSummary,
  municipalities,
  onBack,
  onSelectCity,
}: {
  prefName: string;
  prefSummary: PrefectureSummary | undefined;
  municipalities: ProgressMunicipality[];
  onBack: () => void;
  onSelectCity: (city: string) => void;
}) {
  const [sortKey, setSortKey] = useState<"rate" | "city">("rate");
  const sorted = useMemo(() => {
    const arr = [...municipalities];
    if (sortKey === "rate") arr.sort((a, b) => a.overall_rate - b.overall_rate);
    else arr.sort((a, b) => a.city.localeCompare(b.city, "ja"));
    return arr;
  }, [municipalities, sortKey]);

  return (
    <>
      <button
        onClick={onBack}
        className="text-sm font-medium mb-2"
        style={{ color: "var(--color-brand-primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        ← 全国一覧に戻る
      </button>

      {/* Header */}
      <div className="card p-4">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--color-gov-primary, #002D72)" }}
        >
          {prefName}
        </h2>
        {prefSummary && (
          <div className="flex flex-wrap gap-4 mt-2 text-sm">
            <span>
              平均{" "}
              <strong style={{ color: rateColor(prefSummary.avg_rate) }}>
                {pct(prefSummary.avg_rate)}
              </strong>
            </span>
            <span>{prefSummary.count}団体</span>
            <span style={{ color: "var(--color-status-complete)" }}>
              完了 {prefSummary.completed}
            </span>
            <span style={{ color: "var(--color-error)" }}>
              危機 {prefSummary.critical}
            </span>
            {prefSummary.tokutei_count > 0 && (
              <span style={{ color: "#8B5CF6" }}>
                特定移行 {prefSummary.tokutei_count}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sort toggle */}
      <div className="flex gap-2">
        <FilterPill
          label="進捗率順"
          active={sortKey === "rate"}
          onClick={() => setSortKey("rate")}
        />
        <FilterPill
          label="名前順"
          active={sortKey === "city"}
          onClick={() => setSortKey("city")}
        />
      </div>

      {/* Municipality Table (desktop) */}
      <div className="card overflow-x-auto hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                borderBottom: "2px solid var(--color-border, #E2E8F0)",
              }}
            >
              <th className="text-left px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>自治体</th>
              <th className="text-right px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>進捗率</th>
              <th className="text-center px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>ステータス</th>
              <th className="text-center px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>人口帯</th>
              <th className="text-left px-3 py-2" style={{ color: "var(--color-text-secondary)" }}>ベンダー</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              const st = getStatus(m);
              return (
                <tr
                  key={m.city}
                  onClick={() => onSelectCity(m.city)}
                  className="hover:opacity-80 transition-opacity"
                  style={{
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border, #E2E8F0)",
                  }}
                >
                  <td className="px-3 py-2 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {m.city}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16">
                        <ProgressBar rate={m.overall_rate} />
                      </div>
                      <span
                        className="text-xs font-mono font-medium w-12 text-right"
                        style={{ color: rateColor(m.overall_rate) }}
                      >
                        {pct(m.overall_rate)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusBadge status={st} />
                  </td>
                  <td className="px-3 py-2 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {POP_LABELS[m.popBand] ?? m.popBand}
                  </td>
                  <td className="px-3 py-2 text-xs truncate max-w-[200px]" style={{ color: "var(--color-text-secondary)" }}>
                    {m.vendors.map((v) => v.name).join(", ") || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Municipality Cards (mobile) */}
      <div className="sm:hidden space-y-2">
        {sorted.map((m) => {
          const st = getStatus(m);
          return (
            <button
              key={m.city}
              onClick={() => onSelectCity(m.city)}
              className="card p-3 w-full text-left"
              style={{ cursor: "pointer" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {m.city}
                </span>
                <StatusBadge status={st} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ProgressBar rate={m.overall_rate} />
                </div>
                <span
                  className="text-xs font-mono font-medium"
                  style={{ color: rateColor(m.overall_rate) }}
                >
                  {pct(m.overall_rate)}
                </span>
              </div>
              <div className="flex gap-2 mt-1 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                <span>{POP_LABELS[m.popBand] ?? m.popBand}</span>
                {m.vendors.length > 0 && (
                  <span className="truncate">{m.vendors[0].name}{m.vendors.length > 1 ? ` 他${m.vendors.length - 1}社` : ""}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
          条件に一致する自治体はありません
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Level 2 : Municipality Detail
   ══════════════════════════════════════════════════════════════ */

function MunicipalityDetail({
  muni,
  nationalAvgs,
  siblings,
  onBack,
  onSelectCity,
}: {
  muni: ProgressMunicipality;
  nationalAvgs: Record<string, number>;
  siblings: ProgressMunicipality[];
  onBack: () => void;
  onSelectCity: (city: string) => void;
}) {
  const businessEntries = useMemo(() => {
    return Object.entries(muni.business_rates).sort(
      ([, a], [, b]) => (a ?? 0) - (b ?? 0)
    );
  }, [muni.business_rates]);

  const st = getStatus(muni);

  return (
    <>
      <button
        onClick={onBack}
        className="text-sm font-medium mb-2"
        style={{ color: "var(--color-brand-primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        ← {muni.prefecture}に戻る
      </button>

      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {muni.prefecture}
            </p>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--color-gov-primary, #002D72)" }}
            >
              {muni.city}
            </h2>
          </div>
          <div className="text-right">
            <div
              className="text-2xl font-bold"
              style={{ color: rateColor(muni.overall_rate) }}
            >
              {pct(muni.overall_rate)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <StatusBadge status={st} />
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--color-section-bg, #F0F0F0)",
              color: "var(--color-text-secondary)",
            }}
          >
            {POP_LABELS[muni.popBand] ?? muni.popBand}
          </span>
        </div>
      </div>

      {/* Vendor Summary */}
      {muni.vendors.length > 0 && (
        <div className="card p-4">
          <h3
            className="text-sm font-bold mb-3"
            style={{ color: "var(--color-gov-primary, #002D72)" }}
          >
            採用ベンダー
          </h3>
          <div className="flex flex-wrap gap-2">
            {muni.vendors.map((v) => (
              <span
                key={`${v.name}-${v.cloud}`}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "var(--color-section-bg, #F0F0F0)",
                  color: "var(--color-text-primary)",
                }}
              >
                {v.name}
                {v.cloud && (
                  <span
                    className="text-[10px] rounded px-1"
                    style={{
                      backgroundColor:
                        v.cloud === "AWS"
                          ? "#FF9900"
                          : v.cloud === "Azure"
                            ? "#0078D4"
                            : v.cloud === "OCI"
                              ? "#C74634"
                              : v.cloud === "GCP"
                                ? "#4285F4"
                                : "#888",
                      color: "#fff",
                    }}
                  >
                    {v.cloud}
                  </span>
                )}
                <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  ({v.businesses.length}業務)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 20 Business Table */}
      <div className="card p-4">
        <h3
          className="text-sm font-bold mb-3"
          style={{ color: "var(--color-gov-primary, #002D72)" }}
        >
          業務別進捗（{businessEntries.length}業務）
        </h3>
        <div className="space-y-1.5">
          {businessEntries.map(([biz, rate]) => {
            const natAvg = nationalAvgs[biz] ?? 0;
            const diff = (rate ?? 0) - natAvg;
            return (
              <div
                key={biz}
                className="flex items-center gap-2 py-1.5 px-2 rounded"
                style={{
                  borderBottom: "1px solid var(--color-border, #E2E8F0)",
                }}
              >
                <span
                  className="text-xs flex-shrink-0 w-28 sm:w-36 truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {biz}
                </span>
                <div className="flex-1 min-w-0">
                  <ProgressBar rate={rate ?? 0} />
                </div>
                <span
                  className="text-xs font-mono font-medium w-12 text-right flex-shrink-0"
                  style={{ color: rateColor(rate ?? 0) }}
                >
                  {pct(rate ?? 0)}
                </span>
                <span
                  className="text-[10px] font-mono w-14 text-right flex-shrink-0"
                  style={{
                    color:
                      diff >= 0
                        ? "var(--color-status-complete, #10B981)"
                        : "var(--color-error, #FF6B6B)",
                  }}
                >
                  {diff >= 0 ? "+" : ""}
                  {(diff * 100).toFixed(1)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-[10px] text-right" style={{ color: "var(--color-text-muted)" }}>
          右端の数値は全国平均との差（ポイント）
        </div>
      </div>

      {/* Sibling municipalities */}
      {siblings.length > 0 && (
        <div className="card p-4">
          <h3
            className="text-sm font-bold mb-2"
            style={{ color: "var(--color-gov-primary, #002D72)" }}
          >
            {muni.prefecture}の他の自治体
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {siblings.slice(0, 20).map((s) => (
              <button
                key={s.city}
                onClick={() => onSelectCity(s.city)}
                className="rounded-full px-2.5 py-1 text-xs"
                style={{
                  backgroundColor: "var(--color-section-bg, #F0F0F0)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border, #E2E8F0)",
                  cursor: "pointer",
                }}
              >
                {s.city}{" "}
                <span style={{ color: rateColor(s.overall_rate) }}>
                  {pct(s.overall_rate)}
                </span>
              </button>
            ))}
            {siblings.length > 20 && (
              <span className="text-xs px-2 py-1" style={{ color: "var(--color-text-muted)" }}>
                他{siblings.length - 20}件
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Client Component (with Suspense boundary for useSearchParams)
   ══════════════════════════════════════════════════════════════ */

function ProgressInner({ data }: { data: ProgressData }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramPref = searchParams.get("pref") ?? "";
  const paramCity = searchParams.get("city") ?? "";
  const paramStatus = searchParams.get("status") ?? "";
  const paramPop = searchParams.get("pop") ?? "";
  const paramQ = searchParams.get("q") ?? "";

  const [filterStatus, setFilterStatus] = useState(paramStatus);
  const [filterPop, setFilterPop] = useState(paramPop);
  const [filterQuery, setFilterQuery] = useState(paramQ);

  // Build national averages map
  const nationalAvgs = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of data.businesses) map[b.business] = b.avg_rate;
    return map;
  }, [data.businesses]);

  // Navigate helper
  const navigate = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
      }
      if (filterStatus) sp.set("status", filterStatus);
      if (filterPop) sp.set("pop", filterPop);
      if (filterQuery) sp.set("q", filterQuery);
      // override with explicit params
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
        else sp.delete(k);
      }
      const qs = sp.toString();
      router.push(`/progress${qs ? `?${qs}` : ""}`);
    },
    [router, filterStatus, filterPop, filterQuery]
  );

  // Filter municipalities
  const filtered = useMemo(() => {
    return data.municipalities.filter((m) => {
      if (filterStatus) {
        const st = getStatus(m);
        if (filterStatus === "tokutei" && !m.isTokutei) return false;
        if (filterStatus !== "tokutei" && st !== filterStatus) return false;
      }
      if (filterPop && m.popBand !== filterPop) return false;
      if (filterQuery) {
        const q = filterQuery.toLowerCase();
        if (
          !m.city.toLowerCase().includes(q) &&
          !m.prefecture.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [data.municipalities, filterStatus, filterPop, filterQuery]);

  // Determine level
  const level = paramCity ? 2 : paramPref ? 1 : 0;

  // Filter prefectures for Level 0
  const filteredPrefs = useMemo(() => {
    if (!filterStatus && !filterPop && !filterQuery) return data.prefectures;
    // re-compute from filtered municipalities
    const map = new Map<string, { count: number; sumRate: number; completed: number; critical: number; tokutei: number }>();
    for (const m of filtered) {
      const key = m.prefecture;
      if (!map.has(key))
        map.set(key, { count: 0, sumRate: 0, completed: 0, critical: 0, tokutei: 0 });
      const s = map.get(key)!;
      s.count++;
      s.sumRate += m.overall_rate;
      if (m.overall_rate >= 1.0) s.completed++;
      if (m.overall_rate < 0.4 && !m.isTokutei) s.critical++;
      if (m.isTokutei) s.tokutei++;
    }
    return Array.from(map.entries()).map(([pref, s]) => ({
      prefecture: pref,
      avg_rate: s.count > 0 ? s.sumRate / s.count : 0,
      count: s.count,
      completed: s.completed,
      critical: s.critical,
      tokutei_count: s.tokutei,
    }));
  }, [data.prefectures, filtered, filterStatus, filterPop, filterQuery]);

  // Level 1: municipalities in selected prefecture
  const prefMunis = useMemo(
    () => filtered.filter((m) => m.prefecture === paramPref),
    [filtered, paramPref]
  );
  const prefSummary = data.prefectures.find((p) => p.prefecture === paramPref);

  // Level 2: selected municipality
  const selectedMuni = paramCity
    ? data.municipalities.find(
        (m) => m.prefecture === paramPref && m.city === paramCity
      )
    : undefined;
  const siblings = useMemo(
    () =>
      data.municipalities
        .filter((m) => m.prefecture === paramPref && m.city !== paramCity)
        .sort((a, b) => a.overall_rate - b.overall_rate),
    [data.municipalities, paramPref, paramCity]
  );

  return (
    <div className="space-y-4">
      <FilterBar
        status={filterStatus}
        setStatus={setFilterStatus}
        pop={filterPop}
        setPop={setFilterPop}
        query={filterQuery}
        setQuery={setFilterQuery}
      />

      {/* Results count */}
      <div
        className="text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {filtered.length.toLocaleString()} / {data.municipalities.length.toLocaleString()}自治体
        {data.dataMonth && ` (${data.dataMonth}時点)`}
      </div>

      {level === 2 && selectedMuni ? (
        <MunicipalityDetail
          muni={selectedMuni}
          nationalAvgs={nationalAvgs}
          siblings={siblings}
          onBack={() => navigate({ pref: paramPref, city: "" })}
          onSelectCity={(city) => navigate({ pref: paramPref, city })}
        />
      ) : level === 1 ? (
        <PrefectureDetail
          prefName={paramPref}
          prefSummary={prefSummary}
          municipalities={prefMunis}
          onBack={() => navigate({ pref: "", city: "" })}
          onSelectCity={(city) => navigate({ pref: paramPref, city })}
        />
      ) : (
        <NationalOverview
          data={data}
          prefectures={filteredPrefs}
          onSelectPref={(pref) => navigate({ pref, city: "" })}
        />
      )}
    </div>
  );
}

export default function ProgressClient({ data }: { data: ProgressData }) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>読み込み中...</div>}>
      <ProgressInner data={data} />
    </Suspense>
  );
}
