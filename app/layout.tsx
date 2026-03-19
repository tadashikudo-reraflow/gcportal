import type { Metadata } from "next";
import { Noto_Sans_JP, Inter } from "next/font/google";
import "./globals.css";
import NavBar from "./NavBar";

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
  title: "自治体標準化ダッシュボード",
  description: "デジタル庁 地方公共団体情報システム標準化 進捗状況",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${inter.variable}`}>
      <body className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>

        {/* ヘッダー — 深紺 #002D72 */}
        <header style={{ backgroundColor: "var(--color-brand-secondary)" }}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* ロゴ: 黄色アクセント */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--color-brand-primary)" }}
              >
                <span
                  style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 800 }}
                >
                  官
                </span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">
                  自治体標準化ダッシュボード
                </h1>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  デジタル庁 地方公共団体情報システム標準化 進捗状況
                </p>
              </div>
            </div>
          </div>
          <NavBar />
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* フッター */}
        <footer
          className="mt-12"
          style={{ borderTop: "2px solid var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                データ出典: 総務省 令和8年1月版
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                地方公共団体情報システムの標準化に関する法律（標準化法）に基づく移行状況
              </p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
