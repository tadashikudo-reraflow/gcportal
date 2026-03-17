import type { Metadata } from "next";
import "./globals.css";
import NavBar from "./NavBar";

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
    <html lang="ja">
      {/* fontFamilyはglobals.cssのbodyルールに集約。styleプロップを除去。 */}
      <body className="min-h-screen" style={{ backgroundColor: "var(--color-surface)" }}>

        {/* ヘッダー */}
        <header style={{ backgroundColor: "var(--color-gov-primary)" }}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0"
              >
                <span
                  style={{ color: "var(--color-gov-primary)", fontSize: "13px", fontWeight: 700 }}
                >
                  官
                </span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-tight">
                  自治体標準化ダッシュボード
                </h1>
                <p className="text-blue-200 text-xs mt-0.5">
                  デジタル庁 地方公共団体情報システム標準化 進捗状況
                </p>
              </div>
            </div>
          </div>
          {/* pathname連動active — Client Component */}
          <NavBar />
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* フッター */}
        <footer
          className="mt-12"
          style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}
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
