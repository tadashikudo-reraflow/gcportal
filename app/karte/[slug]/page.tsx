import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getKarteArticleBySlug } from "@/lib/karte-articles";
import MermaidRenderer from "@/components/MermaidRenderer";
import ArticleNewsletterBanner from "@/components/ArticleNewsletterBanner";
import Breadcrumb from "@/components/Breadcrumb";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getKarteArticleBySlug(slug);
  if (!article) return { title: "記事が見つかりません" };

  const ogImages = article.coverImage
    ? [{ url: article.coverImage, width: 1200, height: 630, alt: article.title }]
    : [
        {
          url: `/og?title=${encodeURIComponent(article.title)}&subtitle=${encodeURIComponent(article.description || "GCInsight for 電子カルテ標準化")}&type=article`,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ];

  return {
    title: `${article.title} | GCInsight for 電子カルテ標準化`,
    description: article.description,
    alternates: { canonical: `/karte/${slug}` },
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

export default async function KarteArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getKarteArticleBySlug(slug);
  if (!article) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { "@type": "Organization", name: article.author ?? "GCInsight Medical編集部" },
    publisher: { "@type": "Organization", name: "GCInsight for 電子カルテ標準化" },
    ...(article.coverImage ? { image: article.coverImage } : {}),
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Breadcrumb
        homeHref="/karte"
        homeLabel="電子カルテ標準化"
        items={[
          { label: article.title },
        ]}
      />

      {article.coverImage && (
        <div className="card overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            width={1200}
            height={630}
            className="w-full h-auto"
            priority
          />
        </div>
      )}

      <div className="card p-6 space-y-4">
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag: string) => {
              const c = TAG_COLORS[tag] ?? { bg: "#f1f5f9", text: "#475569" };
              return (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: c.bg, color: c.text }}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        )}
        <h1
          className="text-xl font-extrabold leading-snug"
          style={{ color: "var(--color-text-primary)" }}
        >
          {article.title}
        </h1>
        {article.description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            {article.description}
          </p>
        )}
        <div
          className="flex items-center gap-4 text-xs pt-2 border-t border-gray-100"
          style={{ color: "var(--color-text-muted)" }}
        >
          {article.date && <span>{article.date}</span>}
          {article.author && <span>{article.author}</span>}
        </div>
      </div>

      <MermaidRenderer
        html={article.contentHtml.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*/, "")}
        className="card p-6 prose-article"
      />

      {article.sources && Array.isArray(article.sources) && article.sources.length > 0 && (
        <div className="card p-6 space-y-3">
          <h2
            className="text-sm font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <BookOpen size={16} aria-hidden="true" />
            参考文献・出典
          </h2>
          <ol
            className="list-decimal list-inside space-y-2 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
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

      <ArticleNewsletterBanner />

      <div className="flex items-center justify-between pt-2">
        <Link
          href="/karte"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}
        >
          ← 記事一覧に戻る
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-text-muted)" }}
        >
          ダッシュボードへ →
        </Link>
      </div>
    </div>
  );
}
