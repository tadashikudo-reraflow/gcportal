"use client";

import { useEffect, useState } from "react";

type DisclosureRequest = {
  id: string;
  topic: string;
  category: string;
  municipality: string | null;
  email: string | null;
  organization_type: string | null;
  status: string;
  submitted_at: string | null;
  disclosed_at: string | null;
  result_url: string | null;
  result_title: string | null;
  result_summary: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  received:  { label: "受付済",   color: "#374151", bg: "#F3F4F6" },
  reviewing: { label: "審査中",   color: "#D97706", bg: "#FEF3C7" },
  submitted: { label: "提出済",   color: "#2563EB", bg: "#DBEAFE" },
  disclosed: { label: "開示済",   color: "var(--color-success)", bg: "var(--color-success-bg)" },
  rejected:  { label: "不開示",   color: "#DC2626", bg: "#FEE2E2" },
};

const CATEGORY_LABELS: Record<string, string> = {
  migration_plan: "移行計画",
  delay_reason:   "遅延理由",
  cost:           "コスト",
  vendor:         "ベンダー",
  schedule:       "スケジュール",
  municipality:   "特定自治体",
  other:          "その他",
};

const ORG_LABELS: Record<string, string> = {
  municipality: "自治体職員",
  it_vendor:    "IT企業",
  consultant:   "コンサル",
  politician:   "議員",
  media:        "メディア",
  other:        "その他",
};

const STATUS_ORDER = ["received", "reviewing", "submitted", "disclosed", "rejected"];

