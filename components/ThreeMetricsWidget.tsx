"use client";

type ThreeMetricsWidgetProps = {
  completeRate: number;
  systemRate: number;
  stepRate: number;
  completeCount: number;
  totalMunicipalities: number;
  completedSystems: number;
  totalSystems: number;
};

function DonutRing({
  pct,
  color,
  trackColor,
  size = 120,
  strokeWidth = 12,
}: {
  pct: number;
  color: string;
  trackColor: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* track */}
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      {/* fill */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

export default function ThreeMetricsWidget({
  completeRate,
  systemRate,
  stepRate,
  completeCount,
  totalMunicipalities,
  completedSystems,
  totalSystems,
}: ThreeMetricsWidgetProps) {
  const metrics = [
    {
      label: "完了率",
      description: "全20業務が完了した自治体の割合",
      badge: "真の完了",
      badgeColor: "#dc2626",
      badgeBg: "#fef2f2",
      pct: +(completeRate * 100).toFixed(1),
      color: "#dc2626",
      trackColor: "#fee2e2",
      note: `${completeCount} / ${totalMunicipalities.toLocaleString()} 団体`,
      sub: "GCInsight独自集計",
    },
    {
      label: "システム移行率",
      description: "ガバクラへの移行が完了したシステム数",
      badge: null,
      badgeColor: "#2563eb",
      badgeBg: null,
      pct: +(systemRate * 100).toFixed(1),
      color: "#2563eb",
      trackColor: "#dbeafe",
      note: `${completedSystems.toLocaleString()} / ${totalSystems.toLocaleString()} システム`,
      sub: "デジタル庁公表",
    },
    {
      label: "手続き進捗率",
      description: "移行手続きの全国平均進捗（完了≠稼働開始）",
      badge: "手続きが進んだだけ",
      badgeColor: "#9ca3af",
      badgeBg: "#f3f4f6",
      pct: +(stepRate * 100).toFixed(1),
      color: "#9ca3af",
      trackColor: "#f3f4f6",
      note: "総務省PMOツール",
      sub: "見かけの進捗に注意",
    },
  ];

  return (
    <div className="three-metrics-card">
      <div className="three-metrics-header">
        <h3 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          3つの指標を正しく読む
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
          手続きは進んでいるが完了していない——がガバクラ移行の現在地
        </p>
      </div>

      <div className="three-metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="three-metrics-item">
            <div className="flex flex-col items-center gap-3">
              {/* Donut */}
              <div className="relative">
                <DonutRing pct={m.pct} color={m.color} trackColor={m.trackColor} size={120} strokeWidth={12} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* #7 数字を超大型化 */}
                  <span
                    className="tabular-nums leading-none"
                    style={{
                      color: m.color,
                      fontSize: "2.25rem",
                      fontWeight: 800,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {m.pct}%
                  </span>
                </div>
              </div>

              {/* Label + badge + description */}
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <span className="text-sm font-semibold" style={{ color: m.color }}>{m.label}</span>
                  {m.badge && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ backgroundColor: m.badgeBg ?? "#f3f4f6", color: m.badgeColor }}
                    >
                      {m.badge}
                    </span>
                  )}
                </div>
                {/* #7 1行説明 */}
                <p
                  className="text-[11px] leading-snug px-1"
                  style={{ color: "var(--color-text-secondary)", maxWidth: "10rem" }}
                >
                  {m.description}
                </p>
                <p className="text-xs tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
                  {m.note}
                </p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  {m.sub}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
