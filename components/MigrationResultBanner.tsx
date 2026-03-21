"use client";

type MigrationResultBannerProps = {
  completionRate: number;      // e.g. 0.384
  totalSystems: number;        // e.g. 34592
  completedSystems: number;    // e.g. 13283
  delayedSystems: number;      // e.g. 8956
  delayedMunicipalities: number; // e.g. 935
  totalMunicipalities: number;   // e.g. 1741 (not used in the spec but useful)
  costMultiplier: number;        // e.g. 2.3
  dataMonth: string;             // e.g. "2026-01"
};

export default function MigrationResultBanner({
  completionRate,
  totalSystems,
  completedSystems,
  delayedSystems,
  delayedMunicipalities,
  totalMunicipalities,
  costMultiplier,
  dataMonth,
}: MigrationResultBannerProps) {
  const delayedPct = ((delayedSystems / totalSystems) * 100).toFixed(1);
  const delayedMuniPct = ((delayedMunicipalities / totalMunicipalities) * 100).toFixed(1);

  // Format dataMonth "2026-01" -> "2026年1月末"
  const [year, month] = dataMonth.split("-");
  const formattedMonth = `${year}年${parseInt(month)}月末`;

  const metrics = [
    {
      value: `${(completionRate * 100).toFixed(1)}%`,
      label: "完了率",
      sub: `(${completedSystems.toLocaleString()}/${totalSystems.toLocaleString()})`,
    },
    {
      value: `${delayedSystems.toLocaleString()}件`,
      label: "遅延システム",
      sub: `(全体の${delayedPct}%)`,
    },
    {
      value: `${delayedMunicipalities.toLocaleString()}団体`,
      label: "遅延自治体",
      sub: `(全体の${delayedMuniPct}%)`,
    },
    {
      value: `${costMultiplier}倍`,
      label: "コスト増",
      sub: "(中核市平均)",
    },
  ];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      }}
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-3">
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <h2 className="text-sm font-bold tracking-wide" style={{ color: "#93c5fd" }}>
          自治体標準化 最終移行結果（2026年3月）
        </h2>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px px-6 pb-5">
        {metrics.map((m) => (
          <div key={m.label} className="py-3 pr-4">
            <p
              className="tabular-nums font-black leading-none"
              style={{ fontSize: 28, color: "#ffffff" }}
            >
              {m.value}
            </p>
            <p className="text-xs font-semibold mt-2" style={{ color: "#94a3b8" }}>
              {m.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Source */}
      <div
        className="px-6 py-2.5 text-xs flex items-center gap-1.5"
        style={{ backgroundColor: "rgba(0,0,0,0.2)", color: "#64748b" }}
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        出典: 総務省・デジタル庁公表データ ({formattedMonth})
      </div>
    </div>
  );
}
