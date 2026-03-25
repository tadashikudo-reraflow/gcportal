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

  // 編集モード: 既存キャンペーンを取得
  useEffect(() => {
    if (!editId) return;
    const id = parseInt(editId, 10);
    if (isNaN(id)) return;

    ensurePass();

    fetch(`/api/newsletter/campaigns`, {
      headers: {
        Authorization: getAuth(),
      },
    })
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
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuth(),
          },
          body: JSON.stringify({ subject, body_html: bodyHtml }),
        });
        setSaveMsg("保存しました");
      } else {
        const res = await fetch("/api/newsletter/campaigns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: getAuth(),
          },
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
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuth(),
        },
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

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin/newsletter")}
          className="text-sm"
          style={{ color: "#6b7280" }}
        >
          &larr; 戻る
        </button>
        <h1
          className="text-xl font-bold"
          style={{ color: "#111827" }}
        >
          {campaignId ? "キャンペーン編集" : "新規キャンペーン作成"}
        </h1>
        {campaignId && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
          >
            下書き
          </span>
        )}
      </div>

      <div className="space-y-5">
        {/* 件名 */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
            件名 <span style={{ color: "#ef4444" }}>*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="例: ガバメントクラウド最新動向 2026年3月号"
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
            style={{ borderColor: "#d1d5db" }}
          />
        </div>

        {/* 本文 */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
            本文 (HTML)
          </label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            rows={16}
            placeholder={`<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2>タイトル</h2>
  <p>本文を入力してください。</p>
  <p><a href="https://gcinsight.jp">GCInsight を見る →</a></p>
</div>`}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-y font-mono"
            style={{ borderColor: "#d1d5db", minHeight: 280 }}
          />
          <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
            HTMLで記述してください。リンクは送信時に自動的にトラッキングURLに置換されます。
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePreview}
            disabled={!bodyHtml.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: "#d1d5db", color: "#374151" }}
          >
            プレビュー
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-bold"
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
            className="px-5 py-2 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: "#002D72" }}
          >
            {sending ? "送信中..." : "全員に送信"}
          </button>
          {saveMsg && (
            <span className="text-xs" style={{ color: "#16a34a" }}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* プレビューモーダル */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="rounded-xl overflow-hidden shadow-xl"
            style={{ width: 680, maxHeight: "85vh", backgroundColor: "#fff" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#e5e7eb" }}
            >
              <span className="text-sm font-bold" style={{ color: "#111827" }}>
                プレビュー
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="text-sm"
                style={{ color: "#6b7280" }}
              >
                閉じる
              </button>
            </div>
            <iframe
              ref={iframeRef}
              className="w-full"
              style={{ height: "calc(85vh - 48px)", border: "none" }}
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
          <div
            className="rounded-xl p-6 shadow-xl"
            style={{ width: 400, backgroundColor: "#fff" }}
          >
            <h3 className="text-base font-bold mb-3" style={{ color: "#111827" }}>
              全員に送信しますか?
            </h3>
            <p className="text-sm mb-5" style={{ color: "#6b7280" }}>
              件名:「{subject}」を全購読者に送信します。送信後は取り消せません。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "#d1d5db", color: "#374151" }}
              >
                キャンセル
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white"
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
