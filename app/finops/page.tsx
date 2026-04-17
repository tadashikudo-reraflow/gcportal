import type { Metadata } from "next";
import { Suspense } from "react";
import FinopsClient from "./FinopsClient";
import FinopsLoading from "./loading";
import { getArticlesByTags, type ArticleMeta } from "@/lib/articles";
import PageNavCards from "@/components/PageNavCards";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ガバメントクラウド コスト削減30%の実践手順【2026年最新】FinOps完全ガイド｜GCInsight",
  description:
    "移行後コスト平均2.3倍・最大5.7倍の現実。検証環境の夜間停止で60%削減、基盤再選定で30%削減——自治体規模別の具体的な打ち手を無料PDFで公開。935団体の実績データ付き。",
  openGraph: {
    title: "ガバメントクラウド コスト削減30%の実践手順【2026年最新】FinOps完全ガイド｜GCInsight",
    description:
      "移行後コスト平均2.3倍・最大5.7倍。検証環境夜間停止で60%削減、基盤再選定で30%削減の具体策を自治体規模別に解説。無料PDF付き。",
    images: [
      {
        url: `/og?title=${encodeURIComponent("FinOps コスト最適化")}&subtitle=${encodeURIComponent("コスト2.3倍→3割削減の打ち手")}&type=cost`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/finops" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "ガバメントクラウドのFinOpsとは何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FinOps（Financial Operations）は、クラウドの利用料金を継続的に監視・分析し、無駄を省いてコストを最適化する管理手法です。ガバメントクラウドでは、移行後の運用経費が平均2.3倍に増加しており、FinOpsの実践が急務となっています。",
      },
    },
    {
      "@type": "Question",
      name: "ガバメントクラウド移行後、コストはどれくらい増加しますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "中核市市長会の調査によると、移行前の運用経費平均は約3.4億円に対し、移行後は約6.8億円と平均2.3倍に増加。最大で5.7倍になった事例もあります。5割以上の自治体で2倍以上の増が見込まれています。",
      },
    },
    {
      "@type": "Question",
      name: "コストが下がらない構造的な原因は何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "主な原因は3つです。(1) 基盤選定ミス：AWS寡占（97%）で価格競争が働かない、(2) 回線費・二重負担：移行期間中のオンプレとクラウドの並行運用コスト、(3) 競争不足：ベンダーロックインにより単価が下がらない構造です。",
      },
    },
    {
      "@type": "Question",
      name: "自治体がすぐに着手できるコスト削減策はありますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "2つの打ち手があります。移行済みの場合はFinOps運用最適化（検証環境の夜間停止で60%以上削減、マネージドサービス活用）、未移行の場合は基盤再選定（OCI等のAWS以外のクラウドも検討し、コスト比較を実施）です。",
      },
    },
  ],
};

export default async function FinopsPage() {
  const finopsArticles = await getArticlesByTags(["FinOps"]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* SSR テキストブロック: Googlebotが初回HTMLでコンテンツを読めるようにする */}
      <section className="max-w-4xl mx-auto space-y-4 mb-6">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
          ガバメントクラウド コスト削減30%の実践手順【2026年最新】FinOps完全ガイド
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          ガバメントクラウド移行後の運用コストは平均2.3倍・最大5.7倍に増加（中核市市長会調査）。
          935団体が特定移行支援として期限延長を認定された今、自治体規模別の具体策を解説。
          移行済みは検証環境の夜間停止・ストレージ階層化で最大60%のコスト削減、
          未移行はAWS以外（OCI・さくら等）の基盤再選定で30%削減が可能です。実績データ付き無料PDFを提供。
        </p>
      </section>
      <Suspense fallback={<FinopsLoading />}>
        <FinopsClient articles={finopsArticles.slice(0, 3)} />
      </Suspense>
      <PageNavCards exclude="/finops" />
    </>
  );
}
