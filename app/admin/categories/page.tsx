export const dynamic = "force-dynamic";
export const metadata = { title: "カテゴリー管理 | GCInsight Admin" };

import { createClient } from "@supabase/supabase-js";
import CategoryClient from "./CategoryClient";

type CategoryStat = {
  category: string;
  count: number;
};

async function getCategories(): Promise<CategoryStat[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("articles")
    .select("category")
    .not("category", "is", null)
    .neq("category", "");

  if (!data) return [];

  // カテゴリーを集計
  const counts: Record<string, number> = {};
  for (const row of data) {
    const cat = (row.category as string).trim();
    if (cat) counts[cat] = (counts[cat] ?? 0) + 1;
  }

  return Object.entries(counts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return <CategoryClient initialCategories={categories} />;
}
