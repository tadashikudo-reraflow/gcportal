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

interface Props {
  label?: React.ReactNode;
  source?: string;
  buttonStyle?: React.CSSProperties;
  buttonClassName?: string;
}

export default function NewsletterModal({
  label = "ニュースレター登録",
  source = "newsletter_modal",
  buttonStyle,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false);
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
        body: JSON.stringify({ email, organization_type: orgType, source }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "登録に失敗しました");
        return;
      }
      setDone(true);
    } catch {
      setError("処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    // done状態はリセットしない（同セッション内で再度開いても「登録済み」を表示）
  }

  return (
    <>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={buttonStyle}
        className={buttonClassName}
      >
        {label}
      </button>

      {/* モーダルオーバーレイ */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="ニュースレター登録"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              maxWidth: 480,
              width: "100%",
              padding: "32px 28px",
              position: "relative",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
          >
            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={handleClose}
              style={{
                position: "absolute",
                top: 12,
                right: 14,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                lineHeight: 1,
                color: "#9ca3af",
                padding: "4px 6px",
              }}
              aria-label="閉じる"
            >
              ×
            </button>

            {done ? (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <p style={{ fontSize: "1.125rem", fontWeight: 800, color: "#00338D", marginBottom: 8 }}>
                  登録ありがとうございます
                </p>
                <p style={{ fontSize: "0.875rem", color: "#4b5563", lineHeight: 1.6 }}>
                  ウェルカムメールを送付しました。<br />
                  会員限定レポートへのリンクも含まれています。
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    marginTop: 20,
                    padding: "8px 24px",
                    backgroundColor: "#00338D",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  閉じる
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00338D", marginBottom: 6 }}>
                  無料ニュースレター
                </p>
                <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "#111827", marginBottom: 6 }}>
                  ガバクラ・自治体DXの最新動向を週1でお届け
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
                  自治体職員・ITベンダー・コンサル向け。登録特典として会員限定レポートをプレゼント。いつでも解除できます。
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input
                    type="email"
                    placeholder="メールアドレス"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9375rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      outline: "none",
                      boxSizing: "border-box",
                      color: "#111827",
                    }}
                  />
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontSize: "0.9375rem",
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      outline: "none",
                      color: orgType ? "#111827" : "#9ca3af",
                      backgroundColor: "#fff",
                    }}
                  >
                    <option value="">ご所属を選択</option>
                    {ORG_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    style={{
                      width: "100%",
                      padding: "11px 0",
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "#fff",
                      backgroundColor: canSubmit ? "#00338D" : "#9ca3af",
                      border: "none",
                      borderRadius: 8,
                      cursor: canSubmit ? "pointer" : "not-allowed",
                      transition: "background-color 0.15s",
                    }}
                  >
                    {loading ? "処理中..." : "無料で登録 →"}
                  </button>
                  {error && (
                    <p style={{ fontSize: "0.8125rem", color: "#dc2626" }}>{error}</p>
                  )}
                  <p style={{ fontSize: "0.75rem", color: "#9ca3af", textAlign: "center" }}>
                    登録情報はニュースレター配信のみに使用します。スパムなし。
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
