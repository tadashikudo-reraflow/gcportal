import { createClient } from "@supabase/supabase-js";
import SearchFilter from "../components/SearchFilter";
import Link from "next/link";

export const metadata = { title: "記事一覧 | GCInsight Admin" };
export const dynamic = "force-dynamic";

type Article = {
  id: number;
  slug: string;
  title: string;
  date: string;
  tags: string[];
  is_published: boolean;
  updated_at: string;
};

async function getArticles(): Promise<Article[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, date, tags, is_published, updated_at")
    .order("updated_at", { ascending: false });
  return (data ?? []) as Article[];
}

export default async function ArticlesPage() {
  const articles = await getArticles();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--color-text-primary, #111)" }}
          >
            記事一覧
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            全 {articles.length} 件 &nbsp;/&nbsp;
            公開 {articles.filter((a) => a.is_published).length} 件 &nbsp;/&nbsp;
            下書き {articles.filter((a) => !a.is_published).length} 件
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: "#002D72" }}
        >
          + 新規記事
        </Link>
      </div>

      <SearchFilter articles={articles} />
    </div>
  );
}
