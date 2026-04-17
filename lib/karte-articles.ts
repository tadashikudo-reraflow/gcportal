import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ).schema("karte");
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ).schema("karte");
}

export type KarteArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  author?: string;
  coverImage?: string;
};

export type KarteArticle = KarteArticleMeta & {
  contentHtml: string;
  sources?: { url: string; title: string; org: string; accessed?: string }[];
};

/** 公開済みカルテ記事の一覧（日付降順） */
export async function getAllKarteArticles(): Promise<KarteArticleMeta[]> {
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

/** slug で1記事取得 */
export async function getKarteArticleBySlug(slug: string): Promise<KarteArticle | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("articles")
    .select("slug, title, description, date, tags, author, cover_image, content, sources")
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
    coverImage: data.cover_image ?? undefined,
    contentHtml: data.content ?? "",
    sources: data.sources ?? [],
  };
}

/** 管理用: カルテ記事全件（下書き含む） */
export async function getAllKarteArticlesAdmin(): Promise<
  (KarteArticleMeta & { id: number; is_published: boolean })[]
> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, description, date, tags, author, cover_image, is_published")
    .order("date", { ascending: false });

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
    is_published: a.is_published ?? false,
  }));
}
