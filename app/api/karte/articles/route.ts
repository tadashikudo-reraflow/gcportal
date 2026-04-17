import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import matter from "gray-matter";

function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  ).schema("karte");
}

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && auth === `Bearer ${expected}`;
}

/**
 * POST /api/karte/articles — karte記事作成（karte-article Agent用）
 *
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 * Body JSON:
 *   slug, title, description, content (Markdown本文),
 *   date, tags[], author, sources[], is_published (default: false)
 */
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
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
    author = "GCInsight Medical編集部",
    sources = [],
    cover_image,
    is_published = false,
  } = body;

  if (!slug || !title) {
    return NextResponse.json({ error: "slug and title are required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // YAMLフロントマターをstrip
  const { content: markdownBody } = matter(content);

  // Markdown → HTML 変換
  // ⚠️ sanitize: false 必須 — Mermaid コードブロック等のHTMLタグを保持するため
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
        cover_image: cover_image ?? null,
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
    revalidatePath(`/karte/${slug}`);
    revalidatePath("/karte");
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
 * PATCH /api/karte/articles — 公開状態のみ更新（content上書き防止）
 *
 * Headers: Authorization: Bearer <ADMIN_PASSWORD>
 * Body JSON: { slug: string, is_published: boolean }
 */
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, is_published } = await req.json();
  if (!slug || typeof is_published !== "boolean") {
    return NextResponse.json({ error: "slug and is_published are required" }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("articles")
    .update({ is_published, updated_at: new Date().toISOString() })
    .eq("slug", slug)
    .select("id, slug, is_published")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/karte/${slug}`);
  revalidatePath("/karte");

  return NextResponse.json({
    ok: true,
    article: data,
    message: is_published ? `記事「${slug}」を公開しました` : `記事「${slug}」を下書きに戻しました`,
  });
}

/**
 * GET /api/karte/articles — 公開記事一覧（外部連携用）
 * karte スキーマはanon key未設定のためadmin clientを使用。
 * admin clientはRLSを迂回するため、is_published=true フィルタが唯一の公開境界線。
 */
export async function GET() {
  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    // 内部エラー詳細は外部に露出しない
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  const { data } = await supabase
    .from("articles")
    .select("slug, title, description, date, tags, author, is_published")
    .eq("is_published", true)  // ← admin clientのためRLS非依存。このフィルタを削除しないこと
    .order("date", { ascending: false });

  return NextResponse.json({ articles: data ?? [] });
}
