export const dynamic = "force-dynamic";
export const metadata = { title: "サイト設定 | GCInsight Admin" };

import SettingsClient from "./SettingsClient";

// 表示のみ項目（環境変数・固定値）
const STATIC_SETTINGS = [
  { label: "サイトタイトル", value: "ガバメントクラウド移行状況ダッシュボード" },
  { label: "サイトURL", value: "gcportal-tau.vercel.app" },
  { label: "パーマリンク構造", value: "/articles/{slug}" },
  { label: "記事一覧URL", value: "/articles" },
] as const;

export default function SettingsPage() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "（未設定）";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* ページヘッダー */}
      <div
        className="px-6 py-5 border-b"
        style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
      >
        <h1 className="text-xl font-extrabold" style={{ color: "#002D72" }}>
          設定 &gt; 一般
        </h1>
        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
          サイト全体の基本設定を管理します
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* 固定設定（表示のみ） */}
        <section
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
          >
            <h2 className="font-bold text-sm" style={{ color: "#002D72" }}>
              基本設定
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
              これらの設定は環境変数で管理されており、ここでは変更できません
            </p>
          </div>

          <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
            {STATIC_SETTINGS.map(({ label, value }) => (
              <div key={label} className="px-5 py-4 grid grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold" style={{ color: "#374151" }}>
                  {label}
                </label>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={value}
                    readOnly
                    className="w-full text-sm rounded-lg border px-3 py-2 cursor-not-allowed"
                    style={{
                      borderColor: "#e5e7eb",
                      backgroundColor: "#f9fafb",
                      color: "#6b7280",
                    }}
                  />
                </div>
              </div>
            ))}

            {/* 管理者メール（環境変数から） */}
            <div className="px-5 py-4 grid grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold" style={{ color: "#374151" }}>
                管理者メール
              </label>
              <div className="col-span-2">
                <input
                  type="text"
                  value={adminEmail}
                  readOnly
                  className="w-full text-sm rounded-lg border px-3 py-2 cursor-not-allowed"
                  style={{
                    borderColor: "#e5e7eb",
                    backgroundColor: "#f9fafb",
                    color: "#6b7280",
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 変更可能設定（SettingsClient で管理） */}
        <SettingsClient />

        {/* Supabase 接続情報 */}
        <section
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
          >
            <h2 className="font-bold text-sm" style={{ color: "#002D72" }}>
              データベース接続
            </h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold" style={{ color: "#374151" }}>
                Supabase URL
              </label>
              <div className="col-span-2">
                <input
                  type="text"
                  value={process.env.NEXT_PUBLIC_SUPABASE_URL ?? "（未設定）"}
                  readOnly
                  className="w-full text-xs rounded-lg border px-3 py-2 cursor-not-allowed font-mono"
                  style={{
                    borderColor: "#e5e7eb",
                    backgroundColor: "#f9fafb",
                    color: "#6b7280",
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "#16a34a" }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#16a34a" }} />
              接続済み
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
