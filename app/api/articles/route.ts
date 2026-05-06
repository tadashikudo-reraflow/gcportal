import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import matter from "gray-matter";

// cover_image はブランチ非依存の絶対URLで保存する（feature branch preview でも表示される）
const SITE_URL = "https://gcinsight.jp";

/**
 * POST /api/articles — 記事作成（gc-article Agent / 外部ツール用）
 *
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 * Body JSON:
 *   slug, title, description, content (Markdown本文),
 *   date, tags[], author, sources[], is_published (default: false)
 */
export async function POST(req: NextRequest) {
  // 認証チェック
  const auth = req.headers.get("authorization");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "ADMIN_PASSWORD not configured" }, { status: 500 });
  }
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    slug,
    title,
    description = "",
    content = "",
    date = new Date().toISOString().slice(0, 10),
    tags = [],
    author = "GCInsight編集部",
    sources = [],
    cover_image,
    is_published = false,
  } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  // YAMLフロントマターをstrip（gc-articleエージェントがMDファイルをそのまま渡した場合の保険）
  const { content: markdownBody } = matter(content);

  // Markdown → HTML 変換（API経由は常にMDを受け取りHTMLで保存）
  // ⚠️ sanitize: false 必須 — Mermaid コードブロック等のHTMLタグを保持するため。
  // true にすると Mermaid 図・テーブル等のHTMLが除去されて表示が壊れる。
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdownBody);
  const contentHtml = processed.toString();

  // upsert: 同じslugがあれば更新、なければ新規作成
  const { data, error } = await supabase
    .from("articles")
    .upsert(
      {
        slug,
        title,
        description,
        content: contentHtml,
        content_format: "html",
        date,
        tags,
        author,
        sources,
        cover_image: cover_image ?? `${SITE_URL}/images/articles/${slug}.png`,
        is_published,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    )
    .select("id, slug, is_published")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 公開時はVercelのISRキャッシュを即時パージ
  if (is_published) {
    revalidatePath(`/articles/${slug}`);
    revalidatePath("/articles");
  }

  return NextResponse.json({
    ok: true,
    article: data,
    message: is_published
      ? `記事「${title}」を公開しました`
      : `記事「${title}」を下書き保存しました。CMS (/admin) で公開できます`,
  });
}

/**
 * PATCH /api/articles — 公開状態・カバー画像等を更新（content上書き防止）
 *
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 * Body JSON: { slug: string, is_published?: boolean, cover_image?: string, x_paste_ready?: boolean, title?: string, description?: string }
 */
export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, is_published, cover_image, x_paste_ready, title, description } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // content/content_html は除外し、指定されたフィールドのみ更新
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof is_published === "boolean") updateData.is_published = is_published;
  if (cover_image !== undefined) updateData.cover_image = cover_image;
  if (x_paste_ready !== undefined) updateData.x_paste_ready = x_paste_ready;
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;

  const { data, error } = await supabase
    .from("articles")
    .update(updateData)
    .eq("slug", slug)
    .select("id, slug, is_published, cover_image, x_paste_ready")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/articles/${slug}`);
  revalidatePath("/articles");

  return NextResponse.json({
    ok: true,
    article: data,
    message: `記事「${slug}」を更新しました`,
  });
}

/**
 * GET /api/articles — 記事一覧
 *
 * デフォルト: 公開記事のみ・anonキー使用（外部連携用）
 *
 * Bearer <ADMIN_PASSWORD> 認証時:
 *   - 未公開記事も含めて全件返却（service_roleキー使用）
 *   - クエリパラメータ ?slug=... で特定記事をフィルタ可能
 *   - クエリパラメータ ?include_unpublished=false で公開記事のみに制限可能
 *   → scripts/generate-cover-images.mjs 等の自動化ツール向け
 *
 * いずれの場合も SELECT に `id` を含む（自動化ツールでid別フォルダ作成のため）
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;
  const isAdmin = !!adminPassword && auth === `Bearer ${adminPassword}`;

  const url = new URL(req.url);
  const slugFilter = url.searchParams.get("slug");
  const includeUnpublishedParam = url.searchParams.get("include_unpublished");
  // 管理者リクエストはデフォルトで未公開も含む。明示的に "false" 指定時のみ公開のみ。
  const includeUnpublished =
    isAdmin && includeUnpublishedParam !== "false";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    isAdmin
      ? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from("articles")
    .select("id, slug, title, description, date, tags, author, is_published, cover_image")
    .order("date", { ascending: false });

  if (!includeUnpublished) {
    query = query.eq("is_published", true);
  }
  if (slugFilter) {
    query = query.eq("slug", slugFilter);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data ?? [] });
}
