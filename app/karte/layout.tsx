import Link from "next/link";
import KarteBottomNav from "./KarteBottomNav";

export default function KarteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* karte専用ヘッダー */}
      <header
        style={{
          backgroundColor: "#FFFFFF",
          position: "relative",
          zIndex: 50,
          boxShadow: "0 1px 3px rgba(23, 28, 31, 0.06)",
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/karte" className="flex items-center gap-2.5 sm:gap-3 no-underline">
              {/* 緑系ロゴ（医療テーマ） */}
              <div className="flex-shrink-0" style={{ width: 36, height: 32 }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="36" height="32">
                  <path
                    d="M155 128H48C25 128 8 110 8 88C8 68 22 52 42 48C42 47 42 46 42 44C42 22 60 4 82 4C100 4 114 15 122 30C128 26 135 24 143 24C164 24 182 42 182 64C182 66 182 68 181 70C192 76 198 87 198 100C198 116 184 128 166 128"
                    stroke="#2e7d32"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <text
                    x="42"
                    y="108"
                    fontFamily="Helvetica Neue,Arial,sans-serif"
                    fontSize="52"
                    fontWeight="800"
                    fill="#2e7d32"
                    letterSpacing="-1"
                  >
                    GCI
                  </text>
                </svg>
              </div>
              <div>
                <p className="font-bold text-base sm:text-lg leading-tight" style={{ color: "#2e7d32" }}>
                  GCInsight
                </p>
                <p className="hidden sm:block text-xs mt-0.5 font-medium" style={{ color: "#2e7d32" }}>
                  for 電子カルテ標準化
                </p>
              </div>
            </Link>

            <Link
              href="/"
              className="text-xs font-medium no-underline hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              ガバクラダッシュボードへ →
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-14 sm:pb-6">
        {children}
      </main>

      {/* モバイルボトムナビ */}
      <KarteBottomNav />

      {/* フッター */}
      <footer className="mt-12 border-t-2 border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                GCInsight for 電子カルテ標準化
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                厚生労働省・内閣官房の公式資料に基づく電子カルテ標準化解説メディア
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/karte"
                className="text-xs font-medium no-underline hover:underline"
                style={{ color: "#2e7d32" }}
              >
                記事一覧
              </Link>
              <Link
                href="/sources"
                className="text-xs font-medium no-underline hover:underline"
                style={{ color: "var(--color-brand-primary)" }}
              >
                データソース
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-[var(--color-border)]">
            <Link
              href="/privacy"
              className="text-xs no-underline hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              プライバシーポリシー
            </Link>
            <Link
              href="/terms"
              className="text-xs no-underline hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              利用規約・免責事項
            </Link>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              &copy; 2026 GCInsight
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
