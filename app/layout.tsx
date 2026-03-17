import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

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
      <body className="min-h-screen bg-gray-50" style={{ fontFamily: "system-ui, sans-serif" }}>
        {/* ヘッダー */}
        <header style={{ backgroundColor: "#003087" }}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <span style={{ color: "#003087", fontSize: "14px", fontWeight: "bold" }}>官</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl leading-tight">
                  自治体標準化ダッシュボード
                </h1>
                <p className="text-blue-200 text-xs mt-0.5">
                  デジタル庁 地方公共団体情報システム標準化 進捗状況
                </p>
              </div>
            </div>
          </div>
          {/* ナビゲーション */}
          <nav style={{ backgroundColor: "#002070" }}>
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-0">
                <Link
                  href="/"
                  className="px-5 py-3 text-sm text-white hover:bg-blue-900 transition-colors border-b-2 border-white"
                >
                  ダッシュボード
                </Link>
                <Link
                  href="/prefectures"
                  className="px-5 py-3 text-sm text-blue-200 hover:bg-blue-900 hover:text-white transition-colors border-b-2 border-transparent"
                >
                  都道府県別
                </Link>
                <Link
                  href="/businesses"
                  className="px-5 py-3 text-sm text-blue-200 hover:bg-blue-900 hover:text-white transition-colors border-b-2 border-transparent"
                >
                  業務別
                </Link>
                <Link
                  href="/risks"
                  className="px-5 py-3 text-sm text-blue-200 hover:bg-blue-900 hover:text-white transition-colors border-b-2 border-transparent"
                >
                  遅延リスク一覧
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>

        {/* フッター */}
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm text-gray-600">
                データ出典: 総務省 令和8年1月版
              </p>
              <p className="text-xs text-gray-400">
                地方公共団体情報システムの標準化に関する法律（標準化法）に基づく移行状況
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
