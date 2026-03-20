"use client";

/**
 * SourceTooltip — データポイント横の「出典」リンク
 *
 * クリックでRAGチャンク（裏付け情報）をポップオーバー表示
 */

import { useState } from "react";

type SourceTooltipProps = {
  /** 表示するラベル */
  label?: string;
  /** 静的出典情報 */
  sourceName?: string;
  sourceUrl?: string;
  sourceOrg?: string;
  /** RAG検索クエリ（指定時はクリックでRAG検索実行） */
  ragQuery?: string;
};

type RagResult = {
  content: string;
  similarity: number;
  doc_title: string;
  doc_organization: string | null;
};

export default function SourceTooltip({
  label = "出典",
  sourceName,
  sourceUrl,
  sourceOrg,
  ragQuery,
}: SourceTooltipProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ragResults, setRagResults] = useState<RagResult[]>([]);

  const handleClick = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);

    if (ragQuery && ragResults.length === 0) {
      setLoading(true);
      try {
        const res = await fetch(`/api/rag/search?q=${encodeURIComponent(ragQuery)}&limit=3`);
        if (res.ok) {
          const data = await res.json();
          setRagResults(data.results ?? []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        className="text-xs underline cursor-pointer hover:opacity-70"
        style={{ color: "var(--color-brand-secondary)" }}
      >
        {label}
      </button>

      {open && (
        <div
          className="absolute z-50 bottom-full left-0 mb-1 w-72 p-3 rounded-lg shadow-lg text-xs"
          style={{
            backgroundColor: "white",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* 静的出典 */}
          {sourceName && (
            <div className="mb-2 pb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                {sourceName}
              </p>
              {sourceOrg && (
                <p style={{ color: "var(--color-text-muted)" }}>{sourceOrg}</p>
              )}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--color-brand-secondary)" }}
                >
                  ソースを開く ↗
                </a>
              )}
            </div>
          )}

          {/* RAG結果 */}
          {ragQuery && (
            <div className="space-y-1.5">
              <p className="font-medium" style={{ color: "var(--color-text-muted)" }}>
                関連ドキュメント
              </p>
              {loading ? (
                <p style={{ color: "var(--color-text-muted)" }}>検索中...</p>
              ) : ragResults.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)" }}>
                  関連ドキュメントが見つかりませんでした
                </p>
              ) : (
                ragResults.map((r, i) => (
                  <div
                    key={i}
                    className="p-2 rounded"
                    style={{ backgroundColor: "#f8f9fb" }}
                  >
                    <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {r.doc_title}
                      <span className="ml-1 font-normal" style={{ color: "var(--color-text-muted)" }}>
                        ({(r.similarity * 100).toFixed(0)}%)
                      </span>
                    </p>
                    <p
                      className="leading-relaxed line-clamp-2 mt-0.5"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {r.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 閉じるボタン */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-1.5 right-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}
    </span>
  );
}
