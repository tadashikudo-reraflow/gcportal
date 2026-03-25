import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const metadata = { title: "ニュースレター管理 | GCInsight Admin" };
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

type Campaign = {
  id: number;
  subject: string;
  status: string;
  sent_at: string | null;
  created_at: string;
  open_count: number;
  click_count: number;
};

async function getData() {
  const supabase = getSupabase();

  const [{ count: subscriberCount }, { data: campaigns }, { data: events }] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("campaigns")
        .select("id, subject, status, sent_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("email_events")
        .select("campaign_id, event_type"),
    ]);

  const openMap: Record<number, number> = {};
  const clickMap: Record<number, number> = {};
  for (const e of events ?? []) {
    if (e.event_type === "open") {
      openMap[e.campaign_id] = (openMap[e.campaign_id] ?? 0) + 1;
    } else if (e.event_type === "click") {
      clickMap[e.campaign_id] = (clickMap[e.campaign_id] ?? 0) + 1;
    }
  }

  const campaignList: Campaign[] = (campaigns ?? []).map((c) => ({
    ...c,
    open_count: openMap[c.id] ?? 0,
    click_count: clickMap[c.id] ?? 0,
  }));

  return {
    subscriberCount: subscriberCount ?? 0,
    campaigns: campaignList,
  };
}

export default async function NewsletterPage() {
  const { subscriberCount, campaigns } = await getData();

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: 0 }}>
            ニュースレター
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            {subscriberCount} 人の購読者
          </p>
        </div>
        <Link
          href="/admin/newsletter/compose"
          style={{
            backgroundColor: "#111111",
            color: "#ffffff",
            fontSize: 13,
            fontWeight: 600,
            padding: "7px 14px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          作成する
        </Link>
      </div>

      {/* キャンペーン一覧 */}
      {campaigns.length === 0 ? (
        <div style={{ padding: "64px 0", textAlign: "center", borderTop: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 16 }}>
            まだキャンペーンがありません
          </p>
          <Link
            href="/admin/newsletter/compose"
            style={{ fontSize: 13, color: "#111111" }}
          >
            最初のキャンペーンを作成する &rarr;
          </Link>
        </div>
      ) : (
        <div>
          {campaigns.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
                borderBottom: "1px solid #f3f4f6",
                cursor: "default",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#f9f9f9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
            >
              {/* 左: ステータス + 件名 + 日付 */}
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
                  {c.status === "sent" ? "送信済み" : "下書き"}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 15, color: "#111111", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                    {c.subject}
                  </p>
                  <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
                    {c.sent_at
                      ? new Date(c.sent_at).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : `作成: ${new Date(c.created_at).toLocaleDateString("ja-JP")}`}
                  </p>
                </div>
              </div>

              {/* 右: 統計 + アクション */}
              <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0, marginLeft: 24 }}>
                {c.status === "sent" && (
                  <>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111111", margin: 0 }}>{c.open_count}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>開封</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#111111", margin: 0 }}>{c.click_count}</p>
                      <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>クリック</p>
                    </div>
                  </>
                )}
                {c.status === "sent" ? (
                  <Link
                    href={`/admin/newsletter/${c.id}`}
                    style={{ fontSize: 13, color: "#111111" }}
                  >
                    詳細
                  </Link>
                ) : (
                  <Link
                    href={`/admin/newsletter/compose?id=${c.id}`}
                    style={{ fontSize: 13, color: "#111111", fontWeight: 600 }}
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
  );
}
