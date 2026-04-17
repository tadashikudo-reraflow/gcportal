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
  // GCInsight（ガバメントクラウド）
  municipality: "自治体職員",
  it_vendor: "IT企業・SIer",
  consultant: "コンサル・シンクタンク",
  politician: "議員・議員事務所",
  media: "メディア・研究者",
  // karte（電子カルテ標準化）
  hospital_staff: "病院・クリニック職員",
  medical_it: "医療IT・HISベンダー",
  hospital_mgmt: "病院経営・事務管理",
  researcher: "研究者・学術機関",
  // 共通
  other: "その他",
};

type TabType = "all" | "active" | "unsubscribed";
type SiteFilter = "all" | "gcinsight" | "karte";

const SITE_OPTIONS: { key: SiteFilter; label: string; color: string }[] = [
  { key: "all",       label: "全サイト",                color: "#374151" },
  { key: "gcinsight", label: "GCInsight（ガバクラ）",    color: "#0057B8" },
  { key: "karte",     label: "karte（電子カルテ）",      color: "#2e7d32" },
];

export default function SubscribersPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabType>("active");
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionMsg, setActionMsg] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importCsv, setImportCsv] = useState("");
  const [importing, setImporting] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const getAuth = () => {
    const pass = sessionStorage.getItem("admin_pass") ?? "";
    return `Basic ${btoa(`:${pass}`)}`;
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/newsletter/subscribers", {
        headers: { Authorization: getAuth() },
        credentials: "include",
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

  // サイトフィルター
  const siteFiltered = leads.filter((l) => {
    if (siteFilter === "karte")     return l.source?.startsWith("karte_") ?? false;
    if (siteFilter === "gcinsight") return !(l.source?.startsWith("karte_") ?? false);
    return true;
  });

  // タブフィルター
  const tabFiltered = siteFiltered.filter((l) => {
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
        credentials: "include",
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
        credentials: "include",
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

  const handleImport = async () => {
    if (!importCsv.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/newsletter/subscribers/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: getAuth(),
        },
        credentials: "include",
        body: JSON.stringify({ csv: importCsv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setActionMsg(`インポート完了: ${data.imported} 件追加、${data.skipped} 件スキップ`);
      setShowImport(false);
      setImportCsv("");
      setLoading(true);
      await fetchLeads();
    } catch (e) {
      setActionMsg(`エラー: ${String(e)}`);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = () => {
    const pass = sessionStorage.getItem("admin_pass") ?? "";
    const auth = btoa(`:${pass}`);
    const params = new URLSearchParams({ auth });
    if (siteFilter === "karte")     params.set("site", "karte");
    if (siteFilter === "gcinsight") params.set("site", "gcinsight");
    window.location.href = `/api/newsletter/subscribers/export?${params}`;
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
      <style>{`
        .sub-table-row {
          display: grid;
          grid-template-columns: 40px minmax(200px, 2fr) minmax(100px, 1fr) 120px 100px 60px;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .sub-table-row {
            grid-template-columns: 40px 1fr 60px;
          }
          .sub-col-org,
          .sub-col-source,
          .sub-col-date {
            display: none;
          }
        }
      `}</style>
      {/* CSVインポートモーダル */}
      {showImport && (
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
          <div style={{ borderRadius: 12, padding: 28, width: 480, backgroundColor: "#fff" }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111111", marginBottom: 8 }}>
              CSVインポート
            </h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
              1行1メールアドレス、または email,organization_type 形式で入力してください。
            </p>
            <textarea
              value={importCsv}
              onChange={(e) => setImportCsv(e.target.value)}
              placeholder={"example@municipality.go.jp\nexample2@city.go.jp,municipality"}
              rows={10}
              style={{
                width: "100%",
                fontSize: 13,
                padding: "8px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                outline: "none",
                resize: "vertical",
                fontFamily: "monospace",
                boxSizing: "border-box",
                color: "#374151",
              }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 16 }}>
              <button
                onClick={() => { setShowImport(false); setImportCsv(""); }}
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
                onClick={handleImport}
                disabled={importing}
                style={{
                  backgroundColor: "#111111",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  cursor: importing ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "7px 20px",
                  opacity: importing ? 0.5 : 1,
                }}
              >
                {importing ? "インポート中..." : "インポート"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111111", margin: 0 }}>
            購読者
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            {leads.length} 人
            {search && ` / 絞り込み: ${filtered.length} 件`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowImport(true)}
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
            CSVインポート
          </button>
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
              width: "clamp(160px, 100%, 240px)",
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

      {/* サイトフィルター */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {SITE_OPTIONS.map((opt) => {
          const count = leads.filter((l) => {
            if (opt.key === "karte")     return l.source?.startsWith("karte_") ?? false;
            if (opt.key === "gcinsight") return !(l.source?.startsWith("karte_") ?? false);
            return true;
          }).length;
          const active = siteFilter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => { setSiteFilter(opt.key); setSelected(new Set()); }}
              style={{
                fontSize: 13,
                fontWeight: active ? 700 : 400,
                color: active ? "#fff" : opt.color,
                backgroundColor: active ? opt.color : "transparent",
                border: `1.5px solid ${opt.color}`,
                borderRadius: 20,
                padding: "4px 14px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
              <span style={{ marginLeft: 6, fontSize: 12, opacity: 0.85 }}>{count}</span>
            </button>
          );
        })}
      </div>

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
            className="sub-table-row"
            style={{
              padding: "8px 8px 8px",
              borderBottom: "1px solid #e5e7eb",
              fontSize: 12,
              fontWeight: 600,
              color: "#9ca3af",
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              onClick={toggleAll}
              onChange={() => {/* onChange はブラウザ警告防止のため保持 */}}
              style={{ cursor: "pointer", width: 16, height: 16 }}
            />
            <span>メールアドレス</span>
            <span className="sub-col-org">所属</span>
            <span className="sub-col-source">ソース</span>
            <span className="sub-col-date">登録日</span>
            <span>状態</span>
          </div>
          {filtered.map((lead) => {
            const isSelected = selected.has(lead.id);
            const isHovered = hoveredId === lead.id;
            return (
              <div
                key={lead.id}
                onClick={() => toggleOne(lead.id)}
                onMouseEnter={() => setHoveredId(lead.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="sub-table-row"
                style={{
                  padding: "14px 8px",
                  borderBottom: "1px solid #f3f4f6",
                  alignItems: "center",
                  opacity: lead.unsubscribed ? 0.6 : 1,
                  cursor: "pointer",
                  backgroundColor: isSelected ? "#eff6ff" : isHovered ? "#f9fafb" : "transparent",
                  borderRadius: 6,
                  transition: "background-color 0.1s",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {/* row onClick handles toggle */}}
                  style={{ cursor: "pointer", width: 16, height: 16, pointerEvents: "none" }}
                />
                <p style={{ fontSize: 14, color: "#111111", wordBreak: "break-all", margin: 0 }}>
                  {lead.email}
                </p>
                <p className="sub-col-org" style={{ fontSize: 13, color: "#6b7280", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ORG_LABELS[lead.organization_type] ?? lead.organization_type ?? "不明"}
                </p>
                <p className="sub-col-source" style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                  {lead.source || "—"}
                </p>
                <p className="sub-col-date" style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>
                  {new Date(lead.created_at).toLocaleDateString("ja-JP")}
                </p>
                <p style={{ fontSize: 11, color: lead.unsubscribed ? "#ef4444" : "#10b981", margin: 0 }}>
                  {lead.unsubscribed ? "解除済" : "購読中"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
