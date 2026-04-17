"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

const ORG_OPTIONS = [
  { value: "hospital", label: "病院・クリニック職員" },
  { value: "medical_it", label: "医療IT・HIS企業" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "government", label: "行政・審議会関係者" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
];

export default function KarteArticleNewsletterBanner() {
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.includes("@") && orgType && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organization_type: orgType, source: "newsletter_karte_article" }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "登録に失敗しました");
        return;
      }
      setDone(true);
    } catch {
      setError("処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl px-5 py-4 text-center print:hidden"
        style={{ backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7" }}>
        <p className="font-bold text-sm" style={{ color: "#065F46" }}>登録ありがとうございます！</p>
        <p className="text-xs mt-1" style={{ color: "#059669" }}>次回のニュースレターをお届けします。</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden print:hidden"
      style={{ backgroundColor: "#ECFDF5", border: "1px solid #6EE7B7" }}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Mail size={15} style={{ color: "#059669" }} aria-hidden="true" />
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#059669" }}>
            無料ニュースレター
          </p>
        </div>
        <p className="font-bold text-sm leading-snug" style={{ color: "#065F46" }}>
          電子カルテ標準化・医療DXの最新情報を週1でお届け
        </p>
      </div>
      <form onSubmit={handleSubmit} className="px-5 pb-4 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ fontSize: 16, border: "1px solid #6EE7B7", backgroundColor: "#fff", color: "#111827" }}
          />
          <select
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            required
            className="sm:w-40 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ fontSize: 15, border: "1px solid #6EE7B7", backgroundColor: "#fff", color: "#374151" }}
          >
            <option value="">ご所属</option>
            {ORG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!canSubmit}
            className="sm:w-32 font-bold py-2 px-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ backgroundColor: "#065F46", color: "#fff" }}
          >
            {loading ? "処理中..." : "無料で登録 →"}
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <p className="text-xs" style={{ color: "#6B7280" }}>
          スパムなし。いつでも解除できます。
        </p>
      </form>
    </div>
  );
}
