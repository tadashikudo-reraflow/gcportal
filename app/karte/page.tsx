import type { Metadata } from "next";
import Link from "next/link";
import { getAllKarteArticles } from "@/lib/karte-articles";
import KarteArticlesClient from "./articles/KarteArticlesClient";

export const metadata: Metadata = {
  title: "電子カルテ標準化 解説記事｜GCInsight for 電子カルテ標準化",
  description:
    "電子カルテ標準化・情報共有サービス・標準型電子カルテ・補助金・普及率に関する解説記事の一覧。医療機関・クリニックのDX推進担当者向け実務情報。",
  alternates: { canonical: "/karte" },
};

export const dynamic = "force-dynamic";

export default async function KarteLandingPage() {
  const articles = await getAllKarteArticles();

  return (
    <div className="space-y-8">
      {/* ヒーロー */}
      <div className="card p-8 text-center space-y-4" style={{ borderTop: "4px solid #2e7d32" }}>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#2e7d32" }}>
          GCInsight for 電子カルテ標準化
        </p>
        <h1 className="text-2xl font-extrabold leading-tight" style={{ color: "var(--color-text-primary)" }}>
          電子カルテ標準化・医療DXの<br className="hidden sm:block" />実務情報メディア
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
          厚生労働省・内閣官房の一次資料に基づき、標準型電子カルテ・情報共有サービス・補助金・FHIRなどのテーマを解説します。
        </p>
        <Link
          href="/karte/articles"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold no-underline"
          style={{ backgroundColor: "#2e7d32", color: "#fff" }}
        >
          解説記事を読む →
        </Link>
      </div>

      {/* 最新記事プレビュー */}
      {articles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              最新の解説記事
            </h2>
            <Link href="/karte/articles" className="text-xs font-medium hover:underline" style={{ color: "#2e7d32" }}>
              すべて見る →
            </Link>
          </div>
          <KarteArticlesClient articles={articles.slice(0, 3)} />
        </div>
      )}
    </div>
  );
}
