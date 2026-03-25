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

  // テキストエリアへのHTML挿入ヘルパー
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
    else if (tag === "img") insert = `<img src="https://" alt="" style="max-width:100%" />`;
    const newVal = bodyHtml.slice(0, start) + insert + bodyHtml.slice(end);
    setBodyHtml(newVal);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f7f7" }}>
      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* ヘッダー */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/admin/newsletter")}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white"
            style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
          >
            &larr; 戻る
          </button>
          <h1 className="text-xl font-extrabold" style={{ color: "#111827" }}>
            {campaignId ? "キャンペーン編集" : "新規キャンペーン作成"}
          </h1>
          {campaignId && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
            >
              下書き
            </span>
          )}
        </div>

        {/* メインレイアウト: エディタ + サイドパネル */}
        <div className="flex gap-6 items-start">

          {/* エディタ本体 */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* 件名 */}
            <div className="rounded-2xl bg-white px-6 py-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="件名を入力..."
                className="w-full text-2xl font-bold outline-none placeholder-gray-300"
                style={{ color: "#111827", border: "none" }}
              />
            </div>

            {/* ツールバー */}
            <div
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              {[
                { label: "B", tag: "b", title: "太字" },
                { label: "H2", tag: "h2", title: "見出し" },
                { label: "Link", tag: "a", title: "リンク" },
                { label: "Img", tag: "img", title: "画像" },
              ].map((btn) => (
                <button
                  key={btn.tag}
                  onClick={() => insertHtml(btn.tag)}
                  title={btn.title}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-gray-100"
                  style={{ color: "#374151" }}
                >
                  {btn.label}
                </button>
              ))}
              <span className="ml-auto text-xs" style={{ color: "#9ca3af" }}>
                HTML
              </span>
            </div>

            {/* 本文エリア */}
            <div className="rounded-2xl bg-white" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
              <textarea
                id="body-textarea"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder={`<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">\n  <h2>タイトル</h2>\n  <p>本文を入力してください。</p>\n  <p><a href="https://gcinsight.jp">GCInsight を見る →</a></p>\n</div>`}
                className="w-full px-6 py-5 outline-none resize-none font-mono text-sm rounded-2xl"
                style={{
                  border: "none",
                  minHeight: 420,
                  color: "#374151",
                  lineHeight: 1.7,
                }}
              />
              <p className="px-6 pb-4 text-xs" style={{ color: "#9ca3af" }}>
                HTMLで記述してください。リンクは送信時に自動的にトラッキングURLに置換されます。
              </p>
            </div>

            {/* アクションボタン */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handlePreview}
                disabled={!bodyHtml.trim()}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors hover:bg-white disabled:opacity-40"
                style={{ borderColor: "#e5e7eb", color: "#374151" }}
              >
                プレビュー
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-colors hover:bg-gray-200 disabled:opacity-50"
                style={{ backgroundColor: "#e5e7eb", color: "#374151" }}
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
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#002D72" }}
              >
                {sending ? "送信中..." : "送信する"}
              </button>
              {saveMsg && (
                <span className="text-xs" style={{ color: "#16a34a" }}>
                  {saveMsg}
                </span>
              )}
            </div>
          </div>

          {/* 右: 送信設定パネル */}
          <div
            className="w-56 flex-shrink-0 rounded-2xl bg-white p-5 space-y-5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <div>
              <p className="text-xs font-bold mb-3" style={{ color: "#374151" }}>
                送信設定
              </p>

              {/* 送信先 */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium" style={{ color: "#6b7280" }}>送信先</p>
                {[
                  { value: "all", label: "全購読者" },
                  { value: "segment", label: "セグメント" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sendTarget"
                      value={opt.value}
                      checked={sendTarget === opt.value}
                      onChange={() => setSendTarget(opt.value as "all" | "segment")}
                      className="accent-blue-900"
                    />
                    <span className="text-sm" style={{ color: "#374151" }}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* スケジュール（表示のみ） */}
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#6b7280" }}>スケジュール</p>
              <div
                className="text-xs px-3 py-2 rounded-lg border"
                style={{ borderColor: "#e5e7eb", color: "#9ca3af" }}
              >
                即時送信
              </div>
              <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>スケジュール配信は今後対応予定</p>
            </div>

            {/* ステータス */}
            <div
              className="rounded-xl p-3 text-xs space-y-1"
              style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}
            >
              <p className="font-medium" style={{ color: "#374151" }}>ステータス</p>
              <p>{campaignId ? "下書き保存済み" : "未保存"}</p>
              {campaignId && (
                <p className="font-mono text-xs" style={{ color: "#9ca3af" }}>
                  ID: {campaignId}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* プレビューモーダル */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 680, maxHeight: "85vh", backgroundColor: "#fff" }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#e5e7eb" }}>
              <span className="text-sm font-bold" style={{ color: "#111827" }}>
                プレビュー — {subject || "件名なし"}
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50"
                style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
              >
                閉じる
              </button>
            </div>
            <iframe
              ref={iframeRef}
              className="w-full"
              style={{ height: "calc(85vh - 52px)", border: "none" }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* 送信確認ダイアログ */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="rounded-2xl p-7 shadow-2xl" style={{ width: 420, backgroundColor: "#fff" }}>
            <h3 className="text-base font-bold mb-2" style={{ color: "#111827" }}>
              送信確認
            </h3>
            <p className="text-sm mb-1" style={{ color: "#6b7280" }}>
              件名:「{subject}」
            </p>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
              {sendTarget === "all" ? "全購読者" : "選択セグメント"}に送信します。送信後は取り消せません。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm border hover:bg-gray-50"
                style={{ borderColor: "#e5e7eb", color: "#374151" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSend}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white hover:opacity-90"
                style={{ backgroundColor: "#002D72" }}
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
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">読み込み中...</div>}>
      <ComposeForm />
    </Suspense>
  );
}
