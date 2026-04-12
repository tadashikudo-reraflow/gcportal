"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import NewsletterModal from "@/components/NewsletterModal";

function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/members";
  // オープンリダイレクト対策: 内部パス（/始まり）のみ許可
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/members";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/members/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    if (res.ok) {
      window.location.href = next;
    } else {
      const body = await res.json().catch(() => ({}));
      if (body.error === "not_found") {
        setErrorMsg("このメールアドレスはニュースレター登録者として確認できませんでした。");
      } else {
        setErrorMsg("エラーが発生しました。もう一度お試しください。");
      }
      setStatus("error");
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-surface)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* ロゴ */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#00338D" }}>GC Insight</span>
          </Link>
        </div>

        {/* カード */}
        <div style={{ backgroundColor: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "36px 32px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#00338D", marginBottom: 8 }}>
              会員限定レポート
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", marginBottom: 8 }}>
              メールアドレスで確認
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.6 }}>
              ニュースレターに登録済みのメールアドレスを入力してください。
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  fontSize: "0.9375rem",
                  border: `1px solid ${status === "error" ? "#fca5a5" : "#d1d5db"}`,
                  borderRadius: 8,
                  outline: "none",
                  boxSizing: "border-box",
                  backgroundColor: status === "error" ? "#fef2f2" : "#fff",
                }}
              />
            </div>

            {errorMsg && (
              <p style={{ fontSize: "0.8125rem", color: "#dc2626", marginBottom: 16, lineHeight: 1.5 }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                padding: "11px 0",
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "#fff",
                backgroundColor: status === "loading" ? "#6b8ec4" : "#00338D",
                border: "none",
                borderRadius: 8,
                cursor: status === "loading" ? "not-allowed" : "pointer",
              }}
            >
              {status === "loading" ? "確認中..." : "確認してレポートを見る"}
            </button>
          </form>

          <p style={{ fontSize: "0.8rem", color: "#9ca3af", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            未登録の方は{" "}
            <NewsletterModal
              label="こちらから無料登録"
              source="newsletter_members_login"
              buttonStyle={{
                background: "none",
                border: "none",
                padding: 0,
                color: "#00338D",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            />
          </p>
        </div>
      </div>
    </main>
  );
}

export default function MembersLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
