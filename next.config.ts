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
      { source: "/compare",        destination: "/benchmark", permanent: true },
      { source: "/cost-reduction", destination: "/finops",   permanent: true },
    ];
  },
};

export default nextConfig;
