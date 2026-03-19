import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import ArticleEditor from "../ArticleEditor";

export const dynamic = "force-dynamic";

async function getArticle(id: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return <ArticleEditor article={article} />;
}
