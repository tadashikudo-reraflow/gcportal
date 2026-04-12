"use client";

import { useState, useMemo } from "react";

interface Standard {
  no: number;
  business: string;
  ministry: string;
  spec_name: string;
  latest_version: string;
  published: string;
  url: string;
  category: string;
}

const CATEGORIES = ["すべて", "住民・戸籍", "税務", "福祉・医療", "教育・子育て"];

const MINISTRY_COLORS: Record<string, string> = {
  "総務省": "#1d6fa4",
  "厚生労働省": "#007a3d",
  "こども家庭庁": "#d97706",
  "厚生労働省・こども家庭庁": "#007a3d",
  "文部科学省": "#6b21a8",
  "法務省": "#64748b",
};

function getMinistryColor(ministry: string): string {
  if (ministry.includes("こども家庭庁") && ministry.includes("厚生労働省")) return "#007a3d";
  if (ministry.includes("こども家庭庁")) return "#d97706";
  return MINISTRY_COLORS[ministry] || "#64748b";
}

export default function StandardsClient({ standards }: { standards: Standard[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("すべて");

  const filtered = useMemo(() => {
    return standards.filter((s) => {
      const matchCat = category === "すべて" || s.category === category;
      const q = query.trim().toLowerCase();
      const matchQ = !q || [s.business, s.ministry, s.spec_name, s.category].some(
        (v) => v.toLowerCase().includes(q)
      );
      return matchCat && matchQ;
    });
  }, [standards, query, category]);

  return (
    <div>
      {/* フィルター */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input
          type="search"
          placeholder="業務名・省庁で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: "1 1 200px",
            padding: "8px 12px",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            fontSize: "0.875rem",
            outline: "none",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
          }}
        />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${category === c ? "var(--color-brand-secondary)" : "var(--color-border)"}`,
                backgroundColor: category === c ? "var(--color-brand-secondary)" : "transparent",
                color: category === c ? "#fff" : "var(--color-text-secondary)",
                fontSize: "0.8125rem",
                fontWeight: category === c ? 700 : 400,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 件数 */}
      <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", marginBottom: 12 }}>
        {filtered.length}件表示
      </p>

      {/* テーブル（横スクロール対応） */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", minWidth: 480 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
              {["No.", "業務名", "所管省庁", "標準仕様書名", "最新版", "公表"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.no} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "10px 12px", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                  {s.no}
                </td>
                <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                  {s.business}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: `${getMinistryColor(s.ministry)}18`,
                    color: getMinistryColor(s.ministry),
                    whiteSpace: "nowrap",
                  }}>
                    {s.ministry}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "var(--color-text-secondary)" }}>
                  {s.spec_name}
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                  {s.latest_version}
                </td>
                <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
                  {s.published}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "40px 0" }}>
          該当する業務が見つかりませんでした
        </p>
      )}
    </div>
  );
}
