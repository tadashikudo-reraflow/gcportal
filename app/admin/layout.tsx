import type { Metadata } from "next";
import AdminSidebar from "./AdminSidebar";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "GCInsight Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* 左サイドバー */}
      <aside
        className="flex-shrink-0 flex flex-col"
        style={{
          width: 220,
          backgroundColor: "#002D72",
          minHeight: "100vh",
        }}
      >
        {/* ロゴ */}
        <div
          className="px-5 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">&#9881;</span>
            <span
              className="font-extrabold text-sm tracking-wide"
              style={{ color: "#F5B500" }}
            >
              GCInsight Admin
            </span>
          </div>
        </div>

        {/* ナビゲーション（クライアントコンポーネント） */}
        <AdminSidebar />

        {/* フッター: サイトを見る + ログアウト */}
        <div
          className="mt-auto px-3 py-4 border-t space-y-1"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <span>&#127760;</span>
            <span>サイトを見る &#8599;</span>
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              <span>&#128682;</span>
              <span>ログアウト</span>
            </button>
          </form>
        </div>
      </aside>

      {/* 右メインコンテンツ */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
