import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";
import RootShell from "./RootShell";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-noto",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = "https://gcinsight.jp";

export const metadata: Metadata = {
  title: "ガバメントクラウド移行状況ダッシュボード｜全国1,741自治体の進捗をリアルタイム可視化",
  description: "全国1,741自治体のガバメントクラウド移行進捗・特定移行認定・遅延リスクを可視化。デジタル庁標準化データに基づくリアルタイムダッシュボード。",
  metadataBase: new URL(BASE_URL),
  alternates: { canonical: "/" },
  verification: {
    google: "rzkjtVTiTE7yeA1FjPoMBNRmgzbrv-Mc_DN7i1SKvQo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${inter.variable}`}>
      {GA_ID && (
        <head>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </head>
      )}
      <body className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "GCInsight — ガバメントクラウド移行状況ダッシュボード",
              url: BASE_URL,
              description: "全国1,741自治体のガバメントクラウド移行進捗を可視化するダッシュボード",
              publisher: {
                "@type": "Organization",
                name: "GCInsight編集部",
                url: BASE_URL,
              },
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
