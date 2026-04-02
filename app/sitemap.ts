import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/articles";

const BASE_URL = "https://gcinsight.jp";

// 都道府県ページは /prefectures/:pref → /progress?pref=:pref へ301リダイレクトされるため
// sitemapからは除外（PREFECTURES配列は参照用に残す）

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    // /prefectures は proxy で / へ301リダイレクトされるため除外
    { url: `${BASE_URL}/progress`,      lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/businesses`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/finops`,        lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/costs`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/packages`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/cloud`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/articles`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/sources`,       lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/timeline`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/privacy`,       lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    // 以下は301リダイレクト対象のため除外:
    // /risks → /progress?status=critical
    // /tokutei → /progress?status=tokutei
    // /benchmark → /progress
    // /cost-reduction → /finops
    // /report → /finops
  ];

  const articles = await getAllArticles();
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: article.date ? new Date(article.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...articlePages];
}
