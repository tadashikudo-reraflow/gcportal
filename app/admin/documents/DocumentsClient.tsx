"use client";

import { useState, useEffect } from "react";

type RagDocument = {
  id: number;
  title: string;
  file_name: string | null;
  file_type: string | null;
  source_url: string | null;
  organization: string | null;
  category: string | null;
  status: string;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
};

type SearchResult = {
  id: number;
  content: string;
  similarity: number;
  doc_title: string;
  doc_organization: string | null;
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  pending:    { bg: "#fef3c7", text: "#92400e" },
  processing: { bg: "#dbeafe", text: "#1e40af" },
  indexed:    { bg: "#dcfce7", text: "#166534" },
  error:      { bg: "#fee2e2", text: "#991b1b" },
};

const STATUS_LABELS: Record<string, string> = {
  pending: "待機中",
  processing: "処理中",
  indexed: "インデックス済み",
  error: "エラー",
};

export default function DocumentsClient() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // インジェストフォーム
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState("official");
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<string | null>(null);

  // テスト検索
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // ドキュメント一覧を取得（Supabase直接読み取り）
  async function fetchDocuments() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rag_documents?select=*&order=created_at.desc`,
        {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  // テキストインジェスト
  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await fetch("/api/rag/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          organization: organization.trim() || undefined,
          category,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIngestResult(`成功: ${data.chunkCount}チャンク生成 (ID: ${data.documentId})`);
        setTitle("");
        setContent("");
        setSourceUrl("");
        setOrganization("");
        fetchDocuments();
      } else {
        setIngestResult(`エラー: ${data.error}`);
      }
    } catch (err) {
      setIngestResult(`エラー: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIngesting(false);
    }
  }

  // テスト検索
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/rag/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.results);
      }
    } catch {
      // silent
    } finally {
      setSearching(false);
    }
  }

  // ドキュメント削除（API経由・管理者認証付き）
  async function handleDelete(id: number) {
    if (!confirm("このドキュメントとすべてのチャンクを削除しますか？")) return;
    try {
      const res = await fetch(`/api/rag/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(`削除に失敗しました: ${data.error ?? res.statusText}`);
        return;
      }
      fetchDocuments();
    } catch {
      alert("削除リクエストに失敗しました");
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-2">
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          RAG ドキュメント管理
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          ファクトチェック用のドキュメントをインジェスト・管理します
        </p>
      </div>

      {/* インジェストフォーム */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          テキストドキュメントをインジェスト
        </h2>
        <form onSubmit={handleIngest} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>
                タイトル *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
                style={{ border: "1.5px solid var(--color-border)" }}
                placeholder="ドキュメントタイトル"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>
                組織名
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
                style={{ border: "1.5px solid var(--color-border)" }}
                placeholder="デジタル庁"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>
                ソースURL
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
                style={{ border: "1.5px solid var(--color-border)" }}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>
                カテゴリー
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
                style={{ border: "1.5px solid var(--color-border)" }}
              >
                <option value="official">公式文書</option>
                <option value="report">報告書</option>
                <option value="article">記事</option>
                <option value="regulation">法規制</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-text-muted)" }}>
              テキスト内容 *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none resize-y"
              style={{ border: "1.5px solid var(--color-border)" }}
              placeholder="ドキュメントのテキストを貼り付け..."
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={ingesting}
              className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#003087" }}
            >
              {ingesting ? "インジェスト中..." : "インジェスト実行"}
            </button>
            {ingestResult && (
              <span
                className="text-xs font-medium"
                style={{ color: ingestResult.startsWith("成功") ? "#166534" : "#991b1b" }}
              >
                {ingestResult}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* テスト検索 */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          セマンティック検索テスト
        </h2>
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border outline-none"
            style={{ border: "1.5px solid var(--color-border)" }}
            placeholder="検索クエリを入力..."
          />
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            {searching ? "検索中..." : "検索"}
          </button>
        </form>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: "#f8f9fb", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs" style={{ color: "var(--color-text-primary)" }}>
                    {r.doc_title}
                    {r.doc_organization && (
                      <span className="ml-1 font-normal" style={{ color: "var(--color-text-muted)" }}>
                        ({r.doc_organization})
                      </span>
                    )}
                  </span>
                  <span
                    className="text-xs font-bold tabular-nums px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: r.similarity >= 0.8 ? "#dcfce7" : r.similarity >= 0.6 ? "#fef3c7" : "#f3f4f6",
                      color: r.similarity >= 0.8 ? "#166534" : r.similarity >= 0.6 ? "#92400e" : "#6b7280",
                    }}
                  >
                    {(r.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>
                  {r.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ドキュメント一覧 */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            インデックス済みドキュメント
          </h2>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {documents.length} 件
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
            読み込み中...
          </p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--color-text-muted)" }}>
            ドキュメントがありません。上のフォームからインジェストしてください。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>タイトル</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>組織</th>
                  <th className="text-left py-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>カテゴリ</th>
                  <th className="text-center py-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>チャンク</th>
                  <th className="text-center py-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>ステータス</th>
                  <th className="text-right py-2 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  const s = STATUS_STYLES[doc.status] ?? STATUS_STYLES.pending;
                  return (
                    <tr key={doc.id} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                      <td className="py-2">
                        <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {doc.title}
                        </span>
                        {doc.source_url && (
                          <a
                            href={doc.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 text-xs underline"
                            style={{ color: "var(--color-brand-secondary)" }}
                          >
                            ↗
                          </a>
                        )}
                      </td>
                      <td className="py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {doc.organization ?? "—"}
                      </td>
                      <td className="py-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {doc.category ?? "—"}
                      </td>
                      <td className="py-2 text-center text-xs tabular-nums font-medium">
                        {doc.chunk_count}
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className="inline-flex px-2 py-0.5 rounded text-xs font-medium"
                          style={{ backgroundColor: s.bg, color: s.text }}
                        >
                          {STATUS_LABELS[doc.status] ?? doc.status}
                        </span>
                        {doc.error_message && (
                          <span className="block text-xs mt-0.5" style={{ color: "#991b1b" }}>
                            {doc.error_message}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          style={{ color: "#991b1b" }}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
