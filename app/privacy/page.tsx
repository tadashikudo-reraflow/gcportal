import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー｜GCInsight",
  description: "GCInsightのプライバシーポリシー。アクセス解析・Cookie利用・個人情報の取り扱いについて。",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="prose-gc max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
        プライバシーポリシー
      </h1>
      <p className="text-xs mb-8" style={{ color: "var(--color-text-muted)" }}>
        最終更新日: 2026年3月26日
      </p>

      <section className="space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>1. 運営者情報</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            本サイト「GCInsight」（以下「当サイト」）は、ガバメントクラウド移行に関する公表データの可視化を目的として運営しています。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>2. 収集する情報</h2>
          <p className="text-sm leading-7 mb-3" style={{ color: "var(--color-text-secondary)" }}>
            当サイトでは、以下の情報を自動的に収集する場合があります。
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <li>アクセスログ（IPアドレス、ブラウザ種別、アクセス日時、参照元URL）</li>
            <li>Google Analytics 4（GA4）によるアクセス解析データ（ページビュー、滞在時間、デバイス情報など）</li>
          </ul>
          <p className="text-sm leading-7 mt-3" style={{ color: "var(--color-text-secondary)" }}>
            当サイトでは、お問い合わせフォームやユーザー登録機能は現在提供しておらず、氏名・メールアドレス等の個人情報を直接取得することはありません。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>3. Cookieの利用</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            当サイトでは、Google Analytics 4（GA4）のアクセス解析のためにCookieを使用しています。
            Cookieはブラウザの設定で無効化できますが、一部機能に影響が出る場合があります。
          </p>
          <p className="text-sm leading-7 mt-2" style={{ color: "var(--color-text-secondary)" }}>
            GA4のデータ収集・利用については、
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
              className="font-medium no-underline hover:underline" style={{ color: "var(--color-brand-primary)" }}>
              Googleのプライバシーポリシー
            </a>
            をご確認ください。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>4. 情報の利用目的</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            <li>サイトの利用状況の把握・改善</li>
            <li>コンテンツの品質向上</li>
            <li>技術的な問題の検知・対応</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>5. 第三者への提供</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            収集した情報を第三者に提供・販売することはありません。
            ただし、法令に基づく開示請求があった場合はこの限りではありません。
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>6. ポリシーの変更</h2>
          <p className="text-sm leading-7" style={{ color: "var(--color-text-secondary)" }}>
            本ポリシーは、必要に応じて予告なく変更される場合があります。変更後のポリシーは、本ページに掲載した時点で効力を生じます。
          </p>
        </div>
      </section>

      <div className="mt-10 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
        <Link href="/terms" className="text-sm font-medium no-underline hover:underline" style={{ color: "var(--color-brand-primary)" }}>
          利用規約・免責事項 →
        </Link>
      </div>
    </article>
  );
}
