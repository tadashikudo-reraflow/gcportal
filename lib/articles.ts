import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

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
};

/** 全記事のメタ情報を日付降順で取得 */
export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];

  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".md"));

  const articles = files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const filePath = path.join(ARTICLES_DIR, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "",
      tags: data.tags ?? [],
      author: data.author,
      coverImage: data.coverImage,
    } satisfies ArticleMeta;
  });

  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** タグに一致する記事を取得（内部リンク用） */
export function getArticlesByTags(
  tags: string[],
  excludeSlug?: string,
  maxItems = 3
): ArticleMeta[] {
  const all = getAllArticles();
  return all
    .filter(
      (a) =>
        a.slug !== excludeSlug &&
        a.tags.some((t) => tags.includes(t))
    )
    .slice(0, maxItems);
}

/** slug から記事本文（HTML）を取得 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const filePath = path.join(ARTICLES_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content);

  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    date: data.date ?? "",
    tags: data.tags ?? [],
    author: data.author,
    coverImage: data.coverImage,
    contentHtml: processed.toString(),
  };
}
