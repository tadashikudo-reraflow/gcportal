"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyPassword, createAdminToken, COOKIE_NAME } from "@/lib/auth";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // 管理操作はservice_role keyを使用（なければanon keyで代用）
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

// ログイン
export async function loginAction(formData: FormData): Promise<void> {
  const password = formData.get("password") as string;
  const next = (formData.get("next") as string) || "/admin";

  if (!verifyPassword(password)) {
    redirect(`/admin/login?error=${encodeURIComponent("パスワードが違います")}&next=${encodeURIComponent(next)}`);
  }

  const token = await createAdminToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24時間
    path: "/",
  });

  redirect(next);
}

// ログアウト
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}

// 記事保存（新規 or 更新）
export async function saveArticleAction(formData: FormData) {
  const supabase = getAdminClient();

  const id = formData.get("id") as string | null;
  const slug = (formData.get("slug") as string).trim();
  const title = (formData.get("title") as string).trim();
  const description = (formData.get("description") as string).trim();
  const content = formData.get("content") as string;
  const date = formData.get("date") as string;
  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw
    .split(/[,、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const author = (formData.get("author") as string).trim();
  const is_published = formData.get("is_published") === "true";
  const sourcesRaw = formData.get("sources") as string | null;
  const sources = sourcesRaw ? JSON.parse(sourcesRaw) : [];

  const payload = { slug, title, description, content, date, tags, author, is_published, sources };

  if (id) {
    await supabase.from("articles").update(payload).eq("id", id);
  } else {
    await supabase.from("articles").insert(payload);
  }

  revalidatePath("/articles");
  revalidatePath(`/articles/${slug}`);
  revalidatePath("/admin");

  redirect("/admin");
}

// 記事削除
export async function deleteArticleAction(id: number) {
  const supabase = getAdminClient();
  await supabase.from("articles").delete().eq("id", id);
  revalidatePath("/articles");
  revalidatePath("/admin");
  redirect("/admin");
}

// 自動保存（下書き・リダイレクトなし）
export async function autoSaveArticleAction(formData: FormData): Promise<{ savedAt: string; id?: number }> {
  const supabase = getAdminClient();

  const id = formData.get("id") as string | null;
  const slug = ((formData.get("slug") as string) ?? "").trim();
  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim();
  const content = (formData.get("content") as string) ?? "";
  const date = (formData.get("date") as string) ?? "";
  const tagsRaw = (formData.get("tags") as string) ?? "";
  const tags = tagsRaw.split(/[,、\s]+/).map((t) => t.trim()).filter(Boolean);
  const author = ((formData.get("author") as string) ?? "").trim();
  const category = ((formData.get("category") as string) ?? "").trim();
  const featured_image = ((formData.get("featured_image") as string) ?? "").trim();
  const content_format = (formData.get("content_format") as string) ?? "html";
  const sourcesRaw = (formData.get("sources") as string) ?? "[]";
  const sources = JSON.parse(sourcesRaw);

  const payload = {
    slug: slug || `draft-${Date.now()}`,
    title,
    description,
    content,
    content_format,
    date,
    tags,
    author,
    category,
    featured_image,
    sources,
    is_published: false,
  };

  if (id) {
    await supabase.from("articles").update(payload).eq("id", id);
    revalidatePath("/admin");
    return { savedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) };
  } else {
    const { data } = await supabase.from("articles").insert(payload).select("id").single();
    revalidatePath("/admin");
    return {
      savedAt: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      id: data?.id,
    };
  }
}

// クイックドラフト保存（管理ダッシュボードから）
export async function quickDraftAction(formData: FormData) {
  const supabase = getAdminClient();
  const title = ((formData.get("title") as string) ?? "").trim();
  const content = (formData.get("content") as string) ?? "";
  const slug = `draft-${Date.now()}`;
  await supabase.from("articles").insert({ slug, title, content, is_published: false });
  revalidatePath("/admin");
}

// 公開/下書き切替
export async function togglePublishAction(id: number, current: boolean) {
  const supabase = getAdminClient();
  await supabase
    .from("articles")
    .update({ is_published: !current })
    .eq("id", id);
  revalidatePath("/articles");
  revalidatePath("/admin");
}
