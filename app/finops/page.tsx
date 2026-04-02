import type { Metadata } from "next";
import { Suspense } from "react";
import FinopsClient from "./FinopsClient";
import FinopsLoading from "./loading";
import { getArticlesByTags, type ArticleMeta } from "@/lib/articles";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ガバクラFinOps｜コスト2.3倍→3割削減の打ち手と無料診断PDF｜GCInsight",
  description:
    "移行後コスト平均2.3倍・最大5.7倍。935団体が期限延長の今、同規模自治体と比較診断。移行済み→FinOps運用最適化・未移行→基盤再選定の具体策を無料PDFで提供。",
  openGraph: {
    title: "ガバクラFinOps｜コスト2.3倍→3割削減の打ち手｜GCInsight",
    description:
      "移行後コスト平均2.3倍・最大5.7倍。同規模自治体と比較診断し、FinOps運用最適化の具体策を無料PDFで提供。",
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
      <Suspense fallback={<FinopsLoading />}>
        <FinopsClient articles={finopsArticles.slice(0, 3)} />
      </Suspense>
    </>
  );
}
