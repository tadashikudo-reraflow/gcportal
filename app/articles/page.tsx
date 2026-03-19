import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "コラム・解説記事 | 自治体標準化ダッシュボード",
  description:
    "ガバメントクラウド・自治体標準化システムに関するコラム・解説記事の一覧。自治体DX推進担当者向けの実務情報を提供します。",
};

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  ガバメントクラウド: { bg: "#fff3e0", text: "#e65100" },
  自治体標準化:       { bg: "#e8f5e9", text: "#2e7d32" },
  コスト:             { bg: "#fce4ec", text: "#c62828" },
  移行:               { bg: "#e3f2fd", text: "#1565c0" },
  AWS:                { bg: "#fff8e1", text: "#f57f17" },
  OCI:                { bg: "#fbe9e7", text: "#bf360c" },
  ベンダー:           { bg: "#f3e5f5", text: "#6a1b9a" },
  解説:               { bg: "#e0f7fa", text: "#00695c" },
};

function TagBadge({ tag }: { tag: string }) {
  const c = TAG_COLORS[tag] ?? { bg: "#f1f5f9", text: "#475569" };
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {tag}
    </span>
  );
}

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="pb-2">
        <h1 className="page-title">コラム・解説記事</h1>
        <p className="page-subtitle">
          ガバメントクラウド・自治体標準化に関する実務情報・解説
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            記事準備中です
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group"
            >
              {/* タグ */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              )}

              {/* タイトル */}
              <h2
                className="text-base font-bold leading-snug group-hover:underline"
                style={{ color: "var(--color-text-primary)" }}
              >
                {article.title}
              </h2>

              {/* 概要 */}
              {article.description && (
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-text-secondary)" }}>
                  {article.description}
                </p>
              )}

              {/* 日付 */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                <span className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                  {article.date}
                </span>
                {article.author && (
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {article.author}
                  </span>
                )}
                <span className="text-xs font-semibold" style={{ color: "var(--color-brand-primary)" }}>
                  続きを読む →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