export default function AdminDisclosurePage() {
  const [requests, setRequests]   = useState<DisclosureRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filterStatus, setFilter] = useState<string>("all");
  const [selected, setSelected]   = useState<DisclosureRequest | null>(null);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");

  // 編集フォーム state
  const [editStatus,       setEditStatus]       = useState("");
  const [editResultUrl,    setEditResultUrl]     = useState("");
  const [editResultTitle,  setEditResultTitle]   = useState("");
  const [editResultSummary,setEditResultSummary] = useState("");
  const [editNotes,        setEditNotes]         = useState("");
  const [editSubmittedAt,  setEditSubmittedAt]   = useState("");
  const [editDisclosedAt,  setEditDisclosedAt]   = useState("");

  const getAuth = () => {
    const pass = localStorage.getItem("admin_pass") ?? "";
    return `Basic ${btoa(`:${pass}`)}`;
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/disclosure", { headers: { Authorization: getAuth() } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  function openEdit(r: DisclosureRequest) {
    setSelected(r);
    setEditStatus(r.status);
    setEditResultUrl(r.result_url ?? "");
    setEditResultTitle(r.result_title ?? "");
    setEditResultSummary(r.result_summary ?? "");
    setEditNotes(r.notes ?? "");
    setEditSubmittedAt(r.submitted_at ? r.submitted_at.slice(0, 10) : "");
    setEditDisclosedAt(r.disclosed_at ? r.disclosed_at.slice(0, 10) : "");
    setSaveMsg("");
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch(`/api/disclosure/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: getAuth() },
        body: JSON.stringify({
          status:         editStatus,
          result_url:     editResultUrl || null,
          result_title:   editResultTitle || null,
          result_summary: editResultSummary || null,
          notes:          editNotes || null,
          submitted_at:   editSubmittedAt ? `${editSubmittedAt}T00:00:00+09:00` : null,
          disclosed_at:   editDisclosedAt ? `${editDisclosedAt}T00:00:00+09:00` : null,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveMsg("保存しました");
      await fetchRequests();
    } catch (e) {
      setSaveMsg(`エラー: ${String(e)}`);
    } finally {
      setSaving(false);
    }
  }

  const filtered = filterStatus === "all"
    ? requests
    : requests.filter((r) => r.status === filterStatus);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111111", margin: 0 }}>
          開示請求リクエスト
        </h1>
        <p style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
          {requests.length} 件 / 未着手{" "}
          {requests.filter((r) => r.status === "received").length} 件
        </p>
      </div>

      {/* フィルタータブ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ key: "all", label: `すべて (${requests.length})` }, ...STATUS_ORDER.map((s) => ({
          key: s,
          label: `${STATUS_CONFIG[s].label} (${requests.filter((r) => r.status === s).length})`,
        }))].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: "1px solid",
              fontSize: 12,
              fontWeight: filterStatus === tab.key ? 600 : 400,
              cursor: "pointer",
              borderColor: filterStatus === tab.key ? "#111111" : "#e5e7eb",
              backgroundColor: filterStatus === tab.key ? "#111111" : "#ffffff",
              color: filterStatus === tab.key ? "#ffffff" : "#6b7280",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</p>}
      {loading && <p style={{ color: "#9ca3af", fontSize: 13 }}>読み込み中…</p>}

      {/* リスト */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* 左: 一覧 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 && !loading && (
            <p style={{ color: "#9ca3af", fontSize: 13, padding: "32px 0", textAlign: "center" }}>
              リクエストはありません
            </p>
          )}
          {filtered.map((r) => {
            const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.received;
            const isOpen = selected?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => openEdit(r)}
                style={{
                  padding: "14px 16px",
                  borderTop: "1px solid #f3f4f6",
                  cursor: "pointer",
                  backgroundColor: isOpen ? "#f9fafb" : "#ffffff",
                  transition: "background-color 0.1s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                    backgroundColor: sc.bg, color: sc.color, flexShrink: 0, marginTop: 2,
                  }}>
                    {sc.label}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "#111111", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.topic}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                      {CATEGORY_LABELS[r.category] ?? r.category}
                      {r.municipality && ` ・ ${r.municipality}`}
                      {r.organization_type && ` ・ ${ORG_LABELS[r.organization_type] ?? r.organization_type}`}
                      {" ・ "}
                      {new Date(r.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 右: 編集パネル */}
        {selected && (
          <div style={{
            width: 360,
            flexShrink: 0,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            position: "sticky",
            top: 68,
            backgroundColor: "#ffffff",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#111111", margin: 0 }}>
                詳細・更新
              </p>
              <button onClick={() => setSelected(null)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 16, color: "#9ca3af", lineHeight: 1,
              }}>✕</button>
            </div>

            {/* 内容表示 */}
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 16,
              padding: "10px 12px", backgroundColor: "#f9fafb", borderRadius: 8 }}>
              <p style={{ color: "#111111", fontWeight: 500, marginBottom: 4 }}>{selected.topic}</p>
              {selected.email && <p>📧 {selected.email}</p>}
              受付: {new Date(selected.created_at).toLocaleDateString("ja-JP")}
            </div>

            {/* ステータス */}
            <Field label="ステータス">
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                style={inputStyle}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </Field>

            <Field label="提出日">
              <input type="date" value={editSubmittedAt}
                onChange={(e) => setEditSubmittedAt(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="開示決定日">
              <input type="date" value={editDisclosedAt}
                onChange={(e) => setEditDisclosedAt(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="公開記事タイトル">
              <input type="text" value={editResultTitle}
                placeholder="開示結果ページに表示するタイトル"
                onChange={(e) => setEditResultTitle(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="要約（1〜2文）">
              <textarea value={editResultSummary} rows={3}
                placeholder="開示されたポイントを簡潔に"
                onChange={(e) => setEditResultSummary(e.target.value)}
                style={{ ...inputStyle, resize: "vertical" }} />
            </Field>

            <Field label="関連記事URL">
              <input type="text" value={editResultUrl}
                placeholder="https://gcinsight.jp/articles/..."
                onChange={(e) => setEditResultUrl(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="編集部メモ（非公開）">
              <textarea value={editNotes} rows={2}
                placeholder="内部メモ・進捗記録等"
                onChange={(e) => setEditNotes(e.target.value)}
                style={{ ...inputStyle, resize: "vertical" }} />
            </Field>

            <button onClick={handleSave} disabled={saving} style={{
              width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
              backgroundColor: saving ? "#d1d5db" : "#111111", color: "#ffffff",
              fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
              marginTop: 4,
            }}>
              {saving ? "保存中…" : "保存する"}
            </button>
            {saveMsg && (
              <p style={{ fontSize: 12, marginTop: 8, textAlign: "center",
                color: saveMsg.startsWith("エラー") ? "#dc2626" : "var(--color-success)" }}>
                {saveMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: 6,
  border: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  fontSize: 12,
  color: "#111111",
  outline: "none",
  boxSizing: "border-box",
};
