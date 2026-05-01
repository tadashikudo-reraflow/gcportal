"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Mail } from "lucide-react";
import NewsletterModal from "./NewsletterModal";

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
  // remainingDays/deadline/tokuteiCount は将来の再利用のため型定義に残す
  remainingDays: _remainingDays,
  deadline: _deadline,
  totalMunicipalities,
  completeCount: _completeCount,
  tokuteiCount: _tokuteiCount,
  dataMonth,
  municipalities = [],
}: HeroProps) {
  const [year, month] = dataMonth.split("-");
  const formattedMonth = `${year}年${parseInt(month)}月`;

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
          <span className="hero-headline-accent">ガバメントクラウド移行</span>
          <br />
          全国{totalMunicipalities.toLocaleString()}自治体の進捗ダッシュボード
        </h1>

        {/* #1 自治体名検索ボックス */}
        <div ref={containerRef} className="hero-search-wrap" style={{ marginTop: "1.5rem" }}>
          <div className="relative flex items-center">
            <span
              className="absolute left-3.5 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
              aria-hidden
            >
              <Search size={18} />
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
          {/* プライマリ: ニュースレター登録 */}
          <NewsletterModal
            label={<><Mail size={16} aria-hidden="true" style={{ marginRight: 6 }} />ニュースレターに登録（無料）</>}
            source="newsletter_hero"
            buttonClassName="btn-cta-primary w-full sm:w-auto"
          />
          {/* セカンダリ: ghost/text（モバイルはBottomNavから遷移できるため非表示） */}
          <span className="hidden sm:inline-flex">
            <Link href="/articles" className="btn-ghost">
              コラム・解説を読む
            </Link>
          </span>
        </div>
      </div>
    </section>
  );
}
