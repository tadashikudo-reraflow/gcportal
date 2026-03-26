/**
 * ThreeMetricsWidget — 3つの完了率を比較表示
 *
 * 「手続きは進んでいるが完了していない」ことを視覚的に伝えるウィジェット。
 */

type ThreeMetricsWidgetProps = {
  completeRate: number;
  systemRate: number;
  stepRate: number;
  completeCount: number;
  totalMunicipalities: number;
  completedSystems: number;
  totalSystems: number;
};

export default function ThreeMetricsWidget({
  completeRate,
  systemRate,
  stepRate,
  completeCount,
  totalMunicipalities,
  completedSystems,
  totalSystems,
}: ThreeMetricsWidgetProps) {
  const completePct = (completeRate * 100).toFixed(1);
  const systemPct = (systemRate * 100).toFixed(1);
  const stepPct = (stepRate * 100).toFixed(1);

  return (
    <div className="card p-0 overflow-hidden">
      {/* ヘッダー */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          3つの指標を正しく読む
        </h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          手続きは進んでいるが完了していない——がガバクラ移行の現在地
        </p>
      </div>

      {/* 指標3行 */}
      <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
        {/* 全業務完了率 — 最重要 */}
        <div className="px-5 py-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium" style={{ color: "#991b1b" }}>全業務完了率</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                真の完了
              </span>
            </div>
            <span className="text-xl font-extrabold tabular-nums" style={{ color: "#dc2626" }}>
              {completePct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#fee2e2" }}>
            <div className="h-full rounded-full" style={{ width: `${completePct}%`, backgroundColor: "#dc2626" }} />
          </div>
          <p className="text-[10px] mt-1.5 tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            {completeCount} / {totalMunicipalities.toLocaleString()} 団体 · GCInsight独自集計
          </p>
        </div>

        {/* システム移行率 */}
        <div className="px-5 py-4">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: "#1d4ed8" }}>システム移行率</span>
            <span className="text-xl font-extrabold tabular-nums" style={{ color: "#2563eb" }}>
              {systemPct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#dbeafe" }}>
            <div className="h-full rounded-full" style={{ width: `${systemPct}%`, backgroundColor: "#2563eb" }} />
          </div>
          <p className="text-[10px] mt-1.5 tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            {completedSystems.toLocaleString()} / {totalSystems.toLocaleString()} システム · 2026年1月末 · デジタル庁公表
          </p>
        </div>

        {/* 手続き進捗率 — 見かけの数字 */}
        <div className="px-5 py-4">
          <div className="flex items-baseline justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium" style={{ color: "#6b7280" }}>手続き進捗率</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                手続きが進んだだけ
              </span>
            </div>
            <span className="text-xl font-extrabold tabular-nums" style={{ color: "#6b7280" }}>
              {stepPct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "#f3f4f6" }}>
            <div className="h-full rounded-full" style={{ width: `${stepPct}%`, backgroundColor: "#9ca3af" }} />
          </div>
          <p className="text-[10px] mt-1.5 tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            2026年1月末時点 · 総務省PMOツール
          </p>
        </div>
      </div>
    </div>
  );
}
