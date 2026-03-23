"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import NavBar from "./NavBar";

export default function RootShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isEmbed = pathname.startsWith("/embed");

  if (isAdmin || isEmbed) {
    // admin / embed 配下はそれぞれの layout.tsx に完全に委譲するため、
    // ヘッダー・フッター・max-w ラッパーをすべてスキップ
    return <>{children}</>;
  }

  return (
    <>
      {/* ヘッダー — 深紺 #002D72 */}
      <header style={{ backgroundColor: "var(--color-brand-secondary)" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 no-underline">
            {/* ロゴ: クラウド+GC */}
            <div className="flex-shrink-0" style={{ width: 36, height: 32 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="36" height="32">
                <path d="M155 128H48C25 128 8 110 8 88C8 68 22 52 42 48C42 47 42 46 42 44C42 22 60 4 82 4C100 4 114 15 122 30C128 26 135 24 143 24C164 24 182 42 182 64C182 66 182 68 181 70C192 76 198 87 198 100C198 116 184 128 166 128" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <text x="56" y="108" fontFamily="Helvetica Neue,Arial,sans-serif" fontSize="60" fontWeight="800" fill="white" letterSpacing="-2">GC</text>
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-base sm:text-lg leading-tight">
                ガバメントクラウド移行状況ダッシュボード
              </h1>
              <p className="hidden sm:block text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                デジタル庁 ガバメントクラウド移行状況インサイト｜全国1,741自治体の進捗を可視化
              </p>
            </div>
          </Link>
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
