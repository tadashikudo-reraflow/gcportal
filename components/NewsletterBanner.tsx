"use client";

import { useState, useEffect, useId } from "react";
import { trackNewsletterSignup } from "@/lib/gtag";
import {
  ORG_OPTIONS,
  submitNewsletter,
  HEADLINE_VARIANTS,
  getOrAssignVariant,
  type HeadlineVariant,
} from "@/lib/newsletter";

export default function NewsletterBanner({ source = "newsletter_homepage" }: { source?: string }) {
  const id = useId();
  const emailId = `email-${id}`;
  const orgId = `org-${id}`;
  const errorId = `error-${id}`;

  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [variant, setVariant] = useState<HeadlineVariant>("B"); // SSR-safe default

  useEffect(() => {
    setVariant(getOrAssignVariant());
  }, []);

  const { headline, sub } = HEADLINE_VARIANTS[variant];
  const canSubmit = email.includes("@") && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await submitNewsletter({ email, orgType, source });
      trackNewsletterSignup(source, orgType, variant);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl px-6 py-5 text-center" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <p className="font-bold text-base" style={{ color: "#1E40AF" }}>登録ありがとうございます！</p>
        <p className="text-sm mt-1" style={{ color: "#3B82F6" }}>次回のニュースレターをお届けします。</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
      <div className="px-6 pt-5 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#3B82F6" }}>
          無料ニュースレター — 毎週金曜配信
        </p>
        <p className="font-bold text-base leading-snug" style={{ color: "#1E3A5F" }}>
          {headline}
        </p>
        <p className="text-xs mt-1" style={{ color: "#4B6A8A" }}>
          {sub}自治体職員・SIer・コンサル向け。スパムなし。
        </p>
      </div>
      <form onSubmit={handleSubmit} className="px-6 pb-5 space-y-2" aria-label="ニュースレター登録フォーム">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex flex-col gap-1">
            <label htmlFor={emailId} className="sr-only">メールアドレス</label>
            <input
              id={emailId}
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              aria-describedby={error ? errorId : undefined}
              className="px-4 py-2.5 rounded-lg text-sm outline-none text-gray-900"
              style={{ fontSize: 15, border: "1px solid #BFDBFE", backgroundColor: "#fff" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={orgId} className="sr-only">ご所属（任意）</label>
            <select
              id={orgId}
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              aria-label="ご所属（任意）"
              className="sm:w-44 px-3 py-2.5 rounded-lg text-sm outline-none text-gray-700"
              style={{ fontSize: 15, border: "1px solid #BFDBFE", backgroundColor: "#fff" }}
            >
              <option value="">ご所属（任意）</option>
              {ORG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="sm:w-36 font-bold py-2.5 px-5 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ backgroundColor: "#1E40AF", color: "#fff" }}
          >
            {loading ? "処理中..." : "無料で登録 →"}
          </button>
        </div>
        {error && (
          <p id={errorId} role="alert" aria-live="polite" className="text-red-500 text-xs">
            {error}
          </p>
        )}
        <p className="text-xs" style={{ color: "#6B7280" }}>
          ※登録情報はニュースレター配信のみに使用します。スパムなし。
        </p>
      </form>
    </div>
  );
}
