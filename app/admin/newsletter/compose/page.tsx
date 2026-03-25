"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

function ComposeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [campaignId, setCampaignId] = useState<number | null>(
    editId ? parseInt(editId, 10) : null
  );
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendTarget, setSendTarget] = useState<"all" | "segment">("all");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getAuth = () => {
    const pass = sessionStorage.getItem("admin_pass") ?? "";
    return `Basic ${btoa(`:${pass}`)}`;
  };

  const ensurePass = () => {
    if (!sessionStorage.getItem("admin_pass")) {
      const p = window.prompt("管理者パスワード");
      if (p) sessionStorage.setItem("admin_pass", p);
    }
  };

  useEffect(() => {
    if (!editId) return;
    const id = parseInt(editId, 10);
    if (isNaN(id)) return;
    ensurePass();
    fetch(`/api/newsletter/campaigns`, { headers: { Authorization: getAuth() } })
      .then((r) => r.json())
      .then((list: Array<{ id: number; subject: string; body_html?: string }>) => {
        const found = list.find((c) => c.id === id);
        if (found) {
          setSubject(found.subject);
          if (found.body_html) setBodyHtml(found.body_html);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const handleSave = async () => {
    if (!subject.trim()) {
      alert("件名を入力してください");
      return;
    }
    ensurePass();
    setSaving(true);
    setSaveMsg("");
    try {
      if (campaignId) {
        await fetch(`/api/newsletter/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: getAuth() },
          body: JSON.stringify({ subject, body_html: bodyHtml }),
        });
        setSaveMsg("保存しました");
      } else {
        const res = await fetch("/api/newsletter/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: getAuth() },
          body: JSON.stringify({ subject, body_html: bodyHtml }),
        });
        const data = await res.json();
        if (data.id) {
          setCampaignId(data.id);
          router.replace(`/admin/newsletter/compose?id=${data.id}`);
        }
        setSaveMsg("下書きを保存しました");
      }
    } catch {
      setSaveMsg("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!campaignId) {
      alert("先に下書き保存してください");
      return;
    }
    setSending(true);
    setShowConfirm(false);
    try {
      const res = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: getAuth() },
        body: JSON.stringify({ campaign_id: campaignId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`送信完了。送信数: ${data.sent}件${data.failed > 0 ? `、失敗: ${data.failed}件` : ""}`);
        router.push("/admin/newsletter");
      } else {
        alert(`エラー: ${data.error}`);
      }
    } catch {
      alert("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = bodyHtml;
      }
    }, 50);
  };

  const insertHtml = (tag: string) => {
    const ta = document.getElementById("body-textarea") as HTMLTextAreaElement;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = bodyHtml.slice(start, end);
    let insert = "";
    if (tag === "b") insert = `<strong>${selected}</strong>`;
    else if (tag === "h2") insert = `<h2>${selected || "見出し"}</h2>`;
    else if (tag === "a") insert = `<a href="https://">${selected || "リンクテキスト"}</a>`;
    const newVal = bodyHtml.slice(0, start) + insert + bodyHtml.slice(end);
    setBodyHtml(newVal);
  };

  return (
    <div style={{ minHeight: "calc(100vh - 56px)" }}>

      {/* エディタ上部: 右にアクションボタン */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <button
          onClick={() => router.push("/admin/newsletter")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#6b7280",
            padding: 0,
          }}
        >
          &larr; 戻る
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveMsg && (
            <span style={{ fontSize: 13, color: "#6b7280" }}>{saveMsg}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "none",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              fontSize: 14,
              color: "#6b7280",
              padding: 0,
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? "保存中..." : "下書き保存"}
          </button>
          <button
            onClick={() => {
              if (!campaignId) {
                alert("先に下書き保存してください");
                return;
              }
              setShowConfirm(true);
            }}
            disabled={sending}
            style={{
              backgroundColor: "#111111",
              color: "#ffffff",
              border: "none",
              cursor: sending ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 8,
              opacity: sending ? 0.5 : 1,
            }}
          >
            {sending ? "送信中..." : "送信する"}
          </button>
        </div>
      </div>

      {/* 件名 input — 大きく、枠なし */}
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="件名..."
        style={{
          width: "100%",
          fontSize: 32,
          fontWeight: 700,
          border: "none",
          outline: "none",
          color: "#111111",
          marginBottom: 16,
          padding: 0,
          backgroundColor: "transparent",
        }}
      />

      {/* シンプルツールバー */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingBottom: 12,
          borderBottom: "1px solid #f3f4f6",
          marginBottom: 16,
        }}
      >
        {[
          { label: "B", tag: "b", title: "太字" },
          { label: "H2", tag: "h2", title: "見出し" },
          { label: "Link", tag: "a", title: "リンク" },
        ].map((btn) => (
          <button
            key={btn.tag}
            onClick={() => insertHtml(btn.tag)}
            title={btn.title}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#6b7280",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            {btn.label}
          </button>
        ))}
        <button
          onClick={handlePreview}
          disabled={!bodyHtml.trim()}
          style={{
            background: "none",
            border: "none",
            cursor: !bodyHtml.trim() ? "not-allowed" : "pointer",
            fontSize: 13,
            color: "#6b7280",
            padding: "4px 8px",
            borderRadius: 4,
            marginLeft: 8,
            opacity: !bodyHtml.trim() ? 0.4 : 1,
          }}
        >
          プレビュー
        </button>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#d1d5db" }}>HTML</span>
      </div>

      {/* 本文 textarea */}
      <textarea
        id="body-textarea"
        value={bodyHtml}
        onChange={(e) => setBodyHtml(e.target.value)}
        placeholder={`<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">\n  <h2>タイトル</h2>\n  <p>本文を入力してください。</p>\n  <p><a href="https://gcinsight.jp">GCInsight を見る →</a></p>\n</div>`}
        style={{
          width: "100%",
          minHeight: 500,
          border: "none",
          outline: "none",
          resize: "none",
          fontSize: 16,
          lineHeight: 1.8,
          color: "#374151",
          backgroundColor: "transparent",
          fontFamily: "ui-monospace, monospace",
          padding: 0,
        }}
      />

      <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 16 }}>
        HTMLで記述してください。リンクは送信時に自動的にトラッキングURLに置換されます。
      </p>

      {/* 送信先設定 */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #f3f4f6" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>送信先</p>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { value: "all", label: "全購読者" },
            { value: "segment", label: "セグメント" },
          ].map((opt) => (
            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 14 }}>
              <input
                type="radio"
                name="sendTarget"
                value={opt.value}
                checked={sendTarget === opt.value}
                onChange={() => setSendTarget(opt.value as "all" | "segment")}
              />
              <span style={{ color: "#374151" }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
          ステータス: {campaignId ? `下書き保存済み (ID: ${campaignId})` : "未保存"}
        </p>
      </div>

      {/* プレビューモーダル */}
      {showPreview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              width: 680,
              maxHeight: "85vh",
              backgroundColor: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "#111111" }}>
                プレビュー — {subject || "件名なし"}
              </span>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#6b7280",
                  padding: "4px 12px",
                }}
              >
                閉じる
              </button>
            </div>
            <iframe
              ref={iframeRef}
              style={{ width: "100%", height: "calc(85vh - 52px)", border: "none", display: "block" }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* 送信確認ダイアログ */}
      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ borderRadius: 12, padding: 28, width: 420, backgroundColor: "#fff" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111111", marginBottom: 8 }}>
              送信確認
            </h3>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
              件名:「{subject}」
            </p>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
              {sendTarget === "all" ? "全購読者" : "選択セグメント"}に送信します。送信後は取り消せません。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  background: "none",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#374151",
                  padding: "7px 16px",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSend}
                style={{
                  backgroundColor: "#111111",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "7px 20px",
                }}
              >
                送信する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, fontSize: 14, color: "#9ca3af" }}>読み込み中...</div>}>
      <ComposeForm />
    </Suspense>
  );
}
