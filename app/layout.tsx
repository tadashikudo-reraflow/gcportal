import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";
import RootShell from "./RootShell";

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

export const metadata: Metadata = {
  title: "自治体ガバメントクラウド移行進捗ダッシュボード",
  description: "全国1,741自治体のガバメントクラウド移行進捗・特定移行認定・遅延リスクを可視化。デジタル庁標準化データに基づくリアルタイムダッシュボード。",
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
      <body className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>
        {/* RootShell: /admin 配下は NavBar/header/footer をスキップ */}
        <RootShell>
          {children}
        </RootShell>
      </body>
    </html>
  );
}
