"use client";

import { useState, useId } from "react";
import { trackNewsletterSignup } from "@/lib/gtag";
import { Mail } from "lucide-react";
import { ORG_OPTIONS, submitNewsletter } from "@/lib/newsletter";

export default function ArticleNewsletterBanner() {
  const id = useId();
  const emailId = `email-${id}`;
  const orgId = `org-${id}`;
  const errorId = `error-${id}`;

  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.includes("@") && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      await submitNewsletter({ email, orgType, source: "newsletter_article" });
      trackNewsletterSignup("newsletter_article", orgType);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl px-5 py-4 text-center print:hidden"
        style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <p className="font-bold text-sm" style={{ color: "#1E40AF" }}>登録ありがとうございます！</p>
        <p className="text-xs mt-1" style={{ color: "#3B82F6" }}>次回のニュースレターをお届けします。</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden print:hidden"
      style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={15} style={{ color: "#3B82F6" }} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#3B82F6" }}>
            無料ニュースレター — 毎週金曜
          </p>
        </div>
        <p className="font-bold text-sm leading-snug" style={{ color: "#1E3A5F" }}>
          この記事の続報・関連データを見逃さない。週1・5分のガバクラ週報。
        </p>
      </div>
      <form onSubmit={handleSubmit} className="px-5 pb-4 space-y-2" aria-label="ニュースレター登録フォーム">
        <div className="flex flex-col sm:flex-row gap-2">
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
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ fontSize: 16, border: "1px solid #BFDBFE", backgroundColor: "#fff", color: "#111827" }}
          />
          <label htmlFor={orgId} className="sr-only">ご所属（任意）</label>
          <select
            id={orgId}
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            aria-label="ご所属（任意）"
            className="sm:w-40 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ fontSize: 15, border: "1px solid #BFDBFE", backgroundColor: "#fff", color: "#374151" }}
          >
            <option value="">ご所属（任意）</option>
            {ORG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!canSubmit}
            className="sm:w-32 font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
          スパムなし。いつでも解除できます。
        </p>
      </form>
    </div>
  );
}
