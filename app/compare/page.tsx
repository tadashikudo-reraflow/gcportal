import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import ArticleNewsletterBanner from "@/components/ArticleNewsletterBanner";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ガバメントクラウド ダッシュボード比較｜GCInsight vs 総務省 vs デジタル庁",
  description:
    "自治体DX担当者におすすめの自治体標準化・ガバメントクラウド移行ダッシュボードツールを比較。GCInsight・総務省標準化ダッシュボード・デジタル庁実績の機能比較。コスト分析・パッケージDB・開示請求データなどGCInsight独自機能を網羅的に解説。",
  alternates: { canonical: "/compare" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "GCInsightと総務省ダッシュボードの違いは何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "総務省の自治体情報システム標準化ダッシュボードは20業務の標準化進捗を自治体別に公開していますが、CSPコスト比較・パッケージ事業者DB・開示請求データは含みません。GCInsightはこれらを独自集計し、自治体DX担当者とITベンダー向けに意思決定支援データを提供します。",
      },
    },
    {
      "@type": "Question",
      name: "GCInsightとデジタル庁のガバメントクラウド情報の違いは何ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "デジタル庁は先行事業のシステム登録状況（CSP・台帳）を公開していますが、割引モデル比較・FinOps分析・パッケージ事業者の詳細は含みません。GCInsightはデジタル庁データを取り込んだ上で、コスト試算・ベンダーDB・独自調査を追加した総合ダッシュボードです。",
      },
    },
    {
      "@type": "Question",
      name: "GCInsightは政府公式サイトですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GCInsightは政府公式サイトではありません。デジタル庁・総務省・各CSPの公式データをもとに、民間が独自集計・分析した情報サービスです。コスト推定や一部データにはAI調査・独自集計を含みます。公式一次情報は各省庁サイトをご参照ください。",
      },
    },
  ],
};

type Check = "yes" | "partial" | "no" | "planned";

const CHECK_CONFIG: Record<Check, { label: string; desc: string; color: string; bg: string }> = {
  yes:     { label: "あり",  desc: "対応済み・公開中",   color: "#15803d", bg: "#f0fdf4" },
  partial: { label: "一部",  desc: "限定的・条件付き対応", color: "#92400e", bg: "#fffbeb" },
  no:      { label: "なし",  desc: "未対応・非公開",      color: "#4b5563", bg: "#f3f4f6" },
  planned: { label: "予定",  desc: "開発・公開予定",      color: "#1d4ed8", bg: "#eff6ff" },
};

