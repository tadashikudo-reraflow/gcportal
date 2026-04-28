import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import Breadcrumb from "@/components/Breadcrumb";
import ContentTabNav from "@/components/ContentTabNav";
import PageHeader from "@/components/PageHeader";
import ArticlesClient from "./ArticlesClient";

export const metadata: Metadata = {
  title: "ガバメントクラウド・自治体標準化 実務記事ライブラリ｜GCInsight",
  description:
    "ガバメントクラウド・自治体標準化に関する実務記事を費用・ベンダー選定・自治体事例・移行ノウハウの4テーマで整理。自治体DX担当者・ITベンダー向け46本の解説記事。",
  alternates: { canonical: "/articles" },
  robots: { index: false, follow: true },
};
export const revalidate = 3600;

const THEMES = [
  {
    label: "費用・コスト",
    desc: "移行コスト構造・TCO試算・ベンダー比較",
    href: "/articles/gc-hiyo",
    badge: "費用",
    badgeStyle: { backgroundColor: "#FEF3C7", color: "#92400E" },
    tags: ["コスト", "FinOps"],
  },
  {
    label: "ベンダー・選定",
    desc: "CSP5社比較・パッケージ選定・認定状況",
    href: "/articles/gc-vendor-selection-guide-2026",
    badge: "ベンダー",
    badgeStyle: { backgroundColor: "#FEF9C3", color: "#92400E" },
    tags: ["ベンダー", "比較", "クラウド"],
  },
  {
    label: "自治体事例・進捗",
    desc: "特定移行支援・遅延リスク・都道府県別動向",
    href: "/articles/gc-tokutei-vs-delay",
    badge: "事例",
    badgeStyle: { backgroundColor: "#E8EAF6", color: "#283593" },
    tags: ["特定移行支援", "遅延", "リスク", "業務別"],
  },
  {
    label: "移行ノウハウ",
    desc: "GCASガイド・Replatform手順・標準化法解説",
    href: "/articles/gcas-guide-basics",
    badge: "ノウハウ",
    badgeStyle: { backgroundColor: "#E8F5E9", color: "#2E7D32" },
    tags: ["標準化", "解説"],
  },
];

export default async function ArticlesPage() {
  const articles = await getAllArticles();

  // テーマごとの記事数を集計
  const tagCounts = articles.flatMap((a) => a.tags).reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  const themeArticleCounts = THEMES.map((t) =>
    t.tags.reduce((sum, tag) => sum + (tagCounts[tag] ?? 0), 0)
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "コラム・解説記事" }]} />
      <PageHeader
        title="ガバメントクラウド 実務記事ライブラリ"
        subtitle={`費用・ベンダー・自治体事例・移行ノウハウ — 4テーマ ${articles.length}本`}
      />
      <ContentTabNav />

      {/* ========== テーマ別ナビ（上段） ========== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {THEMES.map((theme, i) => (
          <Link key={theme.href} href={theme.href} className="explore-card">
            <span className="explore-card-badge" style={theme.badgeStyle}>
              {theme.badge}
            </span>
            <span className="explore-card-title">{theme.label}</span>
            <span className="explore-card-desc">{theme.desc}</span>
            {themeArticleCounts[i] > 0 && (
              <span className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                {themeArticleCounts[i]}本
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* ========== 新着記事一覧（下段） ========== */}
      <div>
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>新着・全記事</p>
        {articles.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>記事準備中です</p>
          </div>
        ) : (
          <ArticlesClient articles={articles} />
        )}
      </div>
    </div>
  );
}
