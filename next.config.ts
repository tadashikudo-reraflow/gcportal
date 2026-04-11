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
      { source: "/compare",        destination: "/progress", permanent: true },
      { source: "/cost-reduction", destination: "/finops",   permanent: true },
      { source: "/report",         destination: "/finops",   permanent: true },
      // 旧進捗ページ → /progress 統合
      { source: "/prefectures",              destination: "/progress",                    permanent: true },
      { source: "/prefectures/:prefecture",  destination: "/progress?pref=:prefecture",   permanent: true },
      { source: "/municipalities/:prefecture/:city", destination: "/progress?pref=:prefecture&city=:city", permanent: true },
      { source: "/benchmark",                destination: "/progress",                    permanent: true },
      { source: "/risks",                    destination: "/progress?status=critical",    permanent: true },
      { source: "/tokutei",                  destination: "/progress?status=tokutei",     permanent: true },
      // govcloud-basics → govcloud-what-is-govcloud に統合（カニバリゼーション解消）
      { source: "/articles/govcloud-basics", destination: "/articles/govcloud-what-is-govcloud", permanent: true },
    ];
  },
};

export default nextConfig;
