// Server Component — no "use client" needed, pure SVG
type HistoryPoint = { year: number; value: number | null };

interface Props {
  label: string;
  unit?: string;
  history: HistoryPoint[];
  thresholds: [number, number]; // [warn, danger]
  higherIsBetter?: boolean;    // true: 高い方が良い（財政力指数）/ false(default): 低い方が良い
}

function getColor(value: number, thresholds: [number, number], higherIsBetter: boolean): string {
  const [warn, danger] = thresholds;
  if (higherIsBetter) {
    return value >= danger ? "#378445" : value >= warn ? "#1D4ED8" : "#d97706";
  }
  return value >= danger ? "#b91c1c" : value >= warn ? "#d97706" : "#378445";
}

export default function FiscalSparkline({ label, unit = "%", history, thresholds, higherIsBetter = false }: Props) {
  const valid = history.filter(p => p.value !== null) as { year: number; value: number }[];
  if (valid.length < 2) return null;

  const latest = valid[valid.length - 1];
  const earliest = valid[0];
  const color = getColor(latest.value, thresholds, higherIsBetter);

  // Trend arrow
  const delta = latest.value - earliest.value;
  const trendGood = higherIsBetter ? delta > 0 : delta < 0;
  const trendBad  = higherIsBetter ? delta < 0 : delta > 0;
  const trendColor = trendGood ? "#378445" : trendBad ? "#b91c1c" : "#9ca3af";
  const trendArrow = Math.abs(delta) < 0.05 ? "→" : (delta > 0 ? "↑" : "↓");

  // SVG sparkline path
  const W = 120, H = 36, PAD = 3;
  const values = history.map(p => p.value ?? null);
  const nonNull = values.filter((v): v is number => v !== null);
  const min = Math.min(...nonNull);
  const max = Math.max(...nonNull);
  const range = max - min || 1;

  const points = history.map((p, i) => {
    if (p.value === null) return null;
    const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((p.value - min) / range) * (H - PAD * 2);
    return { x, y };
  });

  const pathParts: string[] = [];
  let started = false;
  for (const pt of points) {
    if (!pt) { started = false; continue; }
    pathParts.push(started ? `L${pt.x.toFixed(1)},${pt.y.toFixed(1)}` : `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
    started = true;
  }
  const d = pathParts.join(" ");

  // Last point for dot
  const lastPt = points.filter(Boolean).pop()!;

  const displayValue = unit === "index"
    ? latest.value.toFixed(2)
    : latest.value.toFixed(1) + "%";

  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] text-gray-400">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="font-bold tabular-nums text-sm" style={{ color }}>{displayValue}</span>
        <span className="text-[10px] font-medium" style={{ color: trendColor }}>{trendArrow}</span>
      </dd>
      <svg width={W} height={H} className="overflow-visible">
        <path d={d} fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        {lastPt && (
          <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={color} />
        )}
      </svg>
      <div className="flex justify-between text-[9px] text-gray-300" style={{ width: W }}>
        {history.map(p => <span key={p.year}>{String(p.year).slice(2)}</span>)}
      </div>
    </div>
  );
}
