import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import PageNavCards from "@/components/PageNavCards";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "公共サービスメッシュとは【2026年最新】自治体内情報活用サービス 完全解説｜GCInsight",
  description:
    "デジタル庁が推進する公共サービスメッシュ（自治体内情報活用サービス）の全体像・仕組み・住民データ管理・ETL連携・API仕様・令和8年度実証事業を自治体担当者向けに徹底解説。スマホ60秒の実現に向けた情報連携基盤の最新動向。",
  alternates: { canonical: "/mesh" },
  openGraph: {
    title: "公共サービスメッシュとは【2026年最新】自治体内情報活用サービス 完全解説｜GCInsight",
    description:
      "デジタル庁が推進する公共サービスメッシュの仕組み・住民データ管理・ETL・API仕様・令和8年度実証事業を解説。ガバメントクラウド移行の次フェーズ。",
    images: [
      {
        url: `/og?title=${encodeURIComponent("公共サービスメッシュ とは")}&subtitle=${encodeURIComponent("自治体内情報活用サービス【2026年最新】")}&type=info`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "公共サービスメッシュとは何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "公共サービスメッシュとは、デジタル庁が推進する自治体の情報連携基盤です。住民データを標準化されたAPIで横断的に活用できるようにし、「スマホで60秒」の行政手続き完結を目指します。自治体システム標準化と連動して整備が進められており、ガバメントクラウド移行の次フェーズに位置づけられます。",
      },
    },
    {
      "@type": "Question",
      name: "自治体内情報活用サービスとは何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "自治体内情報活用サービス（公共サービスメッシュの自治体向けモジュール）は、住民基本台帳データをはじめとする住民情報を、自治体内の複数業務システム間でリアルタイム連携するためのプラットフォームです。住民データ管理・ETLデータ連携・住民検索API・認証認可の4機能を中核として、令和8年度に実証事業が実施されています。",
      },
    },
    {
      "@type": "Question",
      name: "公共サービスメッシュの実装スケジュールはどうなっていますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "令和8年度（2026年度）に自治体内情報活用サービスの設計・開発・運用評価（実証）事業をデジタル庁が公募し、実証を実施します。2026年1月から府省庁向けの機関間情報連携サービス提供が開始されており、自治体向けは2026年度実証を経て本格展開が見込まれます。",
      },
    },
    {
      "@type": "Question",
      name: "公共サービスメッシュとガバメントクラウドの関係は何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ガバメントクラウドは自治体業務システムを移行するインフラ基盤であり、公共サービスメッシュはその上で動く情報連携の仕組みです。ガバメントクラウドへの移行が完了した自治体が、次のステップとして公共サービスメッシュを活用することで、住民サービスのデジタル化（手続きのワンストップ化・書類省略）が実現します。",
      },
    },
    {
      "@type": "Question",
      name: "公共サービスメッシュの住民データ管理（RDC）とは何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "RDC（Resident Data Center）は、住民の基本情報・関係属性・支援措置情報を一元管理するコンポーネントです。住民をメッシュ仮名ID（プライバシー保護のための仮名化識別子）で管理し、自治体業務システムからのデータ反映・お知らせ連携・支援措置対象者の管理などを行います。",
      },
    },
  ],
};

const MESH_FUNCTIONS = [
  {
    id: "rdc",
    label: "住民データ管理（RDC）",
    icon: "👥",
    summary: "住民基本情報・関係属性・支援措置を一元管理。メッシュ仮名IDで個人を識別。",
    details: [
      "住民データ管理（RDC-02）: 住民基本情報のUpsert・管理",
      "関係属性データ管理（RDC-04）: 家族関係・世帯情報の管理",
      "支援措置管理（RDC-06）: 支援措置対象者情報のメンテナンス",
      "宛名-メッシュ仮名管理（RDC-07）: 仮名化識別子の変換管理",
    ],
  },
  {
    id: "etl",
    label: "ETLデータ連携",
    icon: "🔄",
    summary: "自治体業務システム↔共通SaaS間のデータ一括連携。標準仕様に基づく自動同期。",
    details: [
      "ETL-01: 自治体業務システム→共通SaaS連携（データ抽出加工定義の登録・検証）",
      "ETL-02: 共通SaaS→自治体業務システム連携",
      "データ抽出加工モジュールによる変換・検証",
      "バックグラウンドジョブによる定期同期",
    ],
  },
  {
    id: "search",
    label: "住民検索API",
    icon: "🔍",
    summary: "GraphQL APIによる住民情報の横断検索。窓口業務のリアルタイム参照に対応。",
    details: [
      "GraphQL API（庁内連携）: 業務システム間のデータ参照",
      "GraphQL API（自己情報）: マイナポータル連携での住民自身の情報参照",
      "住民検索: 氏名・住所・生年月日等による横断検索",
      "アクセストークンによる認証済みリクエストのみ処理",
    ],
  },
  {
    id: "auth",
    label: "認証認可",
    icon: "🔒",
    summary: "マイナンバーカード連携のアクセス制御。ISMAP準拠のセキュリティ要件。",
    details: [
      "マイナンバーカードを用いた本人確認・認証",
      "アクセストークン発行・管理",
      "ISMAP（政府情報システムのためのセキュリティ評価制度）準拠",
      "市区町村コードを用いた自治体別アクセス制御",
    ],
  },
  {
    id: "notify",
    label: "お知らせ連携（NTC）",
    icon: "📢",
    summary: "マイナポータル等への自動プッシュ通知。手続き完了・申請案内を住民に届ける。",
    details: [
      "NTC-01: 自治体業務システムからのお知らせ生成・連携",
      "マイナポータルAPIを通じた通知配信",
      "OpenAPI仕様（マイナポータルお知らせ関連API）に準拠",
      "複数フロントサービスへの連携対応",
    ],
  },
];

