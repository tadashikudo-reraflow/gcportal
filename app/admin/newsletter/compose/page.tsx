"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

// ツールバーボタンのスタイル
const toolbarBtnStyle = (active = false): React.CSSProperties => ({
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: active ? "#e5e7eb" : "none",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: active ? "bold" : "normal",
  color: "#374151",
  padding: 0,
  flexShrink: 0,
});

function TiptapToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const handleLink = () => {
    const url = window.prompt("URLを入力してください", "https://");
    if (url && url !== "https://") {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const handleImage = () => {
    const url = window.prompt("画像URLを入力してください", "https://");
    if (url && url !== "https://") {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        paddingBottom: 8,
        borderBottom: "1px solid #e5e7eb",
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }}
        style={toolbarBtnStyle(editor.isActive("bold"))}
        title="太字"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }}
        style={toolbarBtnStyle(editor.isActive("italic"))}
        title="斜体"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }}
        style={toolbarBtnStyle(editor.isActive("heading", { level: 2 }))}
        title="見出し2"
      >
        H2
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }}
        style={toolbarBtnStyle(editor.isActive("heading", { level: 3 }))}
        title="見出し3"
      >
        H3
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}
        style={toolbarBtnStyle(editor.isActive("bulletList"))}
        title="箇条書き"
      >
        &#8226;&#8212;
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}
        style={toolbarBtnStyle(editor.isActive("orderedList"))}
        title="番号リスト"
      >
        1.
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); handleLink(); }}
        style={toolbarBtnStyle(editor.isActive("link"))}
        title="リンク挿入"
      >
        🔗
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); handleImage(); }}
        style={toolbarBtnStyle(false)}
        title="画像挿入"
      >
        🖼
      </button>
    </div>
  );
}

function ComposeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [subject, setSubject] = useState("");
  const [campaignId, setCampaignId] = useState<number | null>(
    editId ? parseInt(editId, 10) : null
  );
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendTarget, setSendTarget] = useState<"all" | "segment">("all");
  const [editorReady, setEditorReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const initialHtmlRef = useRef<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "本文を入力してください..." }),
    ],
    content: "",
    onCreate: () => setEditorReady(true),
  });

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
          if (found.body_html) {
            initialHtmlRef.current = found.body_html;
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // editorが準備できてからinitialHtmlをセット
  useEffect(() => {
    if (editorReady && editor && initialHtmlRef.current) {
      editor.commands.setContent(initialHtmlRef.current);
    }
  }, [editorReady, editor]);

  const getBodyHtml = () => editor?.getHTML() ?? "";

  const handleSave = async () => {
    if (!subject.trim()) {
      alert("件名を入力してください");
      return;
    }
    ensurePass();
    setSaving(true);
    setSaveMsg("");
    const bodyHtml = getBodyHtml();
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
    const html = getBodyHtml();
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = html;
      }
    }, 50);
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
            onClick={handlePreview}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              color: "#6b7280",
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            プレビュー
          </button>
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

      {/* 件名 input */}
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

      {/* TipTapツールバー */}
      <TiptapToolbar editor={editor} />

      {/* TipTapエディター本体 */}
      <style>{`
        .tiptap-editor .ProseMirror {
          min-height: 500px;
          outline: none;
          font-size: 16px;
          line-height: 1.8;
          color: #374151;
        }
        .tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .tiptap-editor .ProseMirror h2 {
          font-size: 22px;
          font-weight: 700;
          margin: 20px 0 8px;
          color: #111111;
        }
        .tiptap-editor .ProseMirror h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 16px 0 6px;
          color: #111111;
        }
        .tiptap-editor .ProseMirror a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap-editor .ProseMirror ul,
        .tiptap-editor .ProseMirror ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        .tiptap-editor .ProseMirror img {
          max-width: 100%;
          border-radius: 4px;
        }
        .tiptap-editor .ProseMirror strong {
          font-weight: 700;
        }
        .tiptap-editor .ProseMirror em {
          font-style: italic;
        }
      `}</style>
      <div className="tiptap-editor">
        <EditorContent editor={editor} />
      </div>

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
