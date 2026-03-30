"use client";

import { useState } from "react";

const ORG_OPTIONS = [
  { value: "municipality", label: "自治体職員" },
  { value: "it_vendor", label: "IT企業・SIer" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "politician", label: "議員・議員事務所" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
];

type Props = { source?: string };

export default function PdfLeadForm({ source = "finops" }: Props) {
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
      setShowThanks(true);
    } catch {
      setError("処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (showThanks) {
    return (
      <div className="text-center rounded-2xl p-8" style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <div className="text-4xl mb-3">✉️</div>
        <p className="font-bold text-lg mb-2">登録ありがとうございます</p>
        <p className="text-sm" style={{ color: "#c8d8f0" }}>
          <strong style={{ color: "#fff" }}>{email}</strong> 宛にPDFリンクをお送りしました。<br />
          <span className="text-xs">リンクの有効期限は48時間です。</span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}>
      <p className="text-sm font-semibold text-center">メールアドレスとご所属のみ・スパムなし・社内共有OK</p>
      <input
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 rounded-lg outline-none text-gray-900"
        style={{ border: "1px solid rgba(255,255,255,0.3)" }}
      />
      <select
        value={orgType}
        onChange={(e) => setOrgType(e.target.value)}
        className="w-full px-4 py-3 rounded-lg outline-none text-gray-900"
      >
        <option value="">ご所属を選択してください</option>
        {ORG_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <label className="flex items-start gap-2 text-xs cursor-pointer" style={{ color: "#c8d8f0" }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 shrink-0"
        />
        <span>レポートのダウンロードおよびメール配信に同意します。いつでも解除できます。</span>
      </label>
      {error && <p className="text-red-300 text-sm">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full font-bold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: "#F5B500", color: "#00205F" }}
      >
        {loading ? "準備中..." : "📄 無料でPDFを受け取る"}
      </button>
      <p className="text-xs text-center" style={{ color: "#94b4d8" }}>
        ※ご入力情報はレポート配信のみに使用します。第三者への提供はいたしません。
      </p>
    </div>
  );
}
