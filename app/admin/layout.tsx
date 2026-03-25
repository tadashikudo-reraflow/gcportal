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
    <div className="flex min-h-screen" style={{ backgroundColor: "#f7f7f7" }}>
      {/* 左サイドバー — note風白背景 */}
      <aside
        className="flex-shrink-0 flex flex-col"
        style={{
          width: 220,
          backgroundColor: "#ffffff",
          minHeight: "100vh",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        {/* ロゴ */}
        <div className="px-5 py-5">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
              style={{ backgroundColor: "#002D72" }}
            >
              GC
            </span>
            <span
              className="font-extrabold text-sm tracking-wide"
              style={{ color: "#002D72" }}
            >
              GCInsight
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded font-bold"
              style={{ backgroundColor: "#F5B500", color: "#fff", fontSize: "9px" }}
            >
              Admin
            </span>
          </div>
        </div>

        {/* ナビゲーション */}
        <AdminSidebar />

        {/* フッター */}
        <div
          className="mt-auto px-3 py-4 border-t space-y-0.5"
          style={{ borderColor: "#e5e7eb" }}
        >
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-gray-50"
            style={{ color: "#9ca3af" }}
          >
            <span>&#127760;</span>
            <span>サイトを見る &#8599;</span>
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left hover:bg-gray-50"
              style={{ color: "#9ca3af" }}
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
