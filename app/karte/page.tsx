import type { Metadata } from "next";
import { getAllKarteArticles } from "@/lib/karte-articles";
import Breadcrumb from "@/components/Breadcrumb";
import KarteArticlesClient from "./KarteArticlesClient";

export const metadata: Metadata = {
  title: "電子カルテ標準化 解説記事｜GCInsight for 電子カルテ標準化",
  description:
    "電子カルテ標準化・情報共有サービス・標準型電子カルテ・補助金・普及率に関する解説記事の一覧。医療機関・クリニックのDX推進担当者向け実務情報。",
  alternates: { canonical: "/karte" },
};

export const dynamic = "force-dynamic";

export default async function KartePage() {
  const articles = await getAllKarteArticles();

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "電子カルテ標準化 解説記事" }]} />
      <div className="pb-2">
        <h1 className="page-title">電子カルテ標準化 解説記事</h1>
        <p className="page-subtitle">標準型電子カルテ・情報共有サービス・補助金・医療DXに関する実務情報</p>
      </div>

      {articles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>記事準備中です</p>
        </div>
      ) : (
        <KarteArticlesClient articles={articles} />
      )}
    </div>
  );
}
