"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  ガバメントクラウド: { bg: "#fff3e0", text: "#e65100" },
  コスト:             { bg: "#fce4ec", text: "#c62828" },
  FinOps:             { bg: "#fce4ec", text: "#ad1457" },
  ベンダー:           { bg: "#f3e5f5", text: "#6a1b9a" },
  比較:               { bg: "#f3e5f5", text: "#6a1b9a" },
  特定移行支援:       { bg: "#e8eaf6", text: "#283593" },
  遅延:               { bg: "#fff8e1", text: "#f57f17" },
  リスク:             { bg: "#fff8e1", text: "#e65100" },
  "2026年問題":       { bg: "#fce4ec", text: "#c62828" },
  業務別:             { bg: "#e8f5e9", text: "#2e7d32" },
  標準化:             { bg: "#e8f5e9", text: "#2e7d32" },
  クラウド:           { bg: "#e3f2fd", text: "#1565c0" },
  セキュリティ:       { bg: "#e3f2fd", text: "#0d47a1" },
  技術:               { bg: "#e3f2fd", text: "#1565c0" },
  解説:               { bg: "#e0f7fa", text: "#00695c" },
};

function ArticlePlaceholder() {
  return (
    <div className="w-full"
      style={{
        aspectRatio: "5/2",
        background: "linear-gradient(135deg, #00205F 0%, #00338D 100%)",
        backgroundImage: "linear-gradient(135deg, #00205F 0%, #00338D 100%), repeating-linear-gradient(45deg, transparent 0 12px, rgba(255,255,255,0.04) 12px 14px)",
      }}
      aria-hidden="true"
    />
  );
}

type Article = {
  slug: string;
  title: string;
  description?: string;
  coverImage?: string;
  tags: string[];
  date: string;
  author?: string;
};

export default function ArticlesClient({ articles }: { articles: Article[] }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 全記事のタグを集計（出現頻度2以上・多い順に表示）
  const tagCounts = articles.flatMap((a) => a.tags).reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  const allTags = Object.entries(tagCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  const filtered = selectedTag
    ? articles.filter((a) => a.tags.includes(selectedTag))
    : articles;

  return (
    <div className="space-y-6">
      {/* タグフィルター */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className="text-xs px-3 py-1 rounded-full font-medium border transition-colors"
            style={
              selectedTag === null
                ? { backgroundColor: "var(--color-brand-primary)", color: "#fff", borderColor: "var(--color-brand-primary)" }
                : { backgroundColor: "transparent", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }
            }
          >
            すべて
          </button>
          {allTags.map((tag) => {
            const c = TAG_COLORS[tag] ?? { bg: "#f1f5f9", text: "#475569" };
            const isActive = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isActive ? null : tag)}
                className="text-xs px-3 py-1 rounded-full font-medium border transition-all"
                style={
                  isActive
                    ? { backgroundColor: c.text, color: "#fff", borderColor: c.text }
                    : { backgroundColor: c.bg, color: c.text, borderColor: "transparent" }
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* 件数表示 */}
      {selectedTag && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          「{selectedTag}」の記事 {filtered.length}件
        </p>
      )}

      {/* 記事グリッド */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>該当する記事がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`}
              className="article-card group">
              {article.coverImage ? (
                <div className="w-full overflow-hidden bg-[#EEF4FB]" style={{ aspectRatio: "5/2" }}>
                  <Image src={article.coverImage} alt={article.title}
                    width={600} height={240}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <ArticlePlaceholder />
              )}
              <div className="p-6 flex flex-col gap-3 flex-1">
                <h2 className="text-base font-bold leading-snug group-hover:underline"
                  style={{ color: "var(--color-text-primary)" }}>{article.title}</h2>
                {article.description && (
                  <p className="text-sm leading-relaxed line-clamp-3"
                    style={{ color: "var(--color-text-secondary)" }}>{article.description}</p>
                )}
                <div className="mt-auto pt-3 space-y-3">
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => {
                        const c = TAG_COLORS[tag] ?? { bg: "#f1f5f9", text: "#475569" };
                        return (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: c.bg, color: c.text }}>{tag}</span>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t"
                    style={{ borderColor: "var(--color-border)" }}>
                    <span className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>{article.date}</span>
                    {article.author && (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{article.author}</span>
                    )}
                    <span className="text-xs font-semibold" style={{ color: "var(--color-brand-primary)" }}>
                      続きを読む →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
