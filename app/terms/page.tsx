import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約・免責事項｜GCInsight",
  description: "GCInsightの利用規約・免責事項。データの正確性、著作権、引用ルールについて。",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="prose-gc max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
        利用規約・免責事項
      </h1>
      <p className="text-xs mb-8" style={{ color: "var(--color-text-muted)" }}>
        最終更新日: 2026年3月26日
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>1. サイトの目的</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            当サイト「GCInsight」は、デジタル庁・総務省等が公表するガバメントクラウド移行関連データを独自に集計・可視化し、情報提供を行うことを目的としています。
          </p>
          <div className="mt-3 rounded-lg px-4 py-3" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>
              当サイトはデジタル庁・総務省の公式サイトではありません。
            </p>
            <p className="text-xs mt-1" style={{ color: "#b91c1c" }}>
              掲載情報は公表データに基づく二次分析であり、公式見解を代替するものではありません。
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>2. データの正確性について</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <li>掲載データは、デジタル庁・総務省等の公表資料に基づいていますが、集計方法の違いにより公式発表値と差異が生じる場合があります</li>
            <li>コスト比較・ベンダー評価等は独自調査に基づく参考値であり、実際の契約条件・規模により大幅に異なる場合があります</li>
            <li>データの更新には時間差が生じるため、最新の状況と異なる場合があります</li>
            <li>一部のデータにはAIによる推定・補完が含まれる場合があり、その旨はデータソースページにて明示しています</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>3. 免責事項</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            当サイトの情報を利用したことで生じた損害について、運営者は一切の責任を負いません。
            意思決定にあたっては、必ず一次情報（デジタル庁・総務省等の公式発表）をご確認ください。
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
            <li>サイトの一時的な停止・データの遅延・表示の不具合等について、事前の通知なく発生する場合があります</li>
            <li>外部リンク先の内容について、運営者は責任を負いません</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>4. 著作権・引用</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            当サイトのコンテンツ（テキスト、グラフ、図表等）の著作権は運営者に帰属します。引用の際は以下のルールに従ってください。
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm mt-3" style={{ color: "var(--color-text-secondary)" }}>
            <li>出典として「GCInsight（gcinsight.jp）」を明記してください</li>
            <li>内容の改変を伴う引用は禁止します</li>
            <li>商用利用の場合は事前にお問い合わせください</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>5. データソース</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            当サイトで使用しているデータソースの一覧は、
            <Link href="/sources" className="font-medium no-underline hover:underline" style={{ color: "var(--color-brand-primary)" }}>
              データソース・出典ページ
            </Link>
            にて公開しています。各データの信頼度・鮮度も合わせてご確認ください。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>6. 規約の変更</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            本規約は、必要に応じて予告なく変更される場合があります。変更後の規約は、本ページに掲載した時点で効力を生じます。
          </p>
        </div>
      </section>

      <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
        <Link href="/privacy" className="text-sm font-medium no-underline hover:underline" style={{ color: "var(--color-brand-primary)" }}>
          プライバシーポリシー →
        </Link>
      </div>
    </article>
  );
}
