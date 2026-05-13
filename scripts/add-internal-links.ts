/**
 * 内部リンク一括追加スクリプト
 *
 * Usage: dotenv -e .env.local -- tsx scripts/add-internal-links.ts
 */
import "./lib/load-env";
import { createClient } from "@supabase/supabase-js";

const LINK_MAP: Record<string, [string, string][]> = {
  // 既存10記事 → 新4記事へのリンク
  "govcloud-delay-risk": [
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
  ],
  "gc-delay-municipalities-2026": [
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
  ],
  "tokutei-iko-shien-system-kyuzo-2026": [
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
  ],
  "govcloud-migration-status-check-guide": [
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
    ["lg-system-conformance-approved-products-2026", "適合確認済み製品一覧2026"],
  ],
  "standardization-vendor-list-2026": [
    ["lg-system-conformance-approved-products-2026", "適合確認済み製品一覧2026"],
  ],
  "digital-agency-ai-gennai-guide": [
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
    ["administrative-data-open-private-sector-2026", "行政データ民間開放ガイド2026"],
  ],
  "sakura-gc-certified": [
    ["lg-system-conformance-approved-products-2026", "適合確認済み製品一覧2026"],
  ],
  "gc-finops-guide": [
    ["digital-agency-ai-gennai-guide", "デジタル庁AI「源内」とは？政府AIの全容2026"],
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
  ],
  "gc-data-column-816-karakuri": [
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
  ],
  "gc-data-column-migration-overview": [
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
  ],
  // 新4記事の相互リンク（2026-05-13: digital-agency-gennai-govcloud-dx は
  // digital-agency-ai-gennai-guide に統合・redirect済のため key 削除）
  "govcloud-migration-report-2026-analysis": [
    ["digital-agency-ai-gennai-guide", "デジタル庁AI「源内」とは？政府AIの全容2026"],
    ["lg-system-conformance-approved-products-2026", "適合確認済み製品一覧2026"],
    ["administrative-data-open-private-sector-2026", "行政データ民間開放ガイド2026"],
  ],
  "lg-system-conformance-approved-products-2026": [
    ["digital-agency-ai-gennai-guide", "デジタル庁AI「源内」とは？政府AIの全容2026"],
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
    ["administrative-data-open-private-sector-2026", "行政データ民間開放ガイド2026"],
  ],
  "administrative-data-open-private-sector-2026": [
    ["digital-agency-ai-gennai-guide", "デジタル庁AI「源内」とは？政府AIの全容2026"],
    ["govcloud-migration-report-2026-analysis", "2026年移行報告書の詳細分析"],
    ["lg-system-conformance-approved-products-2026", "適合確認済み製品一覧2026"],
  ],
};

function buildRelatedSection(links: [string, string][]): string {
  const items = links
    .map(([slug, text]) => `<li><a href="/articles/${slug}">${text}</a></li>`)
    .join("\n");
  return `\n<hr>\n<section class="related-articles">\n<h2>関連記事</h2>\n<ul>\n${items}\n</ul>\n</section>\n`;
}

function addRelatedSection(html: string, links: [string, string][]): string {
  const MARKER = '<section class="related-articles">';
  const related = buildRelatedSection(links);

  if (html.includes(MARKER)) {
    const hrIdx = html.lastIndexOf("<hr>");
    if (hrIdx !== -1 && html.slice(hrIdx).includes(MARKER)) {
      const sectionStart = html.indexOf(MARKER, hrIdx);
      const sectionEnd = html.indexOf("</section>", sectionStart);
      const afterSection = sectionEnd !== -1 ? html.slice(sectionEnd + "</section>".length) : "";
      return html.slice(0, hrIdx).trimEnd() + "\n" + related.trimEnd() + afterSection;
    }
  }
  return html.trimEnd() + "\n" + related;
}

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const slugs = Object.keys(LINK_MAP);
  const { data: articles, error: fetchErr } = await sb
    .from("articles")
    .select("id, slug, title, content, is_published")
    .in("slug", slugs);

  if (fetchErr) {
    console.error("Fetch error:", fetchErr.message);
    process.exit(1);
  }

  const articleMap = new Map((articles ?? []).map((a) => [a.slug, a]));
  const results = { success: [] as string[], failed: [] as string[], skipped: [] as string[] };

  for (const [slug, links] of Object.entries(LINK_MAP)) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`処理中: ${slug}`);

    const article = articleMap.get(slug);
    if (!article) {
      console.log(`  ⚠️ 記事が見つかりません`);
      results.skipped.push(slug);
      continue;
    }

    console.log(`  タイトル: ${article.title}`);
    console.log(`  ID: ${article.id}, is_published: ${article.is_published}`);

    const content = article.content ?? "";
    if (!content) {
      console.log(`  ⚠️ コンテンツが空`);
      results.skipped.push(slug);
      continue;
    }

    const newContent = addRelatedSection(content, links);
    const diff = newContent.length - content.length;

    console.log(`  追加リンク数: ${links.length}`);
    console.log(`  文字数変化: +${diff}`);
    links.forEach(([tSlug, text]) => console.log(`    → [${text}](/articles/${tSlug})`));

    const { error: updateErr } = await sb
      .from("articles")
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq("id", article.id);

    if (updateErr) {
      console.log(`  ✗ 更新失敗: ${updateErr.message}`);
      results.failed.push(slug);
    } else {
      console.log(`  ✓ 更新完了`);
      results.success.push(slug);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`完了サマリー:`);
  console.log(`  成功: ${results.success.length}件 → ${results.success.join(", ")}`);
  console.log(`  失敗: ${results.failed.length}件 → ${results.failed.join(", ")}`);
  console.log(`  スキップ: ${results.skipped.length}件 → ${results.skipped.join(", ")}`);

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
