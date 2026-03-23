import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercelネイティブデプロイ — Server Actions・動的レンダリングを有効化
  async redirects() {
    return [
      { source: "/adoption", destination: "/packages", permanent: true },
      { source: "/compare",  destination: "/benchmark", permanent: true },
    ];
  },
};

export default nextConfig;