function Badge({ v }: { v: Check }) {
  const c = CHECK_CONFIG[v];
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

const COMPARE_ROWS: {
  category: string;
  items: { label: string; gcinsight: Check; mic: Check; digital: Check; note?: string }[];
}[] = [
  {
    category: "コスト・CSP",
    items: [
      { label: "CSPコスト指数比較",        gcinsight: "yes",     mic: "no",      digital: "no",      note: "AWS基準=100の相対指数" },
      { label: "割引モデル一覧",            gcinsight: "yes",     mic: "no",      digital: "no",      note: "Savings Plans / CUD / OCI年間コミット" },
      { label: "コストシミュレーター",      gcinsight: "yes",     mic: "no",      digital: "no",      note: "業務数・住民数から概算" },
      { label: "FinOps分析",               gcinsight: "yes",     mic: "no",      digital: "no",      note: "GCASガイド準拠コスト最適化" },
      { label: "インフラシェア実績",        gcinsight: "yes",     mic: "no",      digital: "partial",  note: "デジタル庁先行事業調査データ引用" },
    ],
  },
  {
    category: "自治体・進捗",
    items: [
      { label: "自治体別標準化進捗",        gcinsight: "yes",     mic: "yes",     digital: "partial",  note: "GCInsightはAPIで随時更新" },
      { label: "20業務別進捗",              gcinsight: "yes",     mic: "yes",     digital: "no" },
      { label: "移行スケジュール",          gcinsight: "yes",     mic: "partial", digital: "partial" },
      { label: "遅延リスク分析",            gcinsight: "yes",     mic: "no",      digital: "no" },
    ],
  },
  {
    category: "データ・DB",
    items: [
      { label: "標準仕様書DB",              gcinsight: "yes",     mic: "no",      digital: "partial",  note: "バージョン・改定履歴も管理" },
      { label: "パッケージ事業者DB",        gcinsight: "yes",     mic: "no",      digital: "no",       note: "業務別・CSP別に集計" },
      { label: "開示請求データ",            gcinsight: "yes",     mic: "no",      digital: "no",       note: "情報公開請求で取得した非公表データ" },
      { label: "データ更新頻度",            gcinsight: "yes",     mic: "partial", digital: "partial",  note: "GCInsightは随時・その他は月次〜不定期" },
    ],
  },
  {
    category: "機能・UX",
    items: [
      { label: "キーワード検索・フィルタ",  gcinsight: "yes",     mic: "partial", digital: "no" },
      { label: "スマホ最適化",              gcinsight: "yes",     mic: "partial", digital: "partial" },
      { label: "印刷・PDF出力",             gcinsight: "yes",     mic: "no",      digital: "no" },
      { label: "埋め込みウィジェット",      gcinsight: "yes",     mic: "no",      digital: "no" },
      { label: "API公開",                   gcinsight: "planned", mic: "no",      digital: "partial",  note: "GCInsightは公開予定" },
    ],
  },
  {
    category: "情報・利用",
    items: [
      { label: "利用料金",                  gcinsight: "yes",     mic: "yes",     digital: "yes",      note: "全サービス無料（GCInsightは会員限定コンテンツあり）" },
      { label: "コラム・解説記事",          gcinsight: "yes",     mic: "no",      digital: "partial" },
      { label: "ニュースレター配信",        gcinsight: "yes",     mic: "no",      digital: "no" },
      { label: "政府公式",                  gcinsight: "no",      mic: "yes",     digital: "yes",      note: "GCInsightは民間分析サービス" },
    ],
  },
];

// 全項目のうちGCInsightが"yes"の割合
const totalItems = COMPARE_ROWS.flatMap((s) => s.items).length;
const gcinsightYes = COMPARE_ROWS.flatMap((s) => s.items).filter((r) => r.gcinsight === "yes").length;

export default function ComparePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "ダッシュボード比較" }]} />

        <div>
          <h1 className="page-title">ダッシュボード比較</h1>
          <p className="page-subtitle">GCInsight・総務省・デジタル庁の機能・データを比較</p>
        </div>

        {/* GCInsight ヒーローカード（差別化） */}
        <div
          className="card p-5"
          style={{ border: "2px solid #00338D", backgroundColor: "var(--color-surface)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#00338D18", color: "#00338D" }}>
                  本サイト
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
                  {gcinsightYes}/{totalItems}項目対応
                </span>
              </div>
              <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>GCInsight</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                デジタル庁・総務省の公式データを取り込み、コスト試算・パッケージDB・開示請求データを独自追加した総合ダッシュボード。
                自治体DX担当者・ITベンダー・コンサル向けに意思決定支援データを無料提供。
              </p>
            </div>
            <div className="flex sm:flex-col gap-2 flex-shrink-0">
              <Link
                href="/costs"
                className="text-xs font-semibold px-3 rounded-lg text-center whitespace-nowrap flex items-center justify-center min-h-[44px]"
                style={{ backgroundColor: "#00338D", color: "#fff" }}
              >
                コスト比較を見る
              </Link>
              <Link
                href="/"
                className="text-xs font-semibold px-3 rounded-lg text-center whitespace-nowrap flex items-center justify-center min-h-[44px]"
                style={{ border: "1px solid #00338D", color: "#00338D" }}
              >
                ダッシュボードへ
              </Link>
            </div>
          </div>
        </div>

        {/* 競合2サービス（小さく横並び） */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              id: "mic",
              name: "総務省標準化ダッシュボード",
              label: "総務省",
              url: "https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/johoka/lgwan-asp/standard.html",
              org: "総務省（公式）",
              color: "#1d4ed8",
              desc: "自治体の20業務標準化進捗を都道府県・市区町村別に公開。コスト情報・パッケージ詳細は含まない。",
            },
            {
              id: "digital",
              name: "デジタル庁 先行事業実績",
              label: "デジタル庁",
              url: "https://www.digital.go.jp/policies/local_governments/",
              org: "デジタル庁（公式）",
              color: "#0891b2",
              desc: "ガバメントクラウド先行事業のシステム台帳・CSP別登録状況を公開。割引モデルや詳細コストは含まない。",
            },
          ].map((t) => (
            <div key={t.id} className="card p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: t.color + "18", color: t.color }}>
                  {t.label}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
                  公式
                </span>
              </div>
              <p className="text-sm font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>{t.name}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{t.desc}</p>
              <a
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold hover:underline inline-flex items-center py-2"
                style={{ color: t.color }}
                aria-label={`${t.name}（外部サイト、新しいタブで開きます）`}
              >
                外部サイトへ ↗
              </a>
            </div>
          ))}
        </div>

        {/* 比較テーブル（モバイル横スクロール対応 + ARIA table semantics） */}
        {COMPARE_ROWS.map((section) => (
          <div key={section.category} className="card overflow-hidden">
            {/* セクションヘッダー */}
            <div className="px-4 py-2.5 border-b" style={{ backgroundColor: "var(--color-surface-container-low)", borderColor: "var(--color-border)" }}>
              <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                {section.category}
              </h2>
            </div>

            {/* スクロールコンテナ */}
            <div className="overflow-x-auto">
              <div
                role="table"
                aria-label={`${section.category}の機能比較`}
                style={{ minWidth: 380 }}
              >
                {/* ヘッダー行 */}
                <div
                  role="row"
                  className="grid px-4 py-2 border-b text-xs font-bold"
                  style={{
                    gridTemplateColumns: "1fr 4.5rem 4.5rem 4.5rem",
                    gap: "0.5rem",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span role="columnheader" style={{ color: "var(--color-text-muted)" }}>機能・データ</span>
                  <span role="columnheader" className="text-center" style={{ color: "#00338D" }}>GCInsight</span>
                  <span role="columnheader" className="text-center" style={{ color: "#1d4ed8" }}>総務省</span>
                  <span role="columnheader" className="text-center" style={{ color: "#0891b2" }}>デジタル庁</span>
                </div>

                {/* データ行 */}
                <div role="rowgroup">
                  {section.items.map((row, i) => (
                    <div
                      key={row.label}
                      role="row"
                      className="grid px-4 py-2.5 items-center text-xs"
                      style={{
                        gridTemplateColumns: "1fr 4.5rem 4.5rem 4.5rem",
                        gap: "0.5rem",
                        borderBottom: i < section.items.length - 1 ? "1px solid var(--color-border)" : undefined,
                      }}
                    >
                      <div role="cell">
                        <span style={{ color: "var(--color-text-primary)" }}>{row.label}</span>
                        {row.note && (
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{row.note}</p>
                        )}
                      </div>
                      <div role="cell" className="flex justify-center"><Badge v={row.gcinsight} /></div>
                      <div role="cell" className="flex justify-center"><Badge v={row.mic} /></div>
                      <div role="cell" className="flex justify-center"><Badge v={row.digital} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 凡例（説明テキスト付き） */}
        <div className="card p-4">
          <h2 className="text-xs font-bold mb-3" style={{ color: "var(--color-text-secondary)" }}>凡例</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(CHECK_CONFIG) as [Check, typeof CHECK_CONFIG[Check]][]).map(([, c]) => (
              <div key={c.label} className="flex items-start gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5" style={{ color: c.color, backgroundColor: c.bg }}>
                  {c.label}
                </span>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ニュースレター CTA */}
        <ArticleNewsletterBanner />

        {/* 免責 */}
        <p className="text-xs px-1" style={{ color: "var(--color-text-muted)" }}>
          ※ 本比較は2026年4月時点の情報をもとにした独自評価です。総務省・デジタル庁の機能は変更される場合があります。
          GCInsightは政府公式サイトではありません。
        </p>

        {/* ナビゲーション */}
        <div className="flex items-center justify-between">
          <Link href="/cloud" className="text-sm font-semibold hover:underline py-3 inline-block" style={{ color: "var(--color-brand-secondary)" }}>
            ← ガバクラ比較
          </Link>
          <Link href="/articles" className="text-sm font-semibold hover:underline py-3 inline-block" style={{ color: "var(--color-brand-secondary)" }}>
            コラム →
          </Link>
        </div>
      </div>
    </>
  );
}
