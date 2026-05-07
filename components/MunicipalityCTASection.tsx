"use client";

import { useState, useId, useEffect, useRef } from "react";
import Link from "next/link";
import {
  trackNewsletterSignup,
  trackCtaImpression,
  trackCtaClick,
  trackMunicipalityLinkClick,
} from "@/lib/gtag";
import { submitNewsletter } from "@/lib/newsletter";

interface Props {
  /**
   * GA4 計測用 source 識別子。
   * 例: `newsletter_article_municipality_<slug>`
   */
  source: string;
}

/**
 * 記事末（既存 ArticleNewsletterBanner の直前）に挿入する自治体担当者向け CTA セクション。
 * 二択: ① ニュースレター登録（既存 /api/leads 経由）/ ② /progress へのリンク。
 * IntersectionObserver で初回表示時に `cta_impression` を1回だけ発火。
 */
export default function MunicipalityCTASection({ source }: Props) {
  const id = useId();
  const emailId = `municipality-cta-email-${id}`;
  const errorId = `municipality-cta-error-${id}`;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const impressionFiredRef = useRef(false);

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
      // 自治体向けセクション経由は organization_type=municipality を初期値として送信
      await submitNewsletter({ email, orgType: "municipality", source });
      trackNewsletterSignup(source, "municipality");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function handleProgressClick() {
    trackCtaClick(source, "view_municipality");
    trackMunicipalityLinkClick(source);
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl px-6 py-6 print:hidden"
      style={{ backgroundColor: "#F8FAFF", border: "1px solid #C7D7F0" }}
    >
      <p
        className="text-xs font-bold uppercase tracking-wide"
        style={{ color: "#1E40AF" }}
      >
        自治体IT担当者の方へ
      </p>
      <p className="font-bold text-base leading-snug mt-2" style={{ color: "#1E3A5F" }}>
        移行進捗ダッシュボード — 1,788団体・34,592システムの最新データを毎日更新
      </p>
      <p className="text-sm leading-relaxed mt-2" style={{ color: "#4B5563" }}>
        GCInsight は自治体担当者向けに特化した移行進捗ダッシュボードを無料で公開しています。週1メールで最新動向を、または自治体ページで詳細データを確認できます。
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {/* ① ニュースレター登録（既存 /api/leads 経由） */}
        <div>
          {done ? (
            <div
              className="rounded-lg px-4 py-3 h-full flex flex-col justify-center"
              style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
            >
              <p className="text-sm font-bold" style={{ color: "#1E40AF" }}>
                登録ありがとうございます！
              </p>
              <p className="text-xs mt-1" style={{ color: "#3B82F6" }}>
                次回のニュースレターをお届けします。
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-2"
              aria-label="ニュースレター登録フォーム（自治体向け）"
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
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ fontSize: 16, border: "1px solid #BFDBFE", backgroundColor: "#fff", color: "#111827" }}
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#1E40AF", color: "#fff" }}
              >
                {loading ? "処理中..." : "ニュースレターで毎週受け取る →"}
              </button>
              {error && (
                <p id={errorId} role="alert" aria-live="polite" className="text-xs" style={{ color: "#B91C1C" }}>
                  {error}
                </p>
              )}
            </form>
          )}
        </div>

        {/* ② /progress リンク */}
        <Link
          href="/progress"
          onClick={handleProgressClick}
          className="rounded-lg px-4 py-3 text-center font-bold text-sm transition-all hover:opacity-90 flex items-center justify-center"
          style={{
            backgroundColor: "#fff",
            color: "#1E40AF",
            border: "1.5px solid #1E40AF",
            minHeight: 44,
          }}
        >
          あなたの自治体ページを見る →
        </Link>
      </div>
    </div>
  );
}
