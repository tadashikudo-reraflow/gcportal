import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { REPORTS } from "../reports";

type Props = { params: Promise<{ slug: string }> };

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

  const [year, month, day] = report.publishedAt.split("-");
  const dateLabel = `${year}年${parseInt(month)}月${parseInt(day)}日`;

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px 80px" }}>
      {/* ヘッダー */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: "0.75rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#00338D",
            marginBottom: 8,
          }}
        >
          🔒 GCInsight 会員限定レポート · {dateLabel}
        </p>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            lineHeight: 1.35,
            color: "#111827",
            marginBottom: 12,
          }}
        >
          {report.title}
        </h1>
        <p style={{ fontSize: "1rem", color: "#4B5563", lineHeight: 1.6 }}>
          {report.subtitle}
        </p>
      </div>

      <hr style={{ borderColor: "#E5E7EB", marginBottom: 40 }} />

      {/* 本文セクション */}
      {report.sections.map((section, i) => (
        <section key={i} style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "#111827",
              marginBottom: 12,
              paddingBottom: 6,
              borderBottom: "2px solid #E5E7EB",
            }}
          >
            {section.heading}
          </h2>
          <div
            style={{
              fontSize: "0.9375rem",
              color: "#374151",
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {section.body}
          </div>
        </section>
      ))}

      <hr style={{ borderColor: "#E5E7EB", margin: "40px 0" }} />

      {/* フッター */}
      <p style={{ fontSize: "0.8125rem", color: "#9CA3AF", textAlign: "center" }}>
        このレポートはGCInsightニュースレター登録者限定のコンテンツです。<br />
        第三者への転送・SNS掲載はご遠慮ください。
        <br />
        <a href="https://gcinsight.jp" style={{ color: "#6B7280" }}>
          GCInsight トップへ →
        </a>
      </p>
    </main>
  );
}
