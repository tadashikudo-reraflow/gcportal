import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_JP, Public_Sans } from "next/font/google";
import "./globals.css";
import RootShell from "./RootShell";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-public-sans",
  display: "swap",
});

const BASE_URL = "https://gcinsight.jp";

export const metadata: Metadata = {
  title: "ガバメントクラウド移行状況ダッシュボード｜全国1,741自治体の進捗をリアルタイム可視化",
  description: "全国1,741自治体のガバメントクラウド移行進捗・特定移行認定・遅延リスクを可視化。デジタル庁標準化データに基づくリアルタイムダッシュボード。",
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
  verification: {
    google: "hk66ltVdyRloBqdOteNRmxzjMNnd2U_EPz0zR0zRz8g",
  },
  openGraph: {
    title: "GCInsight — ガバメントクラウド移行ダッシュボード",
    description:
      "全国1,741自治体のガバメントクラウド移行進捗・コスト・リスクをリアルタイム可視化。デジタル庁標準化データに基づく公式ダッシュボード。",
    images: [
      {
        url: "/og?title=GCInsight&subtitle=ガバメントクラウド移行ダッシュボード",
        width: 1200,
        height: 630,
        alt: "GCInsight — ガバメントクラウド移行ダッシュボード",
      },
    ],
    type: "website",
    siteName: "GCInsight",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "GCInsight — ガバメントクラウド移行ダッシュボード",
    description:
      "全国1,741自治体のガバメントクラウド移行進捗をリアルタイム可視化",
    images: ["/og?title=GCInsight&subtitle=ガバメントクラウド移行ダッシュボード"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${publicSans.variable}`}>
      <head>
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
        {CLARITY_ID && (
          <Script id="clarity-init" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
          </Script>
        )}
      </head>
      <body className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${BASE_URL}/#website`,
                  name: "GCInsight — ガバメントクラウド移行状況ダッシュボード",
                  url: BASE_URL,
                  description: "全国1,741自治体のガバメントクラウド移行進捗・コスト・パッケージを可視化する自治体DX担当者向けダッシュボードツール",
                  inLanguage: "ja",
                  publisher: {
                    "@type": "Organization",
                    "@id": `${BASE_URL}/#organization`,
                    name: "GCInsight",
                    url: BASE_URL,
                    description: "ガバメントクラウド・自治体標準化に関するデータ収集・可視化・分析を提供する情報プラットフォーム",
                  },
                },
                {
                  "@type": "SoftwareApplication",
                  "@id": `${BASE_URL}/#app`,
                  name: "GCInsight",
                  alternateName: "GCInsight ガバメントクラウド移行ダッシュボード",
                  url: BASE_URL,
                  applicationCategory: "GovernmentApplication",
                  operatingSystem: "Web",
                  offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" },
                  description: "全国1,741自治体のガバメントクラウド移行進捗・コスト動向・ベンダーパッケージをリアルタイムで可視化する無料ダッシュボードツール。自治体標準化20業務の進捗状況・特定移行支援システム・コスト試算・FinOpsガイドを提供。",
                  featureList: [
                    "全国1,741自治体のガバメントクラウド移行進捗の可視化",
                    "自治体別・都道府県別の標準化20業務完了状況",
                    "TKC・富士通・NEC・日立・NTTデータなどパッケージベンダー比較",
                    "AWS・GCP・Azure・OCI・さくらのクラウドのコスト比較",
                    "特定移行支援システム該当自治体の一覧",
                    "ガバメントクラウド移行コストの試算・分析",
                    "FinOpsガイド（コスト最適化手順）",
                  ],
                  audience: {
                    "@type": "Audience",
                    audienceType: "自治体DX担当者・ITベンダー・政策立案者",
                  },
                  about: {
                    "@type": "Thing",
                    name: "ガバメントクラウド・自治体情報システム標準化",
                    description: "デジタル庁が推進する全国自治体の情報システム標準化・ガバメントクラウド移行プロジェクト",
                  },
                },
              ],
            }),
          }}
        />
        {/* RootShell: /admin 配下は NavBar/header/footer をスキップ */}
        <RootShell>
          {children}
        </RootShell>
      </body>
    </html>
  );
}
