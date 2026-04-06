import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/articles";
import { getClusterForTags } from "@/lib/clusters";
import RelatedArticles from "@/components/RelatedArticles";
import ArticleCTA from "@/components/ArticleCTA";
import MermaidRenderer from "@/components/MermaidRenderer";
import ArticlePdfDownloadBanner from "@/components/ArticlePdfDownloadBanner";
import Breadcrumb from "@/components/Breadcrumb";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

// カニバリゼーション対策: 特定記事のcanonicalを対応する固定ページに向ける
const CANONICAL_OVERRIDES: Record<string, string> = {
  "gc-finops-guide": "/finops",
  // カニバリゼーション対策: 旧記事(03-31)→新記事(04-01)へcanonical
  "govcloud-30percent-cost-reduction-reality": "/articles/gc-cost-30percent-reduction-goal-verification",
};

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
        <div className="flex items-center gap-4 text-xs pt-2 border-t border-gray-100"
          style={{ color: "var(--color-text-muted)" }}>
          {article.date && <span>{article.date}</span>}
          {article.author && <span>{article.author}</span>}
        </div>
      </div>

      <ArticlePdfDownloadBanner articleTitle={article.title} slug={slug} />

      <MermaidRenderer
        html={article.contentHtml}
        className="card p-6 prose-article"
      />

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

      <ArticlePdfDownloadBanner articleTitle={article.title} slug={slug} />

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
