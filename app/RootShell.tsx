"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    // admin 配下は admin/layout.tsx に完全に委譲するため、
    // ヘッダー・フッター・max-w ラッパーをすべてスキップ
    return <>{children}</>;
  }

  return (
    <>
      {/* ヘッダー — 深紺 #002D72 */}
      <header style={{ backgroundColor: "var(--color-brand-secondary)" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* ロゴ: 黄色アクセント */}
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-brand-primary)" }}
            >
              <span
                className="text-white text-xs sm:text-sm"
                style={{ fontWeight: 800 }}
              >
                官
              </span>
            </div>
            <div>
              <h1 className="text-white font-bold text-base sm:text-lg leading-tight">
                ガバメントクラウド移行状況ダッシュボード
              </h1>
              <p className="hidden sm:block text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                デジタル庁 ガバメントクラウド移行状況インサイト｜全国1,741自治体の進捗を可視化
              </p>
            </div>
          </div>
        </div>
        <NavBar />
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
    </>
  );
}
