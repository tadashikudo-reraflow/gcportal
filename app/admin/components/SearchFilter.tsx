"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { togglePublishAction, deleteArticleAction } from "../actions";

type Article = {
  id: number;
  slug: string;
  title: string;
  date: string;
  tags: string[];
  is_published: boolean;
  updated_at: string;
};

type FilterTab = "all" | "published" | "draft";

export default function SearchFilter({ articles }: { articles: Article[] }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesTab =
        tab === "all" ||
        (tab === "published" && a.is_published) ||
        (tab === "draft" && !a.is_published);
      const matchesQuery =
        !query || a.title.toLowerCase().includes(query.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [articles, query, tab]);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "すべて", count: articles.length },
    { key: "published", label: "公開中", count: articles.filter((a) => a.is_published).length },
    { key: "draft", label: "下書き", count: articles.filter((a) => !a.is_published).length },
  ];

  return (
    <div className="card overflow-hidden">
      {/* ヘッダー: タイトル + 新規作成 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>
          記事一覧
        </h2>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
          style={{ backgroundColor: "var(--color-brand-primary)", color: "var(--color-brand-primary)" }}
        >
          + 新規記事
        </Link>
      </div>

      {/* 検索バー + タブ */}
      <div className="px-5 pt-4 pb-2 space-y-3">
        {/* 検索 */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--color-text-muted)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="記事タイトルで検索..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border outline-none"
            style={{ border: "1.5px solid var(--color-border)" }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              &times;
            </button>
          )}
        </div>

        {/* タブ */}
        <div className="flex items-center gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
              style={
                tab === t.key
                  ? {
                      backgroundColor: "var(--color-brand-secondary)",
                      color: "#fff",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: "var(--color-text-secondary)",
                    }
              }
            >
              {t.label}
              <span
                className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                style={
                  tab === t.key
                    ? { backgroundColor: "#ffffff30" }
                    : { backgroundColor: "#f3f4f6" }
                }
              >
                {t.count}
              </span>
            </button>
          ))}

          {selected.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {selected.size}件選択中
              </span>
              <form
                action={async () => {
                  for (const id of selected) {
                    await deleteArticleAction(id);
                  }
                  setSelected(new Set());
                }}
                onSubmit={(e) => {
                  if (!confirm(`${selected.size}件を削除しますか？`)) e.preventDefault();
                }}
              >
                <button
                  type="submit"
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}
                >
                  一括削除
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* テーブル */}
      {filtered.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {query ? `"${query}" に一致する記事はありません` : "記事がありません"}
          </p>
        </div>
      ) : (
        <div>
          {/* テーブルヘッダー */}
          <div
            className="flex items-center gap-4 px-5 py-2 text-xs font-semibold border-b"
            style={{ backgroundColor: "#f9fafb", color: "var(--color-text-muted)", borderColor: "#f3f4f6" }}
          >
            <input
              type="checkbox"
              checked={selected.size === filtered.length && filtered.length > 0}
              onChange={selectAll}
              className="rounded"
              style={{ accentColor: "var(--color-brand-secondary)" }}
            />
            <span className="w-14 flex-shrink-0">ステータス</span>
            <span className="flex-1">タイトル</span>
            <span className="hidden md:block w-28 flex-shrink-0">日付</span>
            <span className="w-36 flex-shrink-0 text-right">操作</span>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map((article) => (
              <div
                key={article.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                style={selected.has(article.id) ? { backgroundColor: "#eff6ff" } : {}}
              >
                {/* チェックボックス */}
                <input
                  type="checkbox"
                  checked={selected.has(article.id)}
                  onChange={() => toggleSelect(article.id)}
                  className="rounded flex-shrink-0"
                  style={{ accentColor: "var(--color-brand-secondary)" }}
                />

                {/* ステータスバッジ */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 w-14 text-center"
                  style={
                    article.is_published
                      ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                      : { backgroundColor: "#fef3c7", color: "#d97706" }
                  }
                >
                  {article.is_published ? "公開中" : "下書き"}
                </span>

                {/* タイトル + slug */}
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {article.title || "(タイトルなし)"}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                    {article.slug}
                    {(article.tags ?? []).length > 0 && (
                      <>
                        {" "}・{" "}
                        {(article.tags ?? []).slice(0, 2).join(", ")}
                      </>
                    )}
                  </p>
                </div>

                {/* 日付 */}
                <div className="hidden md:block w-28 flex-shrink-0">
                  <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {article.date || "未設定"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    更新 {new Date(article.updated_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>

                {/* 操作ボタン */}
                <div className="flex items-center gap-1.5 flex-shrink-0 w-36 justify-end">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                    style={{
                      backgroundColor: "var(--color-section-bg)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    編集
                  </Link>
                  <form action={togglePublishAction.bind(null, article.id, article.is_published)}>
                    <button
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={
                        article.is_published
                          ? { backgroundColor: "#fef3c7", color: "#d97706" }
                          : { backgroundColor: "#dcfce7", color: "#16a34a" }
                      }
                    >
                      {article.is_published ? "下書きに" : "公開する"}
                    </button>
                  </form>
                  <form
                    action={deleteArticleAction.bind(null, article.id)}
                    onSubmit={(e) => {
                      if (!confirm("この記事を削除しますか？")) e.preventDefault();
                    }}
                  >
                    <button
                      className="text-xs px-2.5 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}
                    >
                      削除
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
