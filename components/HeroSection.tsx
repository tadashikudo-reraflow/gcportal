"use client";

import Link from "next/link";

type HeroProps = {
  remainingDays: number;
  deadline: string; // "2026-03-31"
  totalMunicipalities: number;
  completeCount: number;
  tokuteiCount: number;
  dataMonth: string; // "2026-01"
};

export default function HeroSection({
  remainingDays,
  deadline,
  totalMunicipalities,
  completeCount,
  tokuteiCount,
  dataMonth,
}: HeroProps) {
  const [year, month] = dataMonth.split("-");
  const formattedMonth = `${year}年${parseInt(month)}月`;

  const completePct = ((completeCount / totalMunicipalities) * 100).toFixed(1);
  const inProgressCount = totalMunicipalities - completeCount - tokuteiCount;

  // SVG ring
  const completeRate = completeCount / totalMunicipalities;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - completeRate);

  return (
    <section className="hero-section">
      <div className="hero-inner hero-inner--centered">
        {/* 上部テキスト */}
        <p className="hero-eyebrow">
          出典: 総務省・デジタル庁公表データ（{formattedMonth}時点）
        </p>
        <h2 className="hero-headline" style={{ textAlign: "center" }}>
          全国{totalMunicipalities.toLocaleString()}自治体の
          <br />
          <span className="hero-headline-accent">「現在地」と「遅延リスク」</span>を可視化
        </h2>
        <p className="hero-sub" style={{ textAlign: "center" }}>
          業務別・自治体別にガバメントクラウド移行の進捗を追跡。
        </p>

        {/* 中央: 大きなリング */}
        <div className="hero-ring-container hero-ring--large">
          <svg viewBox="0 0 200 200" className="hero-ring-svg">
            <circle
              cx="100" cy="100" r={radius}
              fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"
            />
            <circle
              cx="100" cy="100" r={radius}
              fill="none"
              stroke="#EF4444"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="hero-ring-text hero-ring-text--large">
            <span className="hero-ring-number">{completeCount}</span>
            <span className="hero-ring-denom">/ {totalMunicipalities.toLocaleString()}</span>
            <span className="hero-ring-desc">移行完了（{completePct}%）</span>
          </div>
        </div>

        {/* リング下: 3KPI横並び */}
        <div className="hero-three-kpis">
          <div className="hero-kpi-card">
            <span className="hero-kpi-value" style={{ color: "#EF4444" }}>{remainingDays}</span>
            <span className="hero-kpi-unit">日</span>
            <span className="hero-kpi-label">移行期限まで</span>
            <span className="hero-kpi-hint">{deadline}</span>
          </div>
          <div className="hero-kpi-divider" aria-hidden />
          <div className="hero-kpi-card">
            <span className="hero-kpi-value" style={{ color: "#F59E0B" }}>{inProgressCount.toLocaleString()}</span>
            <span className="hero-kpi-unit">件</span>
            <span className="hero-kpi-label">移行中</span>
            <span className="hero-kpi-hint">期限内だが未完了</span>
          </div>
          <div className="hero-kpi-divider" aria-hidden />
          <div className="hero-kpi-card">
            <span className="hero-kpi-value" style={{ color: "#64748B" }}>{tokuteiCount.toLocaleString()}</span>
            <span className="hero-kpi-unit">件</span>
            <span className="hero-kpi-label">特定移行認定</span>
            <span className="hero-kpi-hint">期限延長（最大5年）</span>
          </div>
        </div>

        <p className="hero-stats-footnote" style={{ textAlign: "center", maxWidth: "32rem", margin: "0 auto" }}>
          「移行完了」は全20業務の移行ステップが完了した自治体数（特定移行認定団体を除く）。出典: 総務省進捗管理データ（{formattedMonth}末時点）
        </p>

        {/* CTA */}
        <div className="hero-cta-row" style={{ justifyContent: "center" }}>
          <Link href="/report" className="btn-cta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            無料レポート（PDF）
          </Link>
          <Link href="/articles" className="btn-outline">
            コラム・解説を読む
          </Link>
        </div>
      </div>
    </section>
  );
}
