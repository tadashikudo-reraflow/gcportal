import type { Metadata } from "next";
import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import Breadcrumb from "@/components/Breadcrumb";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "コラム・解説記事 | ガバメントクラウド移行状況ダッシュボード",
  description:
    "ガバメントクラウド・自治体標準化システムに関するコラム・解説記事の一覧。移行コスト・特定移行認定・遅延リスクなど自治体DX推進担当者向けの実務情報。",
  alternates: { canonical: "/articles" },
};
export const dynamic = "force-dynamic";

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

/** coverImage がない場合のプレースホルダー */
function ArticlePlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full aspect-[16/9] flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #002D72 0%, #0066FF 100%)" }}>
      <span className="text-white text-sm font-bold px-6 text-center leading-snug opacity-80">
        {title.length > 30 ? title.slice(0, 30) + "…" : title}
      </span>
    </div>
  );
}

export default async function ArticlesPage() {
  const articles = await getAllArticles();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "コラム・解説記事" }]} />
      <div className="pb-2">
        <h1 className="page-title">コラム・解説記事</h1>
        <p className="page-subtitle">ガバメントクラウド・自治体標準化に関する実務情報・解説</p>
      </div>

      {articles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>記事準備中です</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article) => (
            <Link key={article.slug} href={`/articles/${article.slug}`}
              className="article-card group">
              {article.coverImage ? (
                <div className="w-full aspect-[5/2] overflow-hidden bg-[#EEF4FB]">
                  <img src={article.coverImage} alt={article.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy" decoding="async" width={1500} height={600} />
                </div>
              ) : (
                <ArticlePlaceholder title={article.title} />
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
