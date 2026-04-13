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

type Props = { source?: string; mode?: "pdf" | "newsletter" };

export default function PdfLeadForm({ source = "finops", mode = "pdf" }: Props) {
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.includes("@") && orgType && agreed && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, organization_type: orgType, source }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "登録に失敗しました");
        return;
      }
      trackNewsletterSignup(source, orgType);
      setShowThanks(true);
    } catch {
      setError("処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  const isNewsletter = mode === "newsletter";

  if (showThanks) {
    return (
      <div className="text-center rounded-2xl p-8 bg-white">
        <div className="text-4xl mb-3">✉️</div>
        <p className="font-bold text-lg mb-2" style={{ color: "#00338D" }}>登録ありがとうございます</p>
        <p className="text-sm text-gray-600">
          {isNewsletter ? (
            <><strong className="text-gray-900">{email}</strong> 宛にウェルカムメールをお送りしました。</>
          ) : (
            <><strong className="text-gray-900">{email}</strong> 宛にPDFリンクをお送りしました。<br />
            <span className="text-xs text-gray-500">リンクの有効期限は48時間です。</span></>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
      <div className="px-6 pt-5 pb-2 text-center" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <p className="text-sm font-semibold" style={{ color: "#00338D" }}>
          {isNewsletter ? "📬 ニュースレターに登録（無料）" : "📄 無料PDFを受け取る"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">メールアドレスとご所属のみ・スパムなし・社内共有OK</p>
      </div>
      <div className="px-6 py-5 space-y-3">
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm outline-none text-gray-900"
          style={{ fontSize: 16, border: "1px solid #D1D5DB", backgroundColor: "#F9FAFB" }}
        />
        <select
          value={orgType}
          onChange={(e) => setOrgType(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm outline-none text-gray-700"
          style={{ fontSize: 16, border: "1px solid #D1D5DB", backgroundColor: "#F9FAFB" }}
        >
          <option value="">ご所属を選択してください</option>
          {ORG_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 shrink-0 accent-blue-600"
          />
          <span>{isNewsletter ? "ニュースレター配信に同意します。" : "レポートのダウンロードおよびメール配信に同意します。"}いつでも解除できます。</span>
        </label>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#00338D", color: "#FFFFFF" }}
        >
          {loading ? "準備中..." : isNewsletter ? "無料で登録する →" : "無料でPDFを受け取る →"}
        </button>
        <p className="text-xs text-center text-gray-400">
          ※ご入力情報は配信のみに使用します。第三者への提供はいたしません。
        </p>
      </div>
    </div>
  );
}
