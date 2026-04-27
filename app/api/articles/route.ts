import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import matter from "gray-matter";

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
        cover_image: cover_image ?? `/images/articles/${slug}.png`,
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
 * Body JSON: { slug: string, is_published: boolean, cover_image?: string, x_paste_ready?: boolean }
 */
export async function PATCH(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, is_published, cover_image, x_paste_ready } = await req.json();
  if (!slug || typeof is_published !== "boolean") {
    return NextResponse.json({ error: "slug and is_published are required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // content は除外し、指定されたフィールドのみ更新
  const updateData: Record<string, unknown> = { is_published, updated_at: new Date().toISOString() };
  if (cover_image !== undefined) updateData.cover_image = cover_image;
  if (x_paste_ready !== undefined) updateData.x_paste_ready = x_paste_ready;

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
    message: is_published ? `記事「${slug}」を公開しました` : `記事「${slug}」を下書きに戻しました`,
  });
}

/**
 * GET /api/articles — 公開記事一覧（外部連携用）
 */
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("articles")
    .select("slug, title, description, date, tags, author, is_published")
    .eq("is_published", true)
    .order("date", { ascending: false });

  return NextResponse.json({ articles: data ?? [] });
}
