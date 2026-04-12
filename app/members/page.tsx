import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import ContentTabNav from "@/components/ContentTabNav";
import { REPORTS } from "./reports";
import NewsletterModal from "@/components/NewsletterModal";

export const metadata: Metadata = {
  title: "会員限定レポート｜GCInsight",
  description: "GCInsightニュースレター登録者向けの深掘りレポート一覧。ガバメントクラウド移行コスト・FinOpsの実践情報。",
  robots: { index: false, follow: false },
};

export default function MembersPage() {
  const reports = Object.values(REPORTS).sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "会員限定レポート" }]} />
      <div className="pb-2">
        <h1 className="page-title">会員限定レポート</h1>
        <p className="page-subtitle">ニュースレター登録者向けの深掘りレポート</p>
      </div>
      <ContentTabNav />

      <div className="space-y-3">
        {reports.map((report) => {
          const [year, month] = report.publishedAt.split("-");
          const dateLabel = `${year}年${parseInt(month)}月号`;
          return (
            <Link
              key={report.slug}
              href={`/members/${report.slug}`}
              className="card p-5 flex items-start justify-between gap-4 no-underline group"
            >
              <div className="flex-1">
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-brand-primary)" }}>
                  🔒 {dateLabel}
                </p>
                <p className="text-sm font-bold leading-snug group-hover:underline" style={{ color: "var(--color-text-primary)" }}>
                  {report.title}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {report.subtitle}
                </p>
              </div>
              <span className="text-xs font-semibold shrink-0 mt-1" style={{ color: "var(--color-brand-primary)" }}>
                読む →
              </span>
            </Link>
          );
        })}
      </div>

      <div className="rounded-lg border px-5 py-4 flex items-center justify-between gap-4" style={{ borderColor: "var(--color-border)", borderLeftWidth: 3, borderLeftColor: "var(--color-brand-primary)" }}>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <span className="font-semibold">会員限定コンテンツ</span> — ニュースレター登録者に毎月お届けしています。
        </p>
        <NewsletterModal
          label="無料登録"
          source="newsletter_members_page"
          buttonStyle={{
            flexShrink: 0,
            padding: "6px 14px",
            backgroundColor: "#00338D",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: "0.75rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        />
      </div>
    </div>
  );
}
