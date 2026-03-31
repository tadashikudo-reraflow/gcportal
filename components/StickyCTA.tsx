"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import standardizationData from "@/public/data/standardization.json";

type Municipality = {
  prefecture: string;
  city: string;
};

// standardization.json の municipalities 配列を型安全に取得
const ALL_MUNICIPALITIES: Municipality[] = (
  (standardizationData as { municipalities?: Municipality[] }).municipalities ?? []
);

export default function StickyCTA() {
  const municipalities = ALL_MUNICIPALITIES;
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // スクロール30%超でフェードイン
  useEffect(() => {
    function handleScroll() {
      const scrollPct =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setVisible(scrollPct > 0.3);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // コンテナ外クリックでドロップダウンを閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions =
    query.trim().length >= 1
      ? municipalities
          .filter((m) => {
            const full = `${m.prefecture}${m.city}`;
            const q = query.trim();
            return full.includes(q) || m.city.includes(q) || m.prefecture.includes(q);
          })
          .slice(0, 6)
      : [];

  function handleSelect(m: Municipality) {
    setShowSuggestions(false);
    setQuery("");
    router.push(
      `/municipalities/${encodeURIComponent(m.prefecture)}/${encodeURIComponent(m.city)}`
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && suggestions.length > 0) {
      handleSelect(suggestions[0]);
    }
  }

  return (
    <div
      aria-hidden={!visible}
      className="hidden sm:block"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderTop: "1px solid var(--color-border)",
          boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
          padding: "10px 16px",
        }}
      >
        <div
          className="max-w-2xl mx-auto flex items-center gap-3"
          ref={containerRef}
        >
          {/* 検索ボックス */}
          <div className="relative flex-1">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
              aria-hidden
            >
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => query.trim().length >= 1 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="自治体を検索"
              autoComplete="off"
              style={{
                width: "100%",
                minHeight: 44,
                paddingLeft: "2.25rem",
                paddingRight: "0.75rem",
                paddingTop: "0.5rem",
                paddingBottom: "0.5rem",
                borderRadius: 8,
                border: "1.5px solid var(--color-border)",
                fontSize: "16px", /* iOS Safariズーム防止 */
                outline: "none",
                color: "var(--color-text-primary)",
                backgroundColor: "#fff",
              }}
              aria-label="自治体名を検索"
            />

            {/* ドロップダウン（上方向に開く） */}
            {showSuggestions && suggestions.length > 0 && (
              <ul
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  backgroundColor: "#fff",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
                  overflow: "hidden",
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                }}
                role="listbox"
              >
                {suggestions.map((m) => (
                  <li key={`${m.prefecture}-${m.city}`} role="option">
                    <button
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        fontSize: "16px", /* iOS Safariズーム防止 */
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--color-text-primary)",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(m);
                      }}
                    >
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                        {m.prefecture}
                      </span>
                      <span style={{ fontWeight: 600 }}>{m.city}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 無料レポートボタン */}
          <Link
            href="/finops#pdf"
            className="no-underline flex-shrink-0"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              padding: "0 16px",
              backgroundColor: "#00338D",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.8125rem",
              borderRadius: 8,
              whiteSpace: "nowrap",
            }}
          >
            無料レポート
          </Link>
        </div>
      </div>
    </div>
  );
}
