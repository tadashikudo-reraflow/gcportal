"use client";

import { useState } from "react";
import { trackNewsletterSignup } from "@/lib/gtag";

const ORG_OPTIONS = [
  { value: "municipality", label: "自治体職員" },
  { value: "it_vendor", label: "IT企業・SIer" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "politician", label: "議員・議員事務所" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
];

export default function NewsletterBanner() {
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
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organization_type: orgType, source: "newsletter_homepage" }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "登録に失敗しました");
        return;
      }
      trackNewsletterSignup("newsletter_homepage", orgType);
      setDone(true);
    } catch {
      setError("処理に失敗しました。もう一度お試しください。");
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
          デジタル庁の移行データが更新されたら即お知らせ。自治体DX実務ダイジェスト。
        </p>
        <p className="text-xs mt-1" style={{ color: "#4B6A8A" }}>
          自治体職員・SIer担当者・コンサルが読む週1まとめ。スパムなし、いつでも解除可。
        </p>
      </div>
      <form onSubmit={handleSubmit} className="px-6 pb-5 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none text-gray-900"
            style={{ fontSize: 15, border: "1px solid #BFDBFE", backgroundColor: "#fff" }}
          />
          <select
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className="sm:w-44 px-3 py-2.5 rounded-lg text-sm outline-none text-gray-700"
            style={{ fontSize: 15, border: "1px solid #BFDBFE", backgroundColor: "#fff" }}
          >
            <option value="">ご所属（任意）</option>
            {ORG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!canSubmit}
            className="sm:w-36 font-bold py-2.5 px-5 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ backgroundColor: "#1E40AF", color: "#fff" }}
          >
            {loading ? "処理中..." : "無料で登録 →"}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <p className="text-xs" style={{ color: "#6B7280" }}>
          ※登録情報はニュースレター配信のみに使用します。スパムなし。
        </p>
      </form>
    </div>
  );
}
