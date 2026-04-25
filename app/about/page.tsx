import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "GCInsightについて｜運営方針・編集ポリシー・データソース",
  description:
    "GCInsightは総務省・デジタル庁公表データに基づく、ガバメントクラウド移行進捗の民間唯一の総合ダッシュボードです。運営方針・編集ポリシー・データソースを公開しています。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Breadcrumb items={[{ label: "GCInsightについて" }]} />

      <div>
        <h1 className="page-title">GCInsightについて</h1>
        <p className="page-subtitle">
          全国1,741自治体のガバメントクラウド移行状況を追跡する民間唯一の総合ダッシュボード
        </p>
      </div>

      {/* サービス概要 */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          サービス概要
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          GCInsight（gcinsight.jp）は、ガバメントクラウドへの移行を進める自治体DX担当者・ITベンダー・政策研究者向けに、
          総務省・デジタル庁が公表するオープンデータを集約・可視化するダッシュボードサービスです。
          全国1,741自治体×20業務の移行進捗、特定移行支援認定935団体の状況、CSP別シェアを民間として初めて
          総合的に可視化しています。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "対象自治体", value: "1,741団体" },
            { label: "対象業務", value: "20業務" },
            { label: "RAGチャンク", value: "280,163件" },
          ].map((m) => (
            <div key={m.label} className="text-center p-3 rounded-lg" style={{ backgroundColor: "var(--color-surface-secondary)" }}>
              <p className="text-lg font-bold" style={{ color: "var(--color-brand-primary)" }}>{m.value}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 編集ポリシー */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          編集ポリシー
        </h2>
        <ul className="space-y-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {[
            {
              title: "一次資料主義",
              desc: "すべての数値はデジタル庁・総務省・各都道府県が公表した公式資料に基づきます。憶測や二次情報を事実として記載しません。",
            },
            {
              title: "出典の明示",
              desc: "記事内の数値・事実には原則として出典リンクを付します。出典不明の情報は「推計」「試算」と明記します。",
            },
            {
              title: "定期更新",
              desc: "移行進捗データはデジタル庁・総務省の公表サイクルに合わせて更新します。記事には最終更新日を表示します。",
            },
            {
              title: "利害関係の開示",
              desc: "GCInsightはCSP・パッケージベンダー・SI事業者から資金提供を受けていません。特定ベンダーへの誘導を目的とした記事は掲載しません。",
            },
          ].map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="flex-shrink-0 w-1.5 h-1.5 mt-2 rounded-full" style={{ backgroundColor: "var(--color-brand-primary)" }} />
              <div>
                <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.title}: </span>
                {item.desc}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* データソース */}
      <div className="card p-6 space-y-4">
        <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          主要データソース
        </h2>
        <ul className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {[
            { org: "デジタル庁", desc: "ガバメントクラウド採択・進捗・技術要件・先行事業報告書" },
            { org: "総務省", desc: "自治体標準化対象業務・移行状況調査・補助金情報" },
            { org: "APPLIC", desc: "標準準拠システム適合確認試験結果・製品登録リスト" },
            { org: "GCAS（ガバメントクラウド活用支援）", desc: "CSP別技術ガイド・移行手順書" },
            { org: "各都道府県・自治体", desc: "情報公開請求データ・独自公表資料" },
          ].map((s) => (
            <li key={s.org} className="flex gap-2">
              <span className="font-medium flex-shrink-0" style={{ color: "var(--color-text-primary)" }}>
                {s.org}:
              </span>
              <span>{s.desc}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          データの詳細な出典・更新履歴は
          <Link href="/sources" className="underline ml-1" style={{ color: "var(--color-brand-primary)" }}>
            データソースページ
          </Link>
          で確認できます。
        </p>
      </div>

      {/* 運営情報 */}
      <div className="card p-6 space-y-3">
        <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
          運営情報
        </h2>
        <dl className="space-y-2 text-sm">
          {[
            { dt: "運営", dd: "GCInsight編集部（reraflow.com）" },
            { dt: "設立", dd: "2025年" },
            { dt: "目的", dd: "ガバメントクラウド移行に関する透明性の向上と情報の民主化" },
            { dt: "お問い合わせ", dd: "サイト内問い合わせフォームまたはニュースレター登録よりご連絡ください" },
          ].map((item) => (
            <div key={item.dt} className="flex gap-4">
              <dt className="font-medium w-24 flex-shrink-0" style={{ color: "var(--color-text-primary)" }}>
                {item.dt}
              </dt>
              <dd style={{ color: "var(--color-text-secondary)" }}>{item.dd}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
