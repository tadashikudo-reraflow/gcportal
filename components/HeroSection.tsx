"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type HeroProps = {
  completionRate: number; // 0-1
  remainingDays: number;
  deadline: string; // "2026-03-31"
  totalMunicipalities: number;
  completeCount: number;
  tokuteiCount: number;
  dataMonth: string; // "2026-01"
  /** 都道府県+市区町村名リスト（検索用） */
  municipalities: { prefecture: string; city: string }[];
};

export default function HeroSection({
  completionRate,
  remainingDays,
  deadline,
  totalMunicipalities,
  completeCount,
  tokuteiCount,
  dataMonth,
  municipalities,
}: HeroProps) {
  const pct = (completionRate * 100).toFixed(1);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format dataMonth
  const [year, month] = dataMonth.split("-");
  const formattedMonth = `${year}年${parseInt(month)}月`;

  // 検索候補
  const suggestions =
    query.trim().length >= 1
      ? municipalities
          .filter((m) => {
            const full = `${m.prefecture}${m.city}`;
            const q = query.trim();
            return full.includes(q) || m.city.includes(q) || m.prefecture.includes(q);
          })
          .slice(0, 8)
      : [];

  // 外部クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SVG プログレスリング（radius小さめ + strokeWidth細めで内側余白確保）
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - completionRate);

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

          {/* 巨大検索バー */}
          <div ref={containerRef} className="hero-search-container">
            <div className="hero-search-box">
              <svg
                width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="hero-search-icon"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => query.trim().length >= 1 && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (!showSuggestions || suggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                  } else if (e.key === "Enter" && activeIndex >= 0) {
                    e.preventDefault();
                    const m = suggestions[activeIndex];
                    window.location.href = `/prefectures/${encodeURIComponent(m.prefecture)}`;
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                    setActiveIndex(-1);
                  }
                }}
                placeholder="自治体名で検索（例: 千葉市、川崎市、北海道）"
                autoComplete="off"
                className="hero-search-input"
                aria-label="自治体名を入力して検索"
                aria-activedescendant={activeIndex >= 0 ? `hero-suggestion-${activeIndex}` : undefined}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setShowSuggestions(false); }}
                  className="hero-search-clear"
                  aria-label="クリア"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* オートコンプリート */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="hero-suggestions" role="listbox">
                {suggestions.map((m, i) => (
                  <li key={`${m.prefecture}-${m.city}-${i}`} role="option" id={`hero-suggestion-${i}`} aria-selected={i === activeIndex}>
                    <Link
                      href={`/prefectures/${encodeURIComponent(m.prefecture)}`}
                      className={`hero-suggestion-item ${i === activeIndex ? "hero-suggestion-active" : ""}`}
                      onClick={() => setShowSuggestions(false)}
                    >
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.prefecture}</span>
                      <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{m.city}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {showSuggestions && query.trim().length >= 1 && suggestions.length === 0 && (
              <div className="hero-suggestions-empty">一致する自治体が見つかりません</div>
            )}
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

        {/* 右: プログレスリング + カウントダウン */}
        <div className="hero-stats">
          {/* カウントダウン */}
          <div className="hero-countdown">
            <p className="hero-countdown-label">移行期限まで</p>
            <p className="hero-countdown-number">{remainingDays}</p>
            <p className="hero-countdown-unit">日</p>
            <p className="hero-countdown-deadline">{deadline}</p>
          </div>

          {/* プログレスリング */}
          <div className="hero-ring-container">
            <svg viewBox="0 0 128 128" className="hero-ring-svg">
              {/* 背景リング */}
              <circle
                cx="64" cy="64" r={radius}
                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"
              />
              {/* 進捗リング */}
              <circle
                cx="64" cy="64" r={radius}
                fill="none"
                stroke={completionRate >= 0.75 ? "#10B981" : completionRate >= 0.5 ? "#F59E0B" : "#EF4444"}
                strokeWidth="8"
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
            </div>
          </div>

          {/* ミニ KPI */}
          <div className="hero-mini-kpis">
            <div className="hero-mini-kpi">
              <span className="hero-mini-value" style={{ color: "#10B981" }}>{completeCount.toLocaleString()}</span>
              <span className="hero-mini-label">完了自治体</span>
            </div>
            <div className="hero-mini-kpi-divider" />
            <div className="hero-mini-kpi">
              <span className="hero-mini-value" style={{ color: "#64748B" }}>{tokuteiCount.toLocaleString()}</span>
              <span className="hero-mini-label">特定移行認定</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
