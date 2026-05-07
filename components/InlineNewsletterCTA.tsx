"use client";

import { useState, useId, useEffect, useRef } from "react";
import { trackNewsletterSignup, trackCtaImpression, trackCtaClick } from "@/lib/gtag";
import { submitNewsletter } from "@/lib/newsletter";

interface Props {
  /**
   * GA4 計測用の source 識別子。
   * 例: `newsletter_article_mid_<slug>`
   */
  source: string;
}

/**
 * 記事本文中（H2 2つ目の直前）に挿入するインライン NL登録 CTA。
 * 控えめなボーダーカード + 既存 /api/leads 経由のフォーム送信。
 * IntersectionObserver で初回表示時に `cta_impression` を1回だけ発火。
 *
 * Phase 1: 単一 variant のみ。A/B variant ロジックは Phase 2 で実装予定。
 */
export default function InlineNewsletterCTA({ source }: Props) {
  const id = useId();
  const emailId = `inline-cta-email-${id}`;
  const errorId = `inline-cta-error-${id}`;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const impressionFiredRef = useRef(false);

  // IntersectionObserver で初回可視時に impression を1回だけ送信
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const target = containerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressionFiredRef.current) {
            impressionFiredRef.current = true;
            trackCtaImpression(source);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [source]);

  const canSubmit = email.includes("@") && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    trackCtaClick(source, "submit");
    setLoading(true);
    setError("");
    try {
      await submitNewsletter({ email, orgType: "", source });
      trackNewsletterSignup(source);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        ref={containerRef}
        className="rounded-xl px-5 py-5 my-6 print:hidden"
        style={{ backgroundColor: "#FFF5D1", border: "1px solid #E8D77A" }}
      >
        <p className="font-bold text-sm" style={{ color: "#7A5C00" }}>
          登録ありがとうございます！
        </p>
        <p className="text-xs mt-1" style={{ color: "#8B6F1A" }}>
          次回のニュースレターをお届けします。
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl px-5 py-5 my-6 print:hidden"
      style={{ backgroundColor: "#FFF5D1", border: "1px solid #E8D77A" }}
    >
      <p className="font-bold text-base leading-snug" style={{ color: "#1F2937" }}>
        📊 この記事の元データを毎週受け取る
      </p>
      <p className="text-sm leading-relaxed mt-2" style={{ color: "#4B5563" }}>
        総務省・デジタル庁公表データを GCInsight が要約して毎週お届け。3ヶ月で 51 自治体担当者が登録済み。
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-3 flex flex-col sm:flex-row gap-2"
        aria-label="ニュースレター登録フォーム（記事中）"
      >
        <label htmlFor={emailId} className="sr-only">
          メールアドレス
        </label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-required="true"
          aria-describedby={error ? errorId : undefined}
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ fontSize: 16, border: "1px solid #D6BE5C", backgroundColor: "#fff", color: "#111827" }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          style={{ backgroundColor: "#1E40AF", color: "#fff" }}
        >
          {loading ? "処理中..." : "無料で登録 →"}
        </button>
      </form>

      {error && (
        <p id={errorId} role="alert" aria-live="polite" className="mt-2 text-xs" style={{ color: "#B91C1C" }}>
          {error}
        </p>
      )}

      <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
        ※登録は無料・解約はワンクリック
      </p>
    </div>
  );
}
