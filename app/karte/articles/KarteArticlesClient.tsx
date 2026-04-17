"use client";

import { useState } from "react";
import Link from "next/link";

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  電子カルテ:         { bg: "#e8f5e9", text: "#2e7d32" },
  標準化:             { bg: "#e8f5e9", text: "#2e7d32" },
  "標準型電子カルテ": { bg: "#e8f5e9", text: "#1b5e20" },
  情報共有:           { bg: "#e3f2fd", text: "#1565c0" },
  補助金:             { bg: "#fff8e1", text: "#f57f17" },
  医療情報化:         { bg: "#fff3e0", text: "#e65100" },
  ガバメントクラウド: { bg: "#fff3e0", text: "#e65100" },
  医療DX:             { bg: "#f3e5f5", text: "#6a1b9a" },
  FHIR:               { bg: "#e8eaf6", text: "#283593" },
  "3文書6情報":       { bg: "#fce4ec", text: "#c62828" },
  普及率:             { bg: "#e0f7fa", text: "#00695c" },
  解説:               { bg: "#e0f7fa", text: "#00695c" },
};

function ArticleOgThumbnail({ title, description, author }: { title: string; description?: string; author?: string }) {
  const params = new URLSearchParams({
    title,
    subtitle: description || "GCInsight for 電子カルテ標準化",
    type: "article",
    site: "karte",
    ...(author ? { author } : {}),
  });
  return (
    <div className="w-full overflow-hidden" style={{ aspectRatio: "40/21" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/og?${params.toString()}`}
        alt={title}
        width={1200}
        height={630}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
    </div>
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

export default function KarteArticlesClient({ articles }: { articles: Article[] }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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

      {selectedTag && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          「{selectedTag}」の記事 {filtered.length}件
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>記事準備中です</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((article) => (
            <Link key={article.slug} href={`/karte/${article.slug}`}
              className="article-card group">
              <ArticleOgThumbnail
                title={article.title}
                description={article.description}
                author={article.author}
              />
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
