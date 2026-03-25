"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: number;
  email: string;
  organization_type: string;
  source: string;
  created_at: string;
  unsubscribed?: boolean;
};

const ORG_LABELS: Record<string, string> = {
  municipality: "自治体職員",
  it_vendor: "IT企業・SIer",
  consultant: "コンサル・シンクタンク",
  politician: "議員・議員事務所",
  media: "メディア・研究者",
  other: "その他",
};

type TabType = "all" | "active" | "unsubscribed";

export default function SubscribersPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabType>("active");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionMsg, setActionMsg] = useState("");

  const getAuth = () => {
    const pass = sessionStorage.getItem("admin_pass") ?? "";
    return `Basic ${btoa(`:${pass}`)}`;
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/newsletter/subscribers", {
        headers: { Authorization: getAuth() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 重複チェック（lower case正規化）
  const duplicates = (() => {
    const counts: Record<string, number[]> = {};
    for (const lead of leads) {
      const key = lead.email.toLowerCase();
      if (!counts[key]) counts[key] = [];
      counts[key].push(lead.id);
    }
    return Object.entries(counts).filter(([, ids]) => ids.length > 1);
  })();

  // タブフィルター
  const tabFiltered = leads.filter((l) => {
    if (tab === "active") return !l.unsubscribed;
    if (tab === "unsubscribed") return !!l.unsubscribed;
    return true;
  });

  const filtered = tabFiltered.filter((l) =>
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = filtered.length > 0 && filtered.every((l) => selected.has(l.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((l) => next.delete(l.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((l) => next.add(l.id));
        return next;
      });
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedInView = filtered.filter((l) => selected.has(l.id));

  const handleBulkUnsubscribe = async () => {
    if (selectedInView.length === 0) return;
    const ok = window.confirm(
      `選択した ${selectedInView.length} 件の購読を解除しますか？`
    );
    if (!ok) return;
    const ids = selectedInView.map((l) => l.id);
    try {
      const res = await fetch("/api/newsletter/subscribers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuth(),
        },
        body: JSON.stringify({ ids, unsubscribed: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActionMsg(`${ids.length} 件の購読を解除しました`);
      setSelected(new Set());
      setLoading(true);
      await fetchLeads();
    } catch (e) {
      setActionMsg(`エラー: ${String(e)}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInView.length === 0) return;
    const ok = window.confirm(
      `選択した ${selectedInView.length} 件を完全に削除しますか？この操作は取り消せません。`
    );
    if (!ok) return;
    const ids = selectedInView.map((l) => l.id);
    try {
      const res = await fetch("/api/newsletter/subscribers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuth(),
        },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setActionMsg(`${ids.length} 件を削除しました`);
      setSelected(new Set());
      setLoading(true);
      await fetchLeads();
    } catch (e) {
      setActionMsg(`エラー: ${String(e)}`);
    }
  };

  const handleExport = () => {
    const pass = sessionStorage.getItem("admin_pass") ?? "";
    const auth = btoa(`:${pass}`);
    window.location.href = `/api/newsletter/subscribers/export?auth=${encodeURIComponent(auth)}`;
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? "#111111" : "#9ca3af",
    background: "none",
    border: "none",
    borderBottom: active ? "2px solid #111111" : "2px solid transparent",
    cursor: "pointer",
    padding: "6px 0",
    marginRight: 20,
  });

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: 0 }}>
            購読者
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            {leads.length} 人
            {search && ` / 絞り込み: ${filtered.length} 件`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleExport}
            style={{
              fontSize: 13,
              color: "#374151",
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              cursor: "pointer",
              padding: "6px 14px",
            }}
          >
            CSVエクスポート
          </button>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="メールアドレスで検索"
            style={{
              fontSize: 14,
              padding: "7px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              outline: "none",
              width: 240,
              color: "#374151",
            }}
          />
        </div>
      </div>

      {/* 重複警告 */}
      {duplicates.length > 0 && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#92400e",
          }}
        >
          {duplicates.map(([email]) => (
            <div key={email}>
              ⚠️ 重複の可能性: {email} が{leads.filter((l) => l.email.toLowerCase() === email).length}件あります
            </div>
          ))}
        </div>
      )}

      {/* アクションメッセージ */}
      {actionMsg && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: 8,
            padding: "10px 16px",
            marginBottom: 16,
            fontSize: 13,
            color: "#166534",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{actionMsg}</span>
          <button
            onClick={() => setActionMsg("")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#166534", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* タブ */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 16 }}>
        {([
          { key: "all", label: "全員" },
          { key: "active", label: "購読中" },
          { key: "unsubscribed", label: "解除済み" },
        ] as { key: TabType; label: string }[]).map((t) => (
          <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => { setTab(t.key); setSelected(new Set()); }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 一括操作バー */}
      {selectedInView.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 12px",
            backgroundColor: "#f9fafb",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <span style={{ color: "#374151" }}>{selectedInView.length} 件選択中</span>
          <button
            onClick={handleBulkUnsubscribe}
            style={{
              fontSize: 12,
              color: "#b45309",
              background: "none",
              border: "1px solid #fcd34d",
              borderRadius: 4,
              cursor: "pointer",
              padding: "4px 10px",
            }}
          >
            選択した購読者を解除
          </button>
          <button
            onClick={handleBulkDelete}
            style={{
              fontSize: 12,
              color: "#dc2626",
              background: "none",
              border: "1px solid #fca5a5",
              borderRadius: 4,
              cursor: "pointer",
              padding: "4px 10px",
            }}
          >
            削除
          </button>
        </div>
      )}

      {/* リスト本体 */}
      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>読み込み中...</p>
        </div>
      ) : error ? (
        <div style={{ padding: "24px 0", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 14, color: "#ef4444" }}>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>
            {search ? "該当する購読者がいません" : "まだ購読者がいません"}
          </p>
        </div>
      ) : (
        <div>
          {/* テーブルヘッダー */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 160px 120px 100px 60px",
              gap: 16,
              padding: "8px 0 8px",
              borderBottom: "1px solid #e5e7eb",
              fontSize: 12,
              fontWeight: 600,
              color: "#9ca3af",
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ cursor: "pointer" }}
            />
            <span>メールアドレス</span>
            <span>所属</span>
            <span>ソース</span>
            <span>登録日</span>
            <span>状態</span>
          </div>
          {filtered.map((lead) => (
            <div
              key={lead.id}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr 160px 120px 100px 60px",
                gap: 16,
                padding: "14px 0",
                borderBottom: "1px solid #f3f4f6",
                alignItems: "center",
                opacity: lead.unsubscribed ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(lead.id)}
                onChange={() => toggleOne(lead.id)}
                style={{ cursor: "pointer" }}
              />
              <p style={{ fontSize: 14, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                {lead.email}
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ORG_LABELS[lead.organization_type] ?? lead.organization_type ?? "不明"}
              </p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                {lead.source || "—"}
              </p>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                {new Date(lead.created_at).toLocaleDateString("ja-JP")}
              </p>
              <p style={{ fontSize: 11, color: lead.unsubscribed ? "#ef4444" : "#10b981", margin: 0 }}>
                {lead.unsubscribed ? "解除済" : "購読中"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
