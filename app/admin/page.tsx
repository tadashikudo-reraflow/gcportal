import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const metadata = { title: "管理ダッシュボード | GCInsight Admin" };
export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [
    { count: totalLeads },
    { count: sentCampaigns },
    { data: recentCampaigns },
    { data: opens },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("campaigns").select("id, subject, status, sent_at, created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("email_events").select("campaign_id").eq("event_type", "open"),
  ]);

  // 直近の送信済みキャンペーンの開封率を計算
  const openMap: Record<number, number> = {};
  for (const o of opens ?? []) {
    openMap[o.campaign_id] = (openMap[o.campaign_id] ?? 0) + 1;
  }

  const sentList = (recentCampaigns ?? []).filter((c) => c.status === "sent");
  const totalOpens = sentList.reduce((sum, c) => sum + (openMap[c.id] ?? 0), 0);
  const openRate =
    sentList.length > 0 && totalLeads
      ? Math.round((totalOpens / (sentList.length * (totalLeads ?? 1))) * 100)
      : 0;

  return {
    totalLeads: totalLeads ?? 0,
    sentCampaigns: sentCampaigns ?? 0,
    openRate,
    recentCampaigns: recentCampaigns ?? [],
    openMap,
  };
}

export default async function AdminPage() {
  const { totalLeads, sentCampaigns, openRate, recentCampaigns, openMap } = await getStats();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f7f7" }}>
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-8">

        {/* 挨拶 */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#111827" }}>
            こんにちは 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
            GCInsight 管理パネル — 本日も配信を続けましょう
          </p>
        </div>

        {/* KPIカード */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "購読者数", value: totalLeads, unit: "人", color: "#002D72", href: "/admin/newsletter/subscribers" },
            { label: "配信数", value: sentCampaigns, unit: "回", color: "#16a34a", href: null },
            { label: "開封率（推定）", value: openRate, unit: "%", color: "#d97706", href: null },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl bg-white p-5 shadow-sm"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: "#9ca3af" }}>
                {kpi.label}
              </p>
              <p className="text-3xl font-extrabold tabular-nums" style={{ color: kpi.color }}>
                {kpi.value}
                <span className="text-base font-medium ml-0.5">{kpi.unit}</span>
              </p>
              {kpi.href && (
                <Link href={kpi.href} className="text-xs mt-2 inline-block font-medium" style={{ color: kpi.color }}>
                  一覧を見る &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* 大きなCTAボタン */}
        <Link
          href="/admin/newsletter/compose"
          className="flex items-center justify-center gap-3 w-full rounded-2xl py-5 text-white font-bold text-base transition-opacity hover:opacity-90 shadow-sm"
          style={{ backgroundColor: "#002D72", boxShadow: "0 2px 8px rgba(0,45,114,0.25)" }}
        >
          <span className="text-xl">&#9998;</span>
          <span>新しいメールを書く</span>
        </Link>

        {/* 直近の配信リスト */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#f3f4f6" }}>
            <h2 className="text-sm font-bold" style={{ color: "#111827" }}>
              直近の配信
            </h2>
            <Link href="/admin/newsletter" className="text-xs font-medium" style={{ color: "#002D72" }}>
              すべて見る &rarr;
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm" style={{ color: "#9ca3af" }}>まだ配信はありません</p>
              <Link
                href="/admin/newsletter/compose"
                className="inline-block mt-3 text-sm font-medium"
                style={{ color: "#002D72" }}
              >
                最初のメールを作成する &rarr;
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
              {recentCampaigns.map((c: { id: number; subject: string; status: string; sent_at: string | null; created_at: string }) => (
                <div key={c.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={
                        c.status === "sent"
                          ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                          : { backgroundColor: "#fef3c7", color: "#d97706" }
                      }
                    >
                      {c.status === "sent" ? "送信済" : "下書き"}
                    </span>
                    <p className="text-sm font-medium truncate" style={{ color: "#111827" }}>
                      {c.subject}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    {c.status === "sent" && (
                      <span className="text-xs" style={{ color: "#9ca3af" }}>
                        開封 {openMap[c.id] ?? 0}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: "#9ca3af" }}>
                      {new Date(c.sent_at ?? c.created_at).toLocaleDateString("ja-JP")}
                    </span>
                    {c.status === "sent" ? (
                      <Link
                        href={`/admin/newsletter/${c.id}`}
                        className="text-xs font-medium"
                        style={{ color: "#002D72" }}
                      >
                        詳細
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/newsletter/compose?id=${c.id}`}
                        className="text-xs font-medium"
                        style={{ color: "#002D72" }}
                      >
                        編集
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* クイックリンク */}
        <div className="flex gap-3">
          <Link
            href="/admin/newsletter/subscribers"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sm font-medium shadow-sm hover:shadow transition"
            style={{ color: "#374151", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <span>&#128101;</span>
            <span>購読者一覧</span>
          </Link>
          <Link
            href="/admin/newsletter"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sm font-medium shadow-sm hover:shadow transition"
            style={{ color: "#374151", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
          >
            <span>&#128140;</span>
            <span>キャンペーン管理</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