export default async function MeshPage() {

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">
        <Breadcrumb items={[{ label: "公共サービスメッシュ" }]} />

        {/* ヒーロー */}
        <section className="space-y-4">
          <h1 className="text-2xl font-extrabold leading-tight" style={{ color: "var(--color-text-primary)" }}>
            公共サービスメッシュとは【2026年最新】<br className="sm:hidden" />自治体内情報活用サービス 完全解説
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            公共サービスメッシュは、デジタル庁が推進する<strong>自治体の情報連携基盤</strong>です。
            住民データを標準化されたAPIで横断的に活用し、「スマホで60秒」の行政手続き完結を実現します。
            ガバメントクラウドへの移行が進む全国1,741自治体にとって、<strong>移行後の次フェーズ</strong>に位置づけられる重要なインフラです。
          </p>

          {/* ステータスバッジ */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "令和8年度 実証実施中", color: "#0066CC" },
              { label: "デジタル庁 公募型プロポーザル", color: "#444" },
              { label: "調達案件番号: 0000000000000597482", color: "#666" },
            ].map((b) => (
              <span
                key={b.label}
                style={{
                  display: "inline-block",
                  padding: "2px 10px",
                  borderRadius: 20,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: b.color + "18",
                  color: b.color,
                  border: `1px solid ${b.color}30`,
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </section>

        {/* 概要カード */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            公共サービスメッシュが解決する課題
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              { icon: "📋", title: "書類提出の廃止", body: "行政機関間の情報連携により、住民が同じ書類を何度も提出する手間をなくします。" },
              { icon: "📱", title: "スマホ60秒完結", body: "マイナポータルと連携し、手続きのオンライン化・ワンストップ化を実現します。" },
              { icon: "🏛️", title: "全自治体への展開", body: "標準化20業務と連動し、全国1,741自治体が統一基盤を利用できます。" },
              { icon: "🔗", title: "データサイロの解消", body: "業務システム間で住民データをリアルタイム連携し、縦割りの情報断絶を解消します。" },
            ].map((c) => (
              <div
                key={c.title}
                style={{
                  padding: 16,
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-surface-container)",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: 4, color: "var(--color-text-primary)" }}>{c.title}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 5つのコア機能 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            自治体内情報活用サービスの5つのコア機能
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
            令和8年度調達仕様書（デジタル庁）をもとに GCInsight が整理
          </p>
          <div className="space-y-3">
            {MESH_FUNCTIONS.map((fn) => (
              <details
                key={fn.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid var(--color-border)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 16px",
                    cursor: "pointer",
                    backgroundColor: "var(--color-surface-container)",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    color: "var(--color-text-primary)",
                    listStyle: "none",
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{fn.icon}</span>
                  <span style={{ flex: 1 }}>{fn.label}</span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 400, color: "var(--color-text-secondary)" }} className="hidden sm:block">
                    {fn.summary}
                  </span>
                </summary>
                <div style={{ padding: "12px 16px 16px", backgroundColor: "var(--color-surface)" }}>
                  <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginBottom: 10 }}>{fn.summary}</p>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {fn.details.map((d) => (
                      <li key={d} style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", marginBottom: 4, lineHeight: 1.6 }}>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* アーキテクチャ概要 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            システム構成とデータフロー
          </h2>
          <div
            style={{
              padding: 20,
              borderRadius: 10,
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-surface-container)",
              fontSize: "0.875rem",
              lineHeight: 1.8,
              color: "var(--color-text-primary)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                    {["レイヤー", "コンポーネント", "役割"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 12px", color: "var(--color-text-muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["フロントサービス", "マイナポータル / 民間サービス", "住民・職員の入口。GraphQL APIで接続"],
                    ["情報連携基盤", "公共サービスメッシュ（機関間）", "府省庁間の情報連携（2026年1月〜稼働）"],
                    ["自治体内基盤", "自治体内情報活用サービス", "住民データ管理・ETL・認証認可（R8実証）"],
                    ["業務システム", "標準化20業務パッケージ", "TKC・富士通・NEC等がガバクラ上で稼働"],
                    ["インフラ", "ガバメントクラウド", "AWS/Azure/GCP/OCI/さくら"],
                  ].map(([layer, comp, role]) => (
                    <tr key={layer} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>{layer}</td>
                      <td style={{ padding: "8px 12px", color: "var(--color-text-secondary)" }}>{comp}</td>
                      <td style={{ padding: "8px 12px", color: "var(--color-text-secondary)" }}>{role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 令和8年度実証事業 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            令和8年度 実証事業の概要
          </h2>
          <div
            style={{
              padding: 20,
              borderRadius: 10,
              border: "1px solid #0066CC30",
              backgroundColor: "#0066CC08",
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#0066CC", marginBottom: 12 }}>
              デジタル庁 公募型プロポーザル（2026年4月〜6月公募）
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
                fontSize: "0.8125rem",
              }}
            >
              {[
                { label: "調達種別", value: "公募型プロポーザル" },
                { label: "提案書提出期限", value: "2026年6月1日 12:00" },
                { label: "公開終了", value: "2026年6月16日" },
                { label: "実施主体", value: "デジタル庁 戦略・組織グループ" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ color: "var(--color-text-muted)", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{value}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 14, fontSize: "0.8125rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
              令和8年度は、住民データ管理（RDC）・ETL連携・住民検索API・認証認可の4機能を実装した
              自治体内情報活用サービスの設計・開発・運用評価（実証）を行います。
              デジタル・スタートアップ要件も設けられ、民間事業者の参画が期待されています。
            </p>
          </div>

          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            ※ 本ページの情報はデジタル庁の調達仕様書（令和8年4月公開）をもとにしています。
            実証事業の結果により仕様は変更される可能性があります。
          </p>
        </section>

        {/* ガバメントクラウドとの関係 */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            ガバメントクラウド移行との関係
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            全国1,741自治体がガバメントクラウドへの移行を進めるなか、公共サービスメッシュはその<strong>次のステップ</strong>として位置づけられています。
            移行が完了した自治体は、業務システムがガバメントクラウド上で稼働している状態になります。
            そこに公共サービスメッシュが接続することで、業務システム間の住民データ連携が自動化され、
            窓口での書類入力・転記作業の削減やワンストップ手続きが実現します。
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/progress"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                textDecoration: "none",
                backgroundColor: "var(--color-surface-container)",
              }}
            >
              📊 移行進捗ダッシュボード →
            </Link>
            <Link
              href="/packages"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                textDecoration: "none",
                backgroundColor: "var(--color-surface-container)",
              }}
            >
              📦 対応パッケージ一覧 →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            よくある質問（FAQ）
          </h2>
          <div className="space-y-3">
            {faqJsonLd.mainEntity.map((item) => (
              <details
                key={item.acceptedAnswer.text.slice(0, 30)}
                style={{
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                  overflow: "hidden",
                }}
              >
                <summary
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    color: "var(--color-text-primary)",
                    backgroundColor: "var(--color-surface-container)",
                    listStyle: "none",
                  }}
                >
                  {item.name}
                </summary>
                <div style={{ padding: "12px 16px", fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
                  {item.acceptedAnswer.text}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* 出典 */}
        <section
          style={{
            padding: 16,
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface-container)",
            fontSize: "0.8125rem",
            color: "var(--color-text-muted)",
          }}
        >
          <strong style={{ display: "block", marginBottom: 6 }}>出典・参照資料</strong>
          <ul style={{ paddingLeft: 16, margin: 0, lineHeight: 2 }}>
            <li>デジタル庁「令和8年度公共サービスメッシュ（自治体内情報活用サービス）設計・開発・運用評価（実証）業務」調達仕様書（2026年4月）</li>
            <li>デジタル庁「自治体内情報活用サービス 要件定義書 第1.00版」（2026年4月）</li>
            <li>デジタル庁 公共サービスメッシュ ポリシーページ（digital.go.jp）</li>
            <li>調達案件番号: 0000000000000597482（政府電子調達システム）</li>
          </ul>
          <p style={{ marginTop: 8 }}>
            ※ GCInsightは取得した調達仕様書（要件定義書・ERD・DFD等）をRAGデータベースに収録し、AI検索での参照を可能にしています。
          </p>
        </section>

        {/* 関連ページ */}
        <PageNavCards exclude="/mesh" limit={4} />
      </div>
    </>
  );
}
