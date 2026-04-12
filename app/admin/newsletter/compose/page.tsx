"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";

/**
 * ニュースレター Compose ページ
 *
 * 設計方針:
 * - 生成された table-based メールHTMLを壊さないよう iframe をメイン表示にする
 * - TipTap は廃止。編集が必要なら生のHTMLをtextareaで直接編集
 * - 3つのビュー: preview（デフォルト）/ html（HTMLソース編集）
 */

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
  const [view, setView] = useState<"preview" | "html">("preview");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendTarget, setSendTarget] = useState<"all" | "segment">("all");
  const [mobilePreview, setMobilePreview] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [scheduling, setScheduling] = useState(false);
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

  // キャンペーンデータ取得
  useEffect(() => {
    if (!editId) return;
    const id = parseInt(editId, 10);
    if (isNaN(id)) return;
    ensurePass();
    fetch(`/api/newsletter/campaigns/${id}`, {
      headers: { Authorization: getAuth() },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: { id: number; subject: string; body_html?: string; scheduled_at?: string }) => {
        if (data && !("error" in data)) {
          setSubject(data.subject);
          setBodyHtml(data.body_html ?? "");
          if (data.scheduled_at) {
            // datetime-local input用にUTC→ローカル変換
            const local = new Date(data.scheduled_at);
            const pad = (n: number) => String(n).padStart(2, "0");
            setScheduledAt(`${local.getFullYear()}-${pad(local.getMonth()+1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`);
          }
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // iframeにHTMLを注入 + コンテンツ高さに合わせて自動リサイズ
  useEffect(() => {
    if (view === "preview" && iframeRef.current && bodyHtml) {
      const iframe = iframeRef.current;
      iframe.srcdoc = bodyHtml;
      const onLoad = () => {
        try {
          const h = iframe.contentDocument?.documentElement?.scrollHeight;
          if (h && h > 0) iframe.style.height = `${h + 32}px`;
        } catch { /* cross-origin等は無視 */ }
      };
      iframe.addEventListener("load", onLoad);
      return () => iframe.removeEventListener("load", onLoad);
    }
  }, [view, bodyHtml]);

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
        const res = await fetch(`/api/newsletter/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: getAuth() },
          credentials: "include",
          body: JSON.stringify({ subject, body_html: bodyHtml }),
        });
        if (res.ok) setSaveMsg("保存しました");
        else setSaveMsg("保存に失敗しました");
      } else {
        const res = await fetch("/api/newsletter/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: getAuth() },
          credentials: "include",
          body: JSON.stringify({ subject, body_html: bodyHtml }),
        });
        const data = await res.json();
        if (data.id) {
          setCampaignId(data.id);
          router.replace(`/admin/newsletter/compose?id=${data.id}`);
          setSaveMsg("下書きを保存しました");
        }
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
        credentials: "include",
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

  const handleSchedule = async () => {
    if (!campaignId) { alert("先に下書き保存してください"); return; }
    if (!scheduledAt) { alert("送信日時を入力してください"); return; }
    const scheduledAtISO = new Date(scheduledAt).toISOString();
    setScheduling(true);
    try {
      const res = await fetch(`/api/newsletter/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: getAuth() },
        credentials: "include",
        body: JSON.stringify({ scheduled_at: scheduledAtISO, status: "scheduled" }),
      });
      if (res.ok) {
        setSaveMsg(`予約完了: ${new Date(scheduledAt).toLocaleString("ja-JP")}`);
      } else {
        const d = await res.json();
        alert(`予約に失敗しました: ${d.error}`);
      }
    } catch {
      alert("予約に失敗しました");
    } finally {
      setScheduling(false);
    }
  };

  const previewWidth = mobilePreview ? 390 : "100%";

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column" }}>

      {/* トップバー */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        gap: 12,
        flexWrap: "wrap",
      }}>
        <button
          onClick={() => router.push("/admin/newsletter")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#6b7280", padding: 0 }}
        >
          &larr; 戻る
        </button>

        {/* ビュー切替タブ */}
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["preview", "html"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "5px 14px",
                fontSize: 13,
                fontWeight: view === v ? 600 : 400,
                background: view === v ? "#ffffff" : "none",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                color: view === v ? "#111111" : "#6b7280",
                boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {v === "preview" ? "プレビュー" : "HTMLソース"}
            </button>
          ))}
        </div>

        {/* 右側アクション */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveMsg && <span style={{ fontSize: 13, color: "#6b7280" }}>{saveMsg}</span>}
          {view === "preview" && (
            <button
              onClick={() => setMobilePreview(!mobilePreview)}
              title={mobilePreview ? "デスクトップ表示" : "モバイル表示"}
              style={{
                background: mobilePreview ? "#f3f4f6" : "none",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 13,
                color: "#6b7280",
                padding: "4px 10px",
              }}
            >
              {mobilePreview ? "SP" : "PC"}
            </button>
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
          {/* 予約送信 */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{
                fontSize: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "5px 8px",
                color: "#374151",
              }}
            />
            <button
              onClick={handleSchedule}
              disabled={scheduling || !scheduledAt}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#ffffff",
                border: "none",
                cursor: (scheduling || !scheduledAt) ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 14px",
                borderRadius: 8,
                opacity: (scheduling || !scheduledAt) ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {scheduling ? "予約中..." : "予約送信"}
            </button>
          </div>
          <button
            onClick={() => {
              if (!campaignId) { alert("先に下書き保存してください"); return; }
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
            {sending ? "送信中..." : "今すぐ送信"}
          </button>
        </div>
      </div>

      {/* 件名 */}
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="件名..."
        style={{
          width: "100%",
          fontSize: 24,
          fontWeight: 700,
          border: "none",
          borderBottom: "1px solid #e5e7eb",
          outline: "none",
          color: "#111111",
          marginBottom: 20,
          padding: "0 0 12px 0",
          backgroundColor: "transparent",
          boxSizing: "border-box",
        }}
      />

      {/* メインコンテンツ */}
      {view === "preview" ? (
        <div style={{
          flex: 1,
          background: "#f1f5f9",
          borderRadius: 10,
          padding: "24px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: 600,
          overflow: "auto",
        }}>
          {bodyHtml ? (
            <iframe
              ref={iframeRef}
              style={{
                width: previewWidth,
                maxWidth: 640,
                height: 900, // onLoadで自動上書きされる
                border: "none",
                borderRadius: 8,
                boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
                background: "#ffffff",
                display: "block",
                transition: "width 0.2s",
              }}
              sandbox="allow-same-origin"
            />
          ) : (
            <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 40 }}>
              HTMLがありません。Claude に生成させるか、HTMLソースタブで直接入力してください。
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            HTMLを直接編集できます。変更後は「下書き保存」を押してください。
          </div>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            style={{
              flex: 1,
              minHeight: 600,
              fontFamily: "'SF Mono', Consolas, monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: "#1e293b",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: 16,
              outline: "none",
              resize: "vertical",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* 送信先設定 */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f3f4f6" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>送信先</p>
        <div style={{ display: "flex", gap: 16 }}>
          {[{ value: "all", label: "全購読者" }, { value: "segment", label: "セグメント" }].map((opt) => (
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
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
          ステータス: {campaignId ? `下書き保存済み (ID: ${campaignId})` : "未保存"}
        </p>
      </div>

      {/* 送信確認ダイアログ */}
      {showConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}>
          <div style={{ borderRadius: 12, padding: 28, width: 420, backgroundColor: "#fff" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111111", marginBottom: 8 }}>送信確認</h3>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>件名:「{subject}」</p>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
              {sendTarget === "all" ? "全購読者" : "選択セグメント"}に送信します。送信後は取り消せません。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "#374151", padding: "7px 16px" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSend}
                style={{ backgroundColor: "#111111", color: "#ffffff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "7px 20px" }}
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
