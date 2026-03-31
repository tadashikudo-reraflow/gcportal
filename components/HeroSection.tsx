"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Municipality = {
  prefecture: string;
  city: string;
};

type HeroProps = {
  remainingDays: number;
  deadline: string;
  totalMunicipalities: number;
  completeCount: number;
  tokuteiCount: number;
  dataMonth: string;
  municipalities?: Municipality[];
};

export default function HeroSection({
  remainingDays,
  deadline,
  totalMunicipalities,
  completeCount,
  tokuteiCount,
  dataMonth,
  municipalities = [],
}: HeroProps) {
  const [year, month] = dataMonth.split("-");
  const formattedMonth = `${year}年${parseInt(month)}月`;
  const completePct = ((completeCount / totalMunicipalities) * 100).toFixed(1);

  // --- 検索ボックス状態 ---
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(m: Municipality) {
    setShowSuggestions(false);
    router.push(`/municipalities/${encodeURIComponent(m.prefecture)}/${encodeURIComponent(m.city)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  }

  return (
    <section className="hero-section">
      <div className="hero-inner">
        {/* #4 データ出典 — eyebrow より目立つ位置に */}
        <p className="hero-eyebrow" style={{ marginBottom: "0.5rem" }}>
          <Link
            href="/sources"
            className="no-underline hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            {formattedMonth}時点 · 総務省・デジタル庁公表データ →
          </Link>
        </p>

        <h1 className="hero-headline">
          全国{totalMunicipalities.toLocaleString()}自治体の
          <br />
          <span className="hero-headline-accent">ガバクラ移行</span>を可視化
        </h1>

        <p className="hero-sub">
          全20業務完了はわずか
          <strong>
            {completeCount}団体（{completePct}%）
          </strong>
          。業務別・自治体別に進捗とリスクを追跡。
        </p>

        {/* #1 自治体名検索ボックス */}
        <div ref={containerRef} className="hero-search-wrap">
          <div className="relative flex items-center">
            <span
              className="absolute left-3.5 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
              aria-hidden
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => query.trim().length >= 1 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="自治体名を入力（例：千葉市、川崎市）"
              autoComplete="off"
              className="hero-search-input"
              aria-label="自治体名を検索"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
            />
          </div>

          {/* サジェストドロップダウン */}
          {showSuggestions && suggestions.length > 0 && (
            <ul
              className="hero-search-dropdown"
              role="listbox"
            >
              {suggestions.map((m) => (
                <li key={`${m.prefecture}-${m.city}`} role="option">
                  <button
                    className="hero-search-option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(m);
                    }}
                  >
                    <span className="hero-search-option-pref">{m.prefecture}</span>
                    <span className="hero-search-option-city">{m.city}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showSuggestions && query.trim().length >= 1 && suggestions.length === 0 && (
            <div className="hero-search-empty">
              一致する自治体が見つかりません
            </div>
          )}
        </div>

        {/* #6 CTA — プライマリ/セカンダリ視覚差 */}
        <div className="hero-cta-row">
          {/* プライマリ: filled, large */}
          <Link href="/finops#pdf" className="btn-cta-primary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            無料レポート（PDF）
          </Link>
          {/* セカンダリ: ghost/text */}
          <Link href="/articles" className="btn-ghost">
            コラム・解説を読む
          </Link>
        </div>
      </div>
    </section>
  );
}
