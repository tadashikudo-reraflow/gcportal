"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import NavBar from "./NavBar";
import BottomNav from "@/components/BottomNav";
import { useUXTracker } from "@/hooks/useUXTracker";
import StickyCTA from "@/components/StickyCTA";
import NewsletterModal from "@/components/NewsletterModal";
import XWelcomeBanner from "@/components/XWelcomeBanner";

export default function RootShell({ children }: { children: React.ReactNode }) {
  useUXTracker();
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isEmbed = pathname.startsWith("/embed");
  const isKarte = pathname.startsWith("/karte");

  if (isAdmin || isEmbed || isKarte) {
    // admin / embed / karte 配下はそれぞれの layout.tsx に完全に委譲するため、
    // ヘッダー・フッター・max-w ラッパーをすべてスキップ
    return <>{children}</>;
  }

  return (
    <>
      {/* ヘッダー — Digital Shoji 白ベース */}
      <header style={{ backgroundColor: "#FFFFFF", position: "relative", zIndex: 50, boxShadow: "0 1px 3px rgba(23, 28, 31, 0.06)" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 no-underline">
              {/* ロゴ: クラウド+GC */}
              <div className="flex-shrink-0" style={{ width: 36, height: 32 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="36" height="32">
                  <path d="M155 128H48C25 128 8 110 8 88C8 68 22 52 42 48C42 47 42 46 42 44C42 22 60 4 82 4C100 4 114 15 122 30C128 26 135 24 143 24C164 24 182 42 182 64C182 66 182 68 181 70C192 76 198 87 198 100C198 116 184 128 166 128" stroke="#00338D" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <text x="56" y="108" fontFamily="Helvetica Neue,Arial,sans-serif" fontSize="60" fontWeight="800" fill="#00338D" letterSpacing="-2">GC</text>
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg leading-tight" style={{ color: "#00338D" }}>
                  GC Insight
                </h1>
                <p className="hidden sm:block text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                  ガバメントクラウド移行状況ダッシュボード
                </p>
              </div>
            </Link>

            <NewsletterModal
              label="ニュースレター登録"
              source="newsletter_header"
              buttonClassName="hidden sm:inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold"
              buttonStyle={{ backgroundColor: "#00338D", color: "#fff", border: "2px solid #00338D" }}
            />
          </div>
        </div>
        <div style={{ backgroundColor: "var(--color-surface-container-low)" }}>
          <NavBar />
        </div>
      </header>

      {/* X（Twitter）流入時のウェルカムバナー — 1セッション1回だけ表示 */}
      <XWelcomeBanner />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-14 sm:pb-6">
        {children}
      </main>

      {/* #9 スティッキーCTA（スクロール30%超でフェードイン） */}
      <StickyCTA />

      {/* フッター */}
      <footer
        className="mt-12 border-t-2 border-[var(--color-border)] bg-[var(--color-card)]"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                GC Insight
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                総務省・デジタル庁公表データに基づく移行状況の可視化サイト
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NewsletterModal
                label="ニュースレター登録"
                source="newsletter_footer"
                buttonClassName="btn-cta text-xs"
                buttonStyle={{ minHeight: 36, padding: "6px 16px", fontSize: "0.75rem" }}
              />
              <Link
                href="/sources"
                className="text-xs font-medium no-underline hover:underline"
                style={{ color: "var(--color-brand-primary)" }}
              >
                データソース一覧
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-[var(--color-border)]">
            <Link href="/privacy" className="text-xs no-underline hover:underline" style={{ color: "var(--color-text-muted)" }}>
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="text-xs no-underline hover:underline" style={{ color: "var(--color-text-muted)" }}>
              利用規約・免責事項
            </Link>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              &copy; 2026 GC Insight
            </span>
          </div>
        </div>
      </footer>

      {/* モバイルボトムナビ（sm以下のみ表示） */}
      <BottomNav />
    </>
  );
}
