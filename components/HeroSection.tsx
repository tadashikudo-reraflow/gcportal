"use client";

import Link from "next/link";

type HeroProps = {
  remainingDays: number;
  deadline: string;
  totalMunicipalities: number;
  completeCount: number;
  tokuteiCount: number;
  dataMonth: string;
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

  return (
    <section className="hero-section">
      <div className="hero-inner">
        <p className="hero-eyebrow">
          {formattedMonth}時点 · 総務省・デジタル庁公表データ
        </p>
        <h1 className="hero-headline">
          全国{totalMunicipalities.toLocaleString()}自治体の<br />
          <span className="hero-headline-accent">ガバクラ移行</span>を可視化
        </h1>
        <p className="hero-sub">
          全20業務完了はわずか<strong>{completeCount}団体（{completePct}%）</strong>。
          業務別・自治体別に進捗とリスクを追跡。
        </p>
        <div className="hero-cta-row">
          <Link href="/finops#pdf" className="btn-cta">
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
