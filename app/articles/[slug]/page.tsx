import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getArticleBySlug, getAllArticles } from "@/lib/articles";
import { getClusterForTags } from "@/lib/clusters";
import RelatedArticles from "@/components/RelatedArticles";
import ArticleCTA from "@/components/ArticleCTA";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

type Props = { params: Promise<{ slug: string }> };

async function getArticleFromDb(slug: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();
    if (!data) return null;

    // markdown → html
    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(data.content ?? "");

    return { ...data, contentHtml: processed.toString() };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  const fileArticles = getAllArticles();
  return fileArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = (await getArticleFromDb(slug)) ?? (await getArticleBySlug(slug));
  if (!article) return { title: "記事が見つかりません" };
  return {
    title: `${article.title} | 自治体標準化ダッシュボード`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
    },
  };
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  ガバメントクラウド: { bg: "#fff3e0", text: "#e65100" },
  自治体標準化:       { bg: "#e8f5e9", text: "#2e7d32" },
  コスト:             { bg: "#fce4ec", text: "#c62828" },
  移行:               { bg: "#e3f2fd", text: "#1565c0" },
  AWS:                { bg: "#fff8e1", text: "#f57f17" },
  OCI:                { bg: "#fbe9e7", text: "#bf360c" },
  ベンダー:           { bg: "#f3e5f5", text: "#6a1b9a" },
  解説:               { bg: "#e0f7fa", text: "#00695c" },
  "2026年問題":       { bg: "#fce4ec", text: "#c62828" },
};

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  // DB優先、なければMarkdownファイル
  const article = (await getArticleFromDb(slug)) ?? (await getArticleBySlug(slug));
  if (!article) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <nav className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <Link href="/" className="hover:underline">TOP</Link>
        <span>/</span>
        <Link href="/articles" className="hover:underline">コラム・解説</Link>
        <span>/</span>
        <span className="truncate" style={{ color: "var(--color-text-secondary)" }}>{article.title}</span>
      </nav>

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
          {article.date && <span>📅 {article.date}</span>}
          {article.author && <span>✍️ {article.author}</span>}
        </div>
      </div>

      <div className="card p-6 prose-article"
        dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

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
