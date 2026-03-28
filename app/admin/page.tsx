import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import SubscriberChart from "./newsletter/SubscriberChart";

export const metadata = { title: "管理ダッシュボード | GCInsight Admin" };
export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    <div>
      {/* 挨拶 */}
      <div style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: 0 }}>
          ダッシュボード
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
          GCInsight 管理パネル
        </p>
      </div>

      {/* KPI 3列 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, marginBottom: 48, borderTop: "1px solid #f3f4f6" }}>
        {[
          { label: "購読者数", value: totalLeads, unit: "人", href: "/admin/newsletter/subscribers" },
          { label: "配信数", value: sentCampaigns, unit: "回", href: null },
          { label: "開封率（推定）", value: openRate, unit: "%", href: null },
        ].map((kpi, i) => (
          <div
            key={kpi.label}
            style={{
              padding: "32px 0",
              borderRight: i < 2 ? "1px solid #f3f4f6" : "none",
              paddingLeft: i > 0 ? 32 : 0,
            }}
          >
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{kpi.label}</p>
            <p style={{ fontSize: 36, fontWeight: 700, color: "#111111", lineHeight: 1 }}>
              {kpi.value}
              <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4, color: "#6b7280" }}>{kpi.unit}</span>
            </p>
            {kpi.href && (
              <Link href={kpi.href} style={{ fontSize: 13, color: "#111111", marginTop: 8, display: "inline-block" }}>
                一覧を見る &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* 購読者推移グラフ */}
      <div style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111111", margin: "0 0 16px 0" }}>
          購読者推移（30日）
        </h2>
        <Suspense fallback={null}>
          <SubscriberChart />
        </Suspense>
      </div>

      {/* 直近の配信リスト */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111111", margin: 0 }}>
            直近の配信
          </h2>
          <Link href="/admin/newsletter" style={{ fontSize: 13, color: "#6b7280" }}>
            すべて見る &rarr;
          </Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: 14, color: "#9ca3af" }}>まだ配信はありません</p>
            <Link
              href="/admin/newsletter/compose"
              style={{ fontSize: 13, color: "#111111", marginTop: 12, display: "inline-block" }}
            >
              最初のメールを作成する &rarr;
            </Link>
          </div>
        ) : (
          <div>
            {recentCampaigns.map((c: { id: number; subject: string; status: string; sent_at: string | null; created_at: string }) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 0",
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontWeight: 500,
                      flexShrink: 0,
                      ...(c.status === "sent"
                        ? { backgroundColor: "#f0fdf4", color: "#16a34a" }
                        : { backgroundColor: "#fef9ec", color: "#d97706" }),
                    }}
                  >
                    {c.status === "sent" ? "送信済" : "下書き"}
                  </span>
                  <p style={{ fontSize: 14, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.subject}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0, marginLeft: 16 }}>
                  {c.status === "sent" && (
                    <span style={{ fontSize: 13, color: "#6b7280" }}>
                      開封 {openMap[c.id] ?? 0}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>
                    {new Date(c.sent_at ?? c.created_at).toLocaleDateString("ja-JP")}
                  </span>
                  {c.status === "sent" ? (
                    <Link href={`/admin/newsletter/${c.id}`} style={{ fontSize: 13, color: "#111111" }}>
                      詳細
                    </Link>
                  ) : (
                    <Link href={`/admin/newsletter/compose?id=${c.id}`} style={{ fontSize: 13, color: "#111111" }}>
                      編集
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
