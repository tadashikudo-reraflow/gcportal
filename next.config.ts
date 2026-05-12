import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // X-Powered-By ヘッダー削除（不要な情報露出防止）
  poweredByHeader: false,

  // next/image で外部画像（Supabase Storage）を許可
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "https", hostname: "gcinsight.jp" },
    ],
  },

  // 静的アセット・データファイルの長期キャッシュ（本番のみ）
  // dev環境でimmutableを設定するとTurbopackのHMR後もブラウザが古いチャンクを返し続ける
  async headers() {
    if (!isProd) return [
      {
        source: '/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ];
    return [
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/data/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/adoption",       destination: "/packages", permanent: true },
      { source: "/cost-reduction", destination: "/articles", permanent: true },
      { source: "/report",         destination: "/articles", permanent: true },
      // 廃止ページ → 最適な代替ページへ301
      { source: "/finops",         destination: "/articles", permanent: true },
      { source: "/cyber-security", destination: "/articles", permanent: true },
      { source: "/mesh",           destination: "/articles", permanent: true },
      { source: "/compare",        destination: "/progress", permanent: true },
      // 旧進捗ページ → /progress 統合
      { source: "/prefectures",              destination: "/progress",                    permanent: true },
      { source: "/prefectures/:prefecture",  destination: "/progress?pref=:prefecture",   permanent: true },
      // /municipalities/:prefecture/:city は独立ページとして復活（財政プロフィール追加済み）
      { source: "/benchmark",                destination: "/progress",                    permanent: true },
      { source: "/risks",                    destination: "/progress?status=critical",    permanent: true },
      { source: "/tokutei",                  destination: "/progress?status=tokutei",     permanent: true },
      // govcloud-basics → govcloud-what-is-govcloud に統合（カニバリゼーション解消）
      { source: "/articles/govcloud-basics", destination: "/articles/govcloud-what-is-govcloud", permanent: true },
      // 引き算SEO: 14d 327imp/0clicks の低品質ページを同テーマ最新記事に統合（2026-05-04 SEO週次レポート）
      { source: "/articles/digital-cho-government-cloud", destination: "/articles/gc-data-column-migration-overview", permanent: true },
      // 2026-05-13 重複記事カニバリ解消（GSC 28d実績ベースで canonical 選定）
      // さくらインターネット系: 6本 → sakura-gc-certified（1217imp/5.7位）に統合
      { source: "/articles/sakura-gc-progress-2026",                  destination: "/articles/sakura-gc-certified", permanent: true },
      { source: "/articles/sakura-govcloud-progress-2026",            destination: "/articles/sakura-gc-certified", permanent: true },
      { source: "/articles/sakura-internet-government-cloud-certification", destination: "/articles/sakura-gc-certified", permanent: true },
      { source: "/articles/sakura-cloud-government-cloud-merit",      destination: "/articles/sakura-gc-certified", permanent: true },
      { source: "/articles/govcloud-sakura-certification-aws-monopoly", destination: "/articles/sakura-gc-certified", permanent: true },
      { source: "/articles/gc-sakura",                                destination: "/articles/sakura-gc-certified", permanent: true },
      // 政府AI源内: 2本 → digital-agency-ai-gennai-guide（5901imp/サイトNo.1記事）に統合
      { source: "/articles/digital-agency-gennai-govcloud-dx",        destination: "/articles/digital-agency-ai-gennai-guide", permanent: true },
      // 生成AIガイドライン: 2本 → digital-agency-generative-ai-guideline（2013imp）に統合
      { source: "/articles/digital-agency-ai-guideline-2026-jichitai", destination: "/articles/digital-agency-generative-ai-guideline", permanent: true },
      // 都道府県別完了率: 2本 → govcloud-prefecture-completion-rate（1222imp/4.4位）に統合
      { source: "/articles/govcloud-prefecture-completion-rate-2026", destination: "/articles/govcloud-prefecture-completion-rate", permanent: true },
      // フロントヤード改革: 2本 → frontyard-reform-guide-2026（209imp）に統合
      { source: "/articles/frontyard-reform-5steps-2026",             destination: "/articles/frontyard-reform-guide-2026", permanent: true },
      // 30%コスト削減: 2本 → govcloud-30percent-cost-reduction-reality（古い方）に統合
      { source: "/articles/gc-cost-30percent-reduction-goal-verification", destination: "/articles/govcloud-30percent-cost-reduction-reality", permanent: true },
      // 旧 /karte/[slug] → /karte/articles/[slug] へ308リダイレクト（URL構造移行）
      { source: "/karte/:slug((?!articles)[^/]+)", destination: "/karte/articles/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
