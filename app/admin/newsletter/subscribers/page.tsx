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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#111827" }}>
            購読者一覧
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            総計: <span className="font-bold">{leads.length}</span> 件
            {search && ` (絞り込み: ${filtered.length}件)`}
          </p>
        </div>

        {/* 検索 */}
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="メールアドレスで検索"
            className="px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "#d1d5db", width: 260 }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "#9ca3af" }}
            >
              x
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-sm" style={{ color: "#9ca3af" }}>
          読み込み中...
        </div>
      ) : error ? (
        <div className="text-sm" style={{ color: "#ef4444" }}>
          {error}
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "#e5e7eb" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}>
                <th className="text-left px-5 py-3 font-medium">メールアドレス</th>
                <th className="text-left px-5 py-3 font-medium">所属</th>
                <th className="text-left px-5 py-3 font-medium">ソース</th>
                <th className="text-left px-5 py-3 font-medium">登録日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center"
                    style={{ color: "#9ca3af" }}
                  >
                    {search ? "該当する購読者がいません" : "まだ購読者がいません"}
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t"
                    style={{ borderColor: "#f3f4f6" }}
                  >
                    <td
                      className="px-5 py-3 font-medium"
                      style={{ color: "#111827" }}
                    >
                      {lead.email}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7280" }}>
                      {ORG_LABELS[lead.organization_type] ?? lead.organization_type ?? "—"}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#6b7280" }}>
                      {lead.source ?? "—"}
                    </td>
                    <td className="px-5 py-3" style={{ color: "#9ca3af" }}>
                      {new Date(lead.created_at).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
