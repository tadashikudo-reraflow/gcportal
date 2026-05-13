import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import { getClusterForTags } from "@/lib/clusters";
import RelatedArticles from "@/components/RelatedArticles";
import ArticleCTA from "@/components/ArticleCTA";
import MermaidRenderer from "@/components/MermaidRenderer";
import ArticleNewsletterBanner from "@/components/ArticleNewsletterBanner";
import InlineNewsletterCTA from "@/components/InlineNewsletterCTA";
import MunicipalityCTASection from "@/components/MunicipalityCTASection";
import Breadcrumb from "@/components/Breadcrumb";
import { BookOpen } from "lucide-react";

/**
 * 記事HTML内の `<h2 ...>` タグ位置を返す（出現順）。
 * remark-html 出力では `<h2 id="...">...</h2>` の形式。
 */
function findH2Positions(html: string): number[] {
  const positions: number[] = [];
  const regex = /<h2[\s>]/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    positions.push(match.index);
  }
  return positions;
}

/**
 * 記事HTMLを「2つ目の H2 直前」で分割する。
 * H2 が3個未満なら null（分割しない＝CTA挿入しない）を返す。
 */
function splitAtSecondH2(html: string): { firstHalf: string; secondHalf: string } | null {
  const positions = findH2Positions(html);
  if (positions.length < 3) return null;
  const splitIndex = positions[1]; // 2つ目の H2 の開始位置
  return {
    firstHalf: html.slice(0, splitIndex),
    secondHalf: html.slice(splitIndex),
  };
}

export const revalidate = 3600;

// カニバリゼーション対策: 特定記事のcanonicalを対応する固定ページに向ける
// 2026-05-13: 30%コスト系の override を削除（next.config.ts の redirect と
// 逆向きに衝突していたため。統合方向は redirect 側に一本化）
const CANONICAL_OVERRIDES: Record<string, string> = {};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "記事が見つかりません" };
  const ogImages = article.coverImage
    ? [{ url: article.coverImage, width: 1200, height: 630, alt: article.title }]
    : [
        {
          url: `/og?title=${encodeURIComponent(article.title)}&subtitle=${encodeURIComponent(article.description || "GCInsight 記事")}&type=article`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ];
  return {
    title: `${article.title} | ガバメントクラウド移行状況ダッシュボード`,
    description: article.description,
    alternates: { canonical: CANONICAL_OVERRIDES[slug] ?? `/articles/${slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ogImages.map((img) => img.url),
    },
  };
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  // clusters.ts 準拠タグ
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

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { "@type": "Organization", name: article.author ?? "GCInsight編集部" },
    publisher: { "@type": "Organization", name: "GCInsight" },
    ...(article.coverImage ? { image: article.coverImage } : {}),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Breadcrumb items={[{ label: "コラム・解説", href: "/articles" }, { label: article.title }]} />

      {article.coverImage && (
        <div className="card overflow-hidden">
          {/* fetchpriority=high: LCPヒーロー画像をブラウザに最優先プリロードさせる */}
          <Image src={article.coverImage} alt={article.title}
            width={1200} height={630}
            className="w-full h-auto"
            priority />
        </div>
      )}

      <div className="card p-6 space-y-4">
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag: string) => {
              const c = TAG_COLORS[tag] ?? { bg: "#f1f5f9", text: "#475569" };
              return (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: c.bg, color: c.text }}>{tag}</span>
              );
            })}
          </div>
        )}
        <h1 className="text-xl font-extrabold leading-snug" style={{ color: "var(--color-text-primary)" }}>
          {article.title}
        </h1>
        {article.description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {article.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-2 border-t border-gray-100"
          style={{ color: "var(--color-text-muted)" }}>
          {article.date && <span>公開: {article.date}</span>}
          {article.updatedAt && article.updatedAt.slice(0, 10) !== article.date?.slice(0, 10) && (
            <span>最終更新: {article.updatedAt.slice(0, 10)}</span>
          )}
          {article.author && <span>{article.author}</span>}
        </div>
      </div>

      {(() => {
        const split = splitAtSecondH2(article.contentHtml);
        if (!split) {
          // H2 が3個未満の短い記事は CTA を挿入せず、従来通り単一 MermaidRenderer
          return (
            <MermaidRenderer
              html={article.contentHtml}
              className="card p-6 prose-article"
            />
          );
        }
        return (
          <>
            <MermaidRenderer
              html={split.firstHalf}
              className="card p-6 pb-2 prose-article"
            />
            <InlineNewsletterCTA source={`newsletter_article_mid_${slug}`} />
            <MermaidRenderer
              html={split.secondHalf}
              className="card p-6 pt-2 prose-article"
            />
          </>
        );
      })()}

      {/* 出典・参考文献 */}
      {article.sources && Array.isArray(article.sources) && article.sources.length > 0 && (
        <div className="card p-6 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <BookOpen size={16} aria-hidden="true" />
            参考文献・出典
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {(article.sources as { url: string; title: string; org: string; accessed?: string }[]).map(
              (src, i) => (
                <li key={i} className="leading-relaxed">
                  {src.org && (
                    <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {src.org}
                    </span>
                  )}
                  {src.org && src.title && " — "}
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:opacity-70"
                      style={{ color: "var(--color-brand-secondary)" }}
                    >
                      {src.title || src.url}
                    </a>
                  ) : (
                    <span>{src.title}</span>
                  )}
                  {src.accessed && (
                    <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>
                      （{src.accessed} アクセス）
                    </span>
                  )}
                </li>
              )
            )}
          </ol>
        </div>
      )}

      {/* 執筆者プロフィール */}
      <div className="card p-5 flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: "#00338D18", color: "#00338D" }}>
          GC
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {article.author ?? "GCInsight編集部"}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            ガバメントクラウド・自治体標準化を専門に調査するリサーチチーム。デジタル庁・総務省公表データを一次資料として継続的に分析し、自治体DX担当者・ITベンダー向けに実務情報を提供しています。
          </p>
        </div>
      </div>

      {(() => {
        const cluster = getClusterForTags(article.tags ?? []);
        if (!cluster) return null;
        return (
          <>
            <ArticleCTA cluster={cluster} />
            <RelatedArticles cluster={cluster} excludeSlug={slug} />
          </>
        );
      })()}

      <MunicipalityCTASection source={`newsletter_article_municipality_${slug}`} />

      <ArticleNewsletterBanner />

      <div className="flex items-center justify-between pt-2">
        <Link href="/articles" className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}>
          ← 記事一覧に戻る
        </Link>
        <Link href="/" className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-text-muted)" }}>
          ダッシュボードへ →
        </Link>
      </div>
    </div>
  );
}
