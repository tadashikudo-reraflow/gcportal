"use client";

import Link from "next/link";

type HeroProps = {
  completionRate: number; // 0-1
  remainingDays: number;
  deadline: string; // "2026-03-31"
  totalMunicipalities: number;
  completeCount: number;
  tokuteiCount: number;
  dataMonth: string; // "2026-01"
};

export default function HeroSection({
  completionRate,
  remainingDays,
  deadline,
  totalMunicipalities,
  completeCount,
  tokuteiCount,
  dataMonth,
}: HeroProps) {
  const pct = (completionRate * 100).toFixed(1);

  // Format dataMonth
  const [year, month] = dataMonth.split("-");
  const formattedMonth = `${year}年${parseInt(month)}月`;

  // SVG プログレスリング
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - completionRate);

  const statsContent = (
    <>
      {/* カウントダウン */}
      <div className="hero-countdown">
        <p className="hero-countdown-label">移行期限まで</p>
        <div className="hero-countdown-value-row" aria-label={`あと${remainingDays}日`}>
          <span className="hero-countdown-number">{remainingDays}</span>
          <span className="hero-countdown-unit">日</span>
        </div>
        <p className="hero-countdown-deadline">{deadline}</p>
      </div>

      {/* プログレスリング */}
      <div className="hero-ring-container">
        <svg viewBox="0 0 128 128" className="hero-ring-svg">
          <circle
            cx="64" cy="64" r={radius}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7"
          />
          <circle
            cx="64" cy="64" r={radius}
            fill="none"
            stroke={completionRate >= 0.75 ? "#10B981" : completionRate >= 0.5 ? "#F59E0B" : "#EF4444"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 64 64)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="hero-ring-text">
          <span className="hero-ring-pct">{pct}%</span>
          <span className="hero-ring-label">全国平均完了率</span>
          <span className="hero-ring-sublabel">各自治体の平均</span>
        </div>
      </div>

      {/* ミニ KPI（％リングとは別指標の件数） */}
      <div className="hero-mini-kpis">
        <div className="hero-mini-kpi">
          <span className="hero-mini-value-row">
            <span className="hero-mini-value" style={{ color: "#10B981" }}>{completeCount.toLocaleString()}</span>
            <span className="hero-mini-suffix">件</span>
          </span>
          <span className="hero-mini-label">100%達成の自治体</span>
          <span className="hero-mini-hint">特定移行は除く</span>
        </div>
        <div className="hero-mini-kpi-divider" aria-hidden />
        <div className="hero-mini-kpi">
          <span className="hero-mini-value-row">
            <span className="hero-mini-value" style={{ color: "#64748B" }}>{tokuteiCount.toLocaleString()}</span>
            <span className="hero-mini-suffix">件</span>
          </span>
          <span className="hero-mini-label">特定移行認定</span>
          <span className="hero-mini-hint">認定団体数（公式）</span>
        </div>
      </div>

      <p className="hero-stats-footnote">
        中央の％は、対象となる全自治体の業務完了率を単純平均した値です（特定移行の自治体も平均の母集団に含みます）。左の件数は特定移行以外で100%達成の自治体数、右は特定移行の認定団体数（公式集計）で、いずれも％とは別指標です。
      </p>
    </>
  );

  return (
    <section className="hero-section">
      <div className="hero-inner">
        {/* 左: メインコンテンツ */}
        <div className="hero-content">
          <p className="hero-eyebrow">
            出典: 総務省・デジタル庁公表データ（{formattedMonth}時点）
          </p>
          <h2 className="hero-headline">
            全国{totalMunicipalities.toLocaleString()}自治体の
            <br className="hidden sm:inline" />
            <span className="hero-headline-accent">「現在地」と「遅延リスク」</span>を可視化
          </h2>
          <p className="hero-sub">
            業務別・自治体別にガバメントクラウド移行の進捗を追跡。
          </p>

          {/* スタッツ: モバイルではCTAの上に表示 */}
          <div className="hero-stats hero-stats-mobile">
            {statsContent}
          </div>

          {/* CTA ボタン群 */}
          <div className="hero-cta-row">
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

        {/* 右: デスクトップではサイドに表示 */}
        <div className="hero-stats hero-stats-desktop">
          {statsContent}
        </div>
      </div>
    </section>
  );
}
