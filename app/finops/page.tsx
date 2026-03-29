import type { Metadata } from "next";
import { Suspense } from "react";
import FinopsClient from "./FinopsClient";
import FinopsLoading from "./loading";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ガバメントクラウド コスト最適化（FinOps）｜GCInsight",
  description:
    "自治体のガバメントクラウド移行後のコスト最適化を支援。平均2.3倍のコスト増加実態と、同規模自治体とのベンチマーク比較で適正コストを確認。",
  openGraph: {
    title: "ガバメントクラウド コスト最適化（FinOps）｜GCInsight",
    description:
      "自治体のガバメントクラウド移行後のコスト最適化を支援。平均2.3倍のコスト増加実態と、同規模自治体とのベンチマーク比較で適正コストを確認。",
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

export default function FinopsPage() {
  return (
    <Suspense fallback={<FinopsLoading />}>
      <FinopsClient />
    </Suspense>
  );
}
