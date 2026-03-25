import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { logoutAction } from "./actions";

export const metadata = { title: "管理ダッシュボード | GCInsight Admin" };
export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [{ count: totalLeads }, { count: sentCampaigns }, { data: recentCampaigns }] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "sent"),
      supabase.from("campaigns").select("id, subject, status, sent_at, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

  return {
    totalLeads: totalLeads ?? 0,
    sentCampaigns: sentCampaigns ?? 0,
    recentCampaigns: recentCampaigns ?? [],
  };
}

export default async function AdminPage() {
  const { totalLeads, sentCampaigns, recentCampaigns } = await getStats();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ backgroundColor: "var(--color-brand-secondary)" }}
      >
        <span className="text-white font-extrabold text-sm tracking-wide">GCInsight Admin</span>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="text-xs text-white/70 hover:text-white">
            サイトを見る &nearr;
          </Link>
          <form action={logoutAction}>
            <button className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "#ffffff20", color: "#fff" }}>
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "購読者数", value: totalLeads, color: "var(--color-brand-secondary)", bg: "#f0f4ff", icon: "👥" },
            { label: "配信済み", value: sentCampaigns, color: "#16a34a", bg: "#f0fdf4", icon: "📨" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-5 text-center shadow-sm" style={{ backgroundColor: s.bg }}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-4xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: "var(--color-text-secondary)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/newsletter/compose"
            className="flex items-center gap-3 rounded-xl p-4 shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: "#1d4ed8", color: "#fff" }}>
            <span className="text-xl">✏️</span>
            <div>
              <p className="text-sm font-bold">新規メール作成</p>
              <p className="text-xs opacity-75">ニュースレターを作成・配信</p>
            </div>
          </Link>
          <Link href="/admin/newsletter/subscribers"
            className="flex items-center gap-3 rounded-xl p-4 shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: "#0f766e", color: "#fff" }}>
            <span className="text-xl">👥</span>
            <div>
              <p className="text-sm font-bold">購読者一覧</p>
              <p className="text-xs opacity-75">リスト管理・確認</p>
            </div>
          </Link>
        </div>

        {/* 直近の配信 */}
        <div className="rounded-xl shadow-sm bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>直近の配信</h2>
            <Link href="/admin/newsletter" className="text-xs font-medium" style={{ color: "#1d4ed8" }}>
              すべて見る &rarr;
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--color-text-muted)" }}>
              まだ配信はありません
            </p>
          ) : (
            <div className="space-y-2">
              {recentCampaigns.map((c: { id: number; subject: string; status: string; sent_at: string | null; created_at: string }) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={c.status === "sent"
                        ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                        : { backgroundColor: "#fef3c7", color: "#d97706" }}>
                      {c.status === "sent" ? "送信済" : "下書き"}
                    </span>
                    <p className="text-xs font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                      {c.subject}
                    </p>
                  </div>
                  <p className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(c.sent_at ?? c.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
