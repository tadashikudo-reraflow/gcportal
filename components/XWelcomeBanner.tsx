"use client";

import { useEffect, useState } from "react";
import NewsletterModal from "./NewsletterModal";

const SESSION_KEY = "x-welcome-dismissed";

/** X（旧Twitter）経由の流入を検知し、1セッション1回だけウェルカムバナーを表示 */
export default function XWelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // セッション内で既に表示・却下済みならスキップ
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const ref = document.referrer;
    const isXReferral =
      ref.includes("t.co") ||
      ref.includes("x.com") ||
      ref.includes("twitter.com");

    if (isXReferral) {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setVisible(false);
  }

  useEffect(() => {
    if (!visible) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Xからの訪問者向け案内"
      className="w-full px-3 py-2.5 flex items-center justify-between gap-3 flex-wrap"
      style={{
        backgroundColor: "#0f1629",
        borderBottom: "1px solid #1d2951",
      }}
    >
      <p className="text-xs leading-snug flex-1 min-w-0" style={{ color: "#cbd5e1" }}>
        <span className="font-bold" style={{ color: "#fff" }}>Xからお越しの方へ</span>
        　毎週金曜にこのデータのポイントをまとめてお届けしています。
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <NewsletterModal
          label="無料で登録 →"
          source="newsletter_x_banner"
          buttonClassName="text-xs font-bold px-3 py-1.5 rounded-full"
          buttonStyle={{ backgroundColor: "#1d9bf0", color: "#fff", border: "none" }}
        />
        <button
          onClick={dismiss}
          aria-label="閉じる"
          className="text-xs opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
