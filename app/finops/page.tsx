import type { Metadata } from "next";
import { Suspense } from "react";
import FinopsClient from "./FinopsClient";
import FinopsLoading from "./loading";
import { getArticlesByTags, type ArticleMeta } from "@/lib/articles";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ガバメントクラウド コスト最適化（FinOps）｜無料PDFで比較診断｜GCInsight",
  description:
    "平均2.3倍のガバクラコスト増加を同規模自治体と比較・診断。移行済み→運用最適化・未移行→基盤再選定の具体的打ち手と、無料PDFレポートを提供。",
  openGraph: {
    title: "ガバメントクラウド コスト最適化（FinOps）｜無料PDF診断｜GCInsight",
    description:
      "平均2.3倍のガバクラコスト増加を同規模自治体と比較診断。移行済み→運用最適化・未移行→基盤再選定の打ち手と無料PDFレポートを提供。",
    images: [
      {
        url: `/og?title=${encodeURIComponent("FinOps コスト最適化")}&subtitle=${encodeURIComponent("ガバメントクラウドの適正コストを確認")}&type=cost`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/finops" },
};

export default async function FinopsPage() {
  const finopsArticles = await getArticlesByTags(["FinOps"]);
  return (
    <Suspense fallback={<FinopsLoading />}>
      <FinopsClient articles={finopsArticles.slice(0, 3)} />
    </Suspense>
  );
}
