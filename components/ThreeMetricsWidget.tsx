/**
 * ThreeMetricsWidget — 3つの完了率を横並びプログレスバーで比較表示
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

type BarRow = {
  label: string;
  rate: number;
  color: string;
  bgColor: string;
  annotation: string;
  annotationColor: string;
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
  const rows: BarRow[] = [
    {
      label: "全業務完了率",
      rate: completeRate,
      color: "#ef4444",
      bgColor: "rgba(239,68,68,0.15)",
      annotation: "← 真の完了",
      annotationColor: "#ef4444",
    },
    {
      label: "システム移行率",
      rate: systemRate,
      color: "#3b82f6",
      bgColor: "rgba(59,130,246,0.15)",
      annotation: `${completedSystems.toLocaleString()} / ${totalSystems.toLocaleString()} システム`,
      annotationColor: "#93c5fd",
    },
    {
      label: "手続き進捗率",
      rate: stepRate,
      color: "#6b7280",
      bgColor: "rgba(107,114,128,0.2)",
      annotation: "手続きが進んだだけ",
      annotationColor: "#9ca3af",
    },
  ];

  return (
    <div
      className="rounded-2xl px-6 py-5 w-full"
      style={{ backgroundColor: "#0f172a" }}
    >
      <h3 className="text-white font-bold text-sm mb-4">
        3つの指標を正しく読む
      </h3>

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const pct = (row.rate * 100).toFixed(1);
          return (
            <div key={row.label} className="flex items-center gap-3">
              {/* ラベル + パーセンテージ */}
              <div className="shrink-0 w-36 sm:w-40">
                <span className="text-xs text-slate-300">{row.label}</span>
                <span
                  className="text-sm font-semibold ml-1.5"
                  style={{ color: row.color }}
                >
                  {pct}%
                </span>
              </div>

              {/* プログレスバー */}
              <div
                className="flex-1 h-3 rounded-full overflow-hidden"
                style={{ backgroundColor: row.bgColor }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>

              {/* 右端アノテーション */}
              <span
                className="shrink-0 text-xs whitespace-nowrap hidden sm:inline"
                style={{ color: row.annotationColor }}
              >
                {row.annotation}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-slate-500 text-xs mt-4 leading-relaxed">
        手続きは進んでいるが完了していない——がガバクラ移行の現在地です
      </p>
    </div>
  );
}
