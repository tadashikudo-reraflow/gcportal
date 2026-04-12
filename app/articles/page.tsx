import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import Breadcrumb from "@/components/Breadcrumb";
import ContentTabNav from "@/components/ContentTabNav";
import ArticlesClient from "./ArticlesClient";

export const metadata: Metadata = {
  title: "ガバクラ・自治体標準化 コラム・解説記事｜GCInsight",
  description:
    "ガバメントクラウド・自治体標準化システムに関するコラム・解説記事の一覧。移行コスト・特定移行認定・遅延リスクなど自治体DX推進担当者向けの実務情報。",
  alternates: { canonical: "/articles" },
};
export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await getAllArticles();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "コラム・解説記事" }]} />
      <div className="pb-2">
        <h1 className="page-title">コラム・解説記事</h1>
        <p className="page-subtitle">ガバメントクラウド・自治体標準化に関する実務情報・解説</p>
      </div>
      <ContentTabNav />

      {articles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>記事準備中です</p>
        </div>
      ) : (
        <ArticlesClient articles={articles} />
      )}
    </div>
  );
}
