"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: number;
  email: string;
  organization_type: string;
  source: string;
  created_at: string;
};

const ORG_LABELS: Record<string, string> = {
  municipality: "自治体職員",
  it_vendor: "IT企業・SIer",
  consultant: "コンサル・シンクタンク",
  politician: "議員・議員事務所",
  media: "メディア・研究者",
  other: "その他",
};

export default function SubscribersPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch("/api/newsletter/subscribers");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLeads(data);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const filtered = leads.filter((l) =>
    l.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: 0 }}>
            購読者
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            {leads.length} 人
            {search && ` / 絞り込み: ${filtered.length} 件`}
          </p>
        </div>

        {/* 検索 */}
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
              gridTemplateColumns: "1fr 160px 120px 100px",
              gap: 16,
              padding: "8px 0 8px",
              borderBottom: "1px solid #e5e7eb",
              fontSize: 12,
              fontWeight: 600,
              color: "#9ca3af",
            }}
          >
            <span>メールアドレス</span>
            <span>所属</span>
            <span>ソース</span>
            <span>登録日</span>
          </div>
          {filtered.map((lead) => (
            <div
              key={lead.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 120px 100px",
                gap: 16,
                padding: "14px 0",
                borderBottom: "1px solid #f3f4f6",
                alignItems: "center",
              }}
            >
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
