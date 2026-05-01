"use client";

import { STATUS_COLORS } from "@/lib/statusColor";

type ThreeMetricsWidgetProps = {
  completeRate: number;
  systemRate: number;
  stepRate: number;
  completeCount: number;
  totalMunicipalities: number;
  completedSystems: number;
  totalSystems: number;
};

function MetricBar({
  pct,
  color,
  trackColor,
}: {
  pct: number;
  color: string;
  trackColor: string;
}) {
  return (
    <div
      style={{
        height: 4,
        borderRadius: 9999,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 9999,
        }}
      />
    </div>
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
      badge: "真の完了",
      badgeBg: STATUS_COLORS.critical.light,
      badgeColor: STATUS_COLORS.critical.bg,
      pct: +(completeRate * 100).toFixed(1),
      color: STATUS_COLORS.complete.bg,
      trackColor: STATUS_COLORS.complete.light,
      fraction: `${completeCount.toLocaleString()} / ${totalMunicipalities.toLocaleString()} 団体`,
      source: "GCInsight独自集計",
      description: "全20業務が完了した自治体",
    },
    {
      label: "システム移行率",
      badge: null as string | null,
      badgeBg: undefined as string | undefined,
      badgeColor: undefined as string | undefined,
      pct: +(systemRate * 100).toFixed(1),
      color: STATUS_COLORS.ontrack.bg,
      trackColor: STATUS_COLORS.ontrack.light,
      fraction: `${completedSystems.toLocaleString()} / ${totalSystems.toLocaleString()} システム`,
      source: "デジタル庁公表",
      description: "ガバクラへの移行が完了したシステム数",
    },
    {
      label: "手続き進捗率",
      badge: "完了≠稼働開始",
      badgeBg: "#f3f4f6",
      badgeColor: "#9CA3AF",
      pct: +(stepRate * 100).toFixed(1),
      color: "#9CA3AF",
      trackColor: "#f3f4f6",
      fraction: "全国平均",
      source: "総務省PMOツール",
      description: "手続きが進んだだけで稼働開始ではない",
    },
  ];

  return (
    <div className="card p-5 lg:p-7">
      <div className="mb-5">
        <h3
          className="text-base lg:text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          3つの指標を正しく読む
        </h3>
        <p
          className="text-xs lg:text-sm mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          手続きは進んでいるが完了していない——がガバクラ移行の現在地
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 sm:divide-x divide-[var(--color-border)]">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="sm:px-4 first:pl-0 last:pr-0 flex flex-col gap-3"
          >
            {/* 大型数値 */}
            <div>
              <span
                className="tabular-nums leading-none"
                style={{
                  fontSize: "3.5rem",
                  fontWeight: 800,
                  color: m.color,
                  letterSpacing: "-0.03em",
                  display: "inline-block",
                }}
              >
                {m.pct}
                <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>%</span>
              </span>
            </div>

            {/* ラベル + バッジ */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-semibold"
                style={{ color: m.color }}
              >
                {m.label}
              </span>
              {m.badge && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-medium"
                  style={{
                    backgroundColor: m.badgeBg,
                    color: m.badgeColor,
                  }}
                >
                  {m.badge}
                </span>
              )}
            </div>

            {/* 横バー */}
            <MetricBar
              pct={m.pct}
              color={m.color}
              trackColor={m.trackColor}
            />

            {/* 分数 + 説明 + 出典 */}
            <div>
              <p
                className="text-sm tabular-nums font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {m.fraction}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {m.description}
              </p>
              <p
                className="text-xs mt-0.5 font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                出典: {m.source}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
