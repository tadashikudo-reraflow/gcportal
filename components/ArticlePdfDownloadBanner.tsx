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

type Props = {
  articleTitle: string;
  slug: string;
};

export default function ArticlePdfDownloadBanner({ articleTitle, slug }: Props) {
  const [open, setOpen] = useState(false);
  const [orgType, setOrgType] = useState("municipality");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          organization_type: orgType,
          source: `article_pdf:${slug}`,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "エラーが発生しました");
        setLoading(false);
        return;
      }
      setOpen(false);
      setSubmitted(true);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-lg border px-5 py-4 flex items-center gap-3"
        style={{ borderColor: "#6ee7b7", backgroundColor: "#ecfdf5" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <p className="text-sm font-semibold" style={{ color: "#065f46" }}>
          PDFリンクをメールでお送りしました。メールをご確認ください。
        </p>
      </div>
    );
  }

  return (
    <>
      {/* バナー */}
      <div
        className="print:hidden rounded-lg border px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
        style={{
          borderColor: "var(--color-brand-primary, #1a365d)",
          backgroundColor: "rgba(26, 54, 93, 0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded text-white flex-shrink-0"
            style={{ backgroundColor: "var(--color-brand-primary, #1a365d)" }}
          >
            PDFダウンロード
          </span>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            この記事の中身をPDFで保存・印刷・配布できます。
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full flex-shrink-0 transition-opacity hover:opacity-85"
          style={{ backgroundColor: "#f59e0b", color: "#fff" }}
        >
          記事をダウンロードする
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* モーダル */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                記事PDFをダウンロード
              </h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                ご所属とメールアドレスをご入力ください。無料でダウンロードできます。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  ご所属
                </label>
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ fontSize: 16, borderColor: "#d1d5db", color: "var(--color-text-primary)" }}
                >
                  {ORG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  メールアドレス
                </label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ fontSize: 16, borderColor: "#d1d5db", color: "var(--color-text-primary)" }}
                />
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  GCInsightの最新レポートをお届けすることがあります。
                </p>
              </div>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border rounded-lg py-2 text-sm font-medium"
                  style={{ borderColor: "#d1d5db", color: "var(--color-text-secondary)" }}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg py-2 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-brand-primary, #1a365d)" }}
                >
                  {loading ? "処理中..." : "PDFをダウンロード"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
