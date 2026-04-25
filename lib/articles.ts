import { createClient } from "@supabase/supabase-js";

/** 公開データ読み取り用（anon key = RLS適用） */
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/** 管理操作用（Service Role Key = RLSバイパス） */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  author?: string;
  coverImage?: string;
};

export type Article = ArticleMeta & {
  contentHtml: string;
  sources?: { url: string; title: string; org: string; accessed?: string }[];
  updatedAt?: string;
};

/** 全公開記事のメタ情報を日付降順で取得（Supabase） */
export async function getAllArticles(): Promise<ArticleMeta[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("articles")
    .select("slug, title, description, date, tags, author, cover_image")
    .eq("is_published", true)
    .order("date", { ascending: false });

  if (!data) return [];

  return data.map((a) => ({
    slug: a.slug,
    title: a.title ?? a.slug,
    description: a.description ?? "",
    date: a.date ?? "",
    tags: a.tags ?? [],
    author: a.author,
    coverImage: a.cover_image ?? undefined,
  }));
}

/** 全記事（下書き含む）を取得（管理用） */
export async function getAllArticlesAdmin(): Promise<(ArticleMeta & { id: number; is_published: boolean })[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, description, date, tags, author, cover_image, is_published")
    .order("updated_at", { ascending: false });

  if (!data) return [];

  return data.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title ?? a.slug,
    description: a.description ?? "",
    date: a.date ?? "",
    tags: a.tags ?? [],
    author: a.author,
    coverImage: a.cover_image ?? undefined,
    is_published: a.is_published,
  }));
}

/** タグに一致する公開記事を取得（内部リンク用） */
export async function getArticlesByTags(
  tags: string[],
  excludeSlug?: string,
  maxItems = 3
): Promise<ArticleMeta[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("articles")
    .select("slug, title, description, date, tags, author, cover_image")
    .eq("is_published", true)
    .overlaps("tags", tags)
    .order("date", { ascending: false })
    .limit(maxItems + 1);

  if (!data) return [];

  return data
    .filter((a) => a.slug !== excludeSlug)
    .slice(0, maxItems)
    .map((a) => ({
      slug: a.slug,
      title: a.title ?? a.slug,
      description: a.description ?? "",
      date: a.date ?? "",
      tags: a.tags ?? [],
      author: a.author,
      coverImage: a.cover_image ?? undefined,
    }));
}

/**
 * slug から記事本文（HTML）を取得
 *
 * ⚠️ アーキテクチャ注意: DBには変換済みHTMLが格納されている。
 * ここで remark 等の MD→HTML 変換を行ってはいけない（二重変換で内容が破壊される）。
 * 変換は入口（POST /api/articles または scripts/migrate-articles-to-db.ts）で1回だけ行う。
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!data) return null;

  return {
    slug: data.slug,
    title: data.title ?? data.slug,
    description: data.description ?? "",
    date: data.date ?? "",
    tags: data.tags ?? [],
    author: data.author,
    coverImage: data.cover_image,
    contentHtml: data.content ?? "",
    sources: data.sources ?? [],
    updatedAt: data.updated_at ?? undefined,
  };
}
