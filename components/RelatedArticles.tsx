import Link from "next/link";
import { getArticlesByTags } from "@/lib/articles";
import type { ClusterConfig } from "@/lib/clusters";

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  ガバメントクラウド: { bg: "#fff3e0", text: "#e65100" },
  自治体標準化: { bg: "#e8f5e9", text: "#2e7d32" },
  コスト: { bg: "#fce4ec", text: "#c62828" },
  FinOps: { bg: "#fce4ec", text: "#c62828" },
  移行: { bg: "#e3f2fd", text: "#1565c0" },
  ベンダー: { bg: "#f3e5f5", text: "#6a1b9a" },
  比較: { bg: "#f3e5f5", text: "#6a1b9a" },
  特定移行支援: { bg: "#e0f7fa", text: "#00695c" },
  遅延: { bg: "#fff3e0", text: "#e65100" },
  リスク: { bg: "#fce4ec", text: "#c62828" },
  "2026年問題": { bg: "#fce4ec", text: "#c62828" },
  業務別: { bg: "#e8eaf6", text: "#283593" },
  標準化: { bg: "#e8f5e9", text: "#2e7d32" },
  クラウド: { bg: "#e3f2fd", text: "#1565c0" },
  セキュリティ: { bg: "#fce4ec", text: "#c62828" },
  技術: { bg: "#e3f2fd", text: "#1565c0" },
  解説: { bg: "#e0f7fa", text: "#00695c" },
};

type Props = {
  cluster: ClusterConfig;
  excludeSlug?: string;
  maxItems?: number;
};

export default async function RelatedArticles({
  cluster,
  excludeSlug,
  maxItems = 3,
}: Props) {
  const articles = await getArticlesByTags(cluster.tags, excludeSlug, maxItems);

  if (articles.length === 0) return null;

  return (
    <section className="mt-10 pt-8 border-t" style={{ borderColor: "var(--color-border, #e5e7eb)" }}>
      <h2
        className="text-base font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span>📖</span>
        {cluster.label} 関連コラム
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="card p-4 hover:shadow-md transition-shadow block"
          >
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {article.tags.slice(0, 2).map((tag) => {
                  const c = TAG_COLORS[tag] ?? { bg: "#f1f5f9", text: "#475569" };
                  return (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: c.bg, color: c.text }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
            <h3
              className="text-sm font-semibold leading-snug line-clamp-2 mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              {article.title}
            </h3>
            <p
              className="text-xs leading-relaxed line-clamp-2 mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {article.description}
            </p>
            <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
              {article.date}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 text-right">
        <Link
          href="/articles"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}
        >
          すべてのコラムを見る →
        </Link>
      </div>
    </section>
  );
}
