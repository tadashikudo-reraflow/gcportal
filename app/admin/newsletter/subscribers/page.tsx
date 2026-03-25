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

const ORG_COLORS: Record<string, { bg: string; color: string }> = {
  municipality: { bg: "#eef2fa", color: "#002D72" },
  it_vendor: { bg: "#f0fdf4", color: "#16a34a" },
  consultant: { bg: "#fef3c7", color: "#d97706" },
  politician: { bg: "#fce7f3", color: "#db2777" },
  media: { bg: "#f3e8ff", color: "#7c3aed" },
  other: { bg: "#f9fafb", color: "#6b7280" },
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
    <div className="min-h-screen" style={{ backgroundColor: "#f7f7f7" }}>
      <div className="max-w-3xl mx-auto px-8 py-10">

        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#111827" }}>
              購読者一覧
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-sm font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: "#eef2fa", color: "#002D72" }}
              >
                {leads.length} 人
              </span>
              {search && (
                <span className="text-sm" style={{ color: "#9ca3af" }}>
                  絞り込み結果: {filtered.length} 件
                </span>
              )}
            </div>
          </div>

          {/* 検索バー */}
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "#9ca3af" }}
            >
              &#128269;
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="メールアドレスで検索"
              className="pl-8 pr-8 py-2.5 rounded-xl border text-sm outline-none bg-white"
              style={{ borderColor: "#e5e7eb", width: 260, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "#9ca3af" }}
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>

        {/* リスト本体 */}
        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-sm" style={{ color: "#9ca3af" }}>読み込み中...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-sm" style={{ color: "#9ca3af" }}>
              {search ? "該当する購読者がいません" : "まだ購読者がいません"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((lead) => {
              const orgStyle = ORG_COLORS[lead.organization_type] ?? ORG_COLORS.other;
              return (
                <div
                  key={lead.id}
                  className="rounded-2xl bg-white px-6 py-4 flex items-center justify-between"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
                >
                  {/* 左: メール + バッジ */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: orgStyle.bg, color: orgStyle.color }}
                    >
                      {lead.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                        {lead.email}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: orgStyle.bg, color: orgStyle.color }}
                        >
                          {ORG_LABELS[lead.organization_type] ?? lead.organization_type ?? "不明"}
                        </span>
                        {lead.source && (
                          <span className="text-xs" style={{ color: "#9ca3af" }}>
                            {lead.source}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 右: 登録日 */}
                  <p className="text-xs flex-shrink-0 ml-4" style={{ color: "#9ca3af" }}>
                    {new Date(lead.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
