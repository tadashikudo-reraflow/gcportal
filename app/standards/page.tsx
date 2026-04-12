import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import RelatedArticles from "@/components/RelatedArticles";
import StandardsClient from "./StandardsClient";
import data from "@/public/data/standards_mapping.json";
import { CLUSTERS } from "@/lib/clusters";

export const metadata: Metadata = {
  title: "標準化20業務 標準仕様書マップ｜所管省庁・最新バージョン一覧【2026年最新】｜GCInsight",
  description: "地方公共団体情報システム標準化法に基づく20業務の標準仕様書一覧。所管省庁（総務省・厚生労働省・こども家庭庁等）・最新バージョン・公表年月を網羅。2026年4月時点の最新情報。",
  alternates: { canonical: "/standards" },
};

export default function StandardsPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "標準仕様書マップ" }]} />

      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">標準化20業務 標準仕様書マップ</h1>
        <p className="page-subtitle">
          地方公共団体情報システム標準化法に基づく20業務の所管省庁・標準仕様書・最新バージョン一覧（2026年4月時点）
        </p>
      </div>

      {/* サマリーバッジ */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "対象業務数", value: "20業務" },
          { label: "関係省庁", value: "5省庁" },
          { label: "移行期限", value: "2026年3月末" },
          { label: "経過措置", value: "2028年度末" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "10px 16px",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              backgroundColor: "var(--color-surface)",
              textAlign: "center",
              minWidth: 100,
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* インタラクティブテーブル */}
      <div className="card">
        <StandardsClient standards={data.standards} />
      </div>

      {/* 出典・注記 */}
      <div
        style={{
          padding: "16px 20px",
          backgroundColor: "var(--color-surface-container-low)",
          borderRadius: 10,
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>出典・注記</p>
        <ul style={{ paddingLeft: "1.2em", margin: 0 }}>
          <li>デジタル庁「データ要件・連携要件の標準仕様」（2026年4月時点）</li>
          <li>総務省・厚生労働省・こども家庭庁・文部科学省・法務省 各公表資料</li>
          <li>標準仕様書は随時改定されます。最新版は各省庁公式ページをご確認ください。</li>
          <li>2025年2月公表の「経過措置」により、一部機能は2028年度末まで追加猶予があります。</li>
        </ul>
      </div>

      <RelatedArticles cluster={CLUSTERS.business} />
    </div>
  );
}
