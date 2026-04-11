import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { REPORTS } from "../reports";
import NewsletterModal from "@/components/NewsletterModal";

type Props = { params: Promise<{ slug: string }> };

async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(markdown);
  return result.toString();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const report = REPORTS[slug];
  if (!report) return { title: "Not Found" };
  return {
    title: report.title,
    description: report.subtitle,
    robots: { index: false, follow: false },
  };
}

export default async function MemberReportPage({ params }: Props) {
  const { slug } = await params;
  const report = REPORTS[slug];
  if (!report) notFound();

  // マークダウンファイルを読み込む
  const mdPath = join(process.cwd(), "content/reports", `${slug}.md`);
  let contentHtml = "";
  try {
    const raw = await readFile(mdPath, "utf-8");
    // frontmatter を除去
    const body = raw.replace(/^---[\s\S]*?---\n/, "");
    contentHtml = await markdownToHtml(body);
  } catch {
    // MDファイルがない場合は sections フォールバック
    const fallback = report.sections.map((s) => `## ${s.heading}\n\n${s.body}`).join("\n\n---\n\n");
    contentHtml = await markdownToHtml(fallback);
  }

  const [year, month, day] = report.publishedAt.split("-");
  const dateLabel = `${year}年${parseInt(month)}月${parseInt(day)}日`;

  return (
    <main style={{ background: "var(--color-surface)", minHeight: "100vh" }}>
      {/* ── Hero ── */}
      <section style={{ backgroundColor: "#00338D", padding: "48px 16px 40px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94b4d8", marginBottom: 12 }}>
            GCInsight 会員限定レポート · {dateLabel}
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.3, color: "#FFFFFF", marginBottom: 12 }}>
            {report.title}
          </h1>
          <p style={{ fontSize: "1rem", color: "#c8d8f0", lineHeight: 1.6 }}>
            {report.subtitle}
          </p>
        </div>
      </section>

      {/* ── 本文 ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 16px 80px" }}>
        <div
          className="report-body"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* ── フッターCTA ── */}
        <div
          style={{
            marginTop: 64,
            borderRadius: 16,
            backgroundColor: "#00338D",
            padding: "32px 28px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "#94b4d8", marginBottom: 8 }}>
            会員限定コンテンツ
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>
            毎月のレポートをニュースレターでお届けしています
          </p>
          <p style={{ fontSize: "0.85rem", color: "#c8d8f0", marginBottom: 16 }}>
            未登録の方はこちらから無料でご参加いただけます。
          </p>
          <NewsletterModal
            label="無料でニュースレターに登録 →"
            source="newsletter_report_footer"
            buttonStyle={{
              padding: "10px 20px",
              backgroundColor: "#fff",
              color: "#00338D",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: "pointer",
              marginBottom: 16,
            }}
          />
          <p style={{ fontSize: "0.75rem", color: "#94b4d8" }}>
            このレポートの第三者への転送・SNS掲載はご遠慮ください。
          </p>
        </div>
      </div>
    </main>
  );
}
