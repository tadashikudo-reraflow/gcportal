/**
 * Markdown記事 → Supabase DB 同期スクリプト
 *
 * 使い方:
 *   npx tsx scripts/migrate-articles-to-db.ts              # 新規のみ追加（既存はスキップ）
 *   npx tsx scripts/migrate-articles-to-db.ts --update      # 既存記事も上書き更新
 *   npx tsx scripts/migrate-articles-to-db.ts --slug gc-migration-cost-causes --update  # 1記事だけ更新
 *
 * 環境変数:
 *   ARTICLES_DIR — 記事MDの読み込み元（省略時: content/articles/）
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * 動作:
 *   1. ARTICLES_DIR/*.md を読み込み
 *   2. frontmatter を解析
 *   3. Markdown → HTML 変換
 *   4. Supabase articles テーブルに insert or upsert
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { createClient } from "@supabase/supabase-js";

/**
 * 記事MDの読み込み元:
 *   1. 環境変数 ARTICLES_DIR が設定されていればそちらを優先
 *   2. 環境変数 GDRIVE_WORKSPACE があれば contents/PJ19/articles/ を使用
 *   3. いずれも未設定なら content/articles/ をフォールバック
 */
const ARTICLES_DIR =
  process.env.ARTICLES_DIR ??
  (process.env.GDRIVE_WORKSPACE
    ? path.join(process.env.GDRIVE_WORKSPACE, "contents", "PJ19", "articles")
    : path.join(process.cwd(), "content", "articles"));

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    update: args.includes("--update"),
    slug: args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null,
  };
}

async function main() {
  const { update, slug: targetSlug } = parseArgs();
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
    console.log(`No articles directory found at: ${ARTICLES_DIR}`);
    return;
  }

  let files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));

  if (targetSlug) {
    files = files.filter((f) => f.replace(/\.md$/, "") === targetSlug);
    if (files.length === 0) {
      console.error(`Slug not found: ${targetSlug}`);
      process.exit(1);
    }
  }

  const mode = update ? "INSERT + UPDATE" : "INSERT only (use --update to overwrite)";
  console.log(`Source: ${ARTICLES_DIR}`);
  console.log(`Mode:   ${mode}`);
  console.log(`Found ${files.length} Markdown articles.\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filename of files) {
    const slug = filename.replace(/\.md$/, "");
    const filePath = path.join(ARTICLES_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);

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
      cover_image: data.coverImage ?? `/images/articles/${slug}.png`,
      is_published: true,
      sources: [],
    };

    // Check if already exists in DB
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      if (!update) {
        console.log(`  SKIP    ${slug} (already in DB, use --update to overwrite)`);
        skipped++;
        continue;
      }

      // Update existing
      const { error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", existing.id);

      if (error) {
        console.error(`  ERROR   ${slug}: ${error.message}`);
        errors++;
      } else {
        console.log(`  UPDATE  ${slug} (id=${existing.id})`);
        updated++;
      }
    } else {
      // Insert new
      const { error } = await supabase.from("articles").insert(payload);

      if (error) {
        console.error(`  ERROR   ${slug}: ${error.message}`);
        errors++;
      } else {
        console.log(`  INSERT  ${slug}`);
        inserted++;
      }
    }
  }

  console.log(`\nDone: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${errors} errors`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
