/**
 * Markdown記事 → Supabase DB ワンタイム移行スクリプト
 *
 * 使い方:
 *   npx tsx scripts/migrate-articles-to-db.ts
 *
 * 環境変数:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * 動作:
 *   1. content/articles/*.md を読み込み
 *   2. frontmatter を解析
 *   3. Markdown → HTML 変換
 *   4. Supabase articles テーブルに upsert（slug をキーに重複スキップ）
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { createClient } from "@supabase/supabase-js";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log("No articles directory found. Nothing to migrate.");
    return;
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} Markdown articles to migrate.\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of files) {
    const slug = filename.replace(/\.md$/, "");
    const filePath = path.join(ARTICLES_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

    // Check if already exists in DB
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      console.log(`  SKIP  ${slug} (already in DB, id=${existing.id})`);
      skipped++;
      continue;
    }

    // Convert Markdown → HTML
    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml, { sanitize: false })
      .process(content);

    const payload = {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      content: processed.toString(),
      content_format: "html",
      date: data.date ?? new Date().toISOString().slice(0, 10),
      tags: data.tags ?? [],
      author: data.author ?? "GCInsight編集部",
      is_published: true,
      sources: [],
    };

    const { error } = await supabase.from("articles").insert(payload);

    if (error) {
      console.error(`  ERROR ${slug}: ${error.message}`);
      errors++;
    } else {
      console.log(`  OK    ${slug}`);
      migrated++;
    }
  }

  console.log(`\nDone: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
