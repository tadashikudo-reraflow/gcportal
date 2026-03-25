import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // X-Powered-By ヘッダー削除（不要な情報露出防止）
  poweredByHeader: false,

  // 静的アセット・データファイルの長期キャッシュ
  async headers() {
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
      { source: "/adoption", destination: "/packages", permanent: true },
      { source: "/compare",  destination: "/benchmark", permanent: true },
    ];
  },
};

export default nextConfig;
