import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { DuplicateButton } from "./CampaignActions";

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
  sent_count: number;
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
        .select("id, subject, status, sent_at, created_at, sent_count")
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
    sent_count: c.sent_count ?? 0,
    open_count: openMap[c.id] ?? 0,
    click_count: clickMap[c.id] ?? 0,
  }));

  return {
    subscriberCount: subscriberCount ?? 0,
    campaigns: campaignList,
  };
}

function CampaignRow({ c }: { c: Campaign }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      {/* 左: 件名 + 日付 */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          fontSize: 15,
          color: "#111111",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          margin: 0,
        }}>
          {c.subject}
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>
          {c.sent_at
            ? `送信: ${new Date(c.sent_at).toLocaleString("ja-JP", {
                year: "numeric", month: "2-digit", day: "2-digit",
                hour: "2-digit", minute: "2-digit",
              })}`
            : `作成: ${new Date(c.created_at).toLocaleDateString("ja-JP")}`}
        </p>
      </div>

      {/* 右: 統計 + アクション */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0, marginLeft: 24 }}>
        {c.status === "sent" && (
          <>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111111", margin: 0 }}>{c.sent_count}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>送信</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111111", margin: 0 }}>{c.open_count}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                開封 {c.sent_count > 0 ? `(${Math.round(c.open_count / c.sent_count * 100)}%)` : ""}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111111", margin: 0 }}>{c.click_count}</p>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>クリック</p>
            </div>
          </>
        )}
        <DuplicateButton campaignId={c.id} />
        {c.status === "sent" ? (
          <Link
            href={`/admin/newsletter/${c.id}`}
            style={{ fontSize: 13, color: "#6b7280" }}
          >
            詳細
          </Link>
        ) : (
          <Link
            href={`/admin/newsletter/compose?id=${c.id}`}
            style={{
              fontSize: 13,
              color: "#fff",
              backgroundColor: "#111111",
              padding: "5px 12px",
              borderRadius: 6,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            編集・送信
          </Link>
        )}
      </div>
    </div>
  );
}

export default async function NewsletterPage() {
  const { subscriberCount, campaigns } = await getData();
  const drafts = campaigns.filter((c) => c.status !== "sent");
  const sent = campaigns.filter((c) => c.status === "sent");

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 40 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111111", margin: 0 }}>
            ニュースレター
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            購読者 {subscriberCount} 人
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
          + 新規作成
        </Link>
      </div>

      {/* 下書きセクション */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#6b7280",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 4,
          paddingBottom: 8,
          borderBottom: "2px solid #111111",
        }}>
          下書き ({drafts.length})
        </h2>
        {drafts.length === 0 ? (
          <p style={{ fontSize: 14, color: "#9ca3af", padding: "24px 0" }}>
            下書きはありません。
            <Link href="/admin/newsletter/compose" style={{ color: "#111111", marginLeft: 8 }}>
              新規作成 →
            </Link>
          </p>
        ) : (
          drafts.map((c) => <CampaignRow key={c.id} c={c} />)
        )}
      </section>

      {/* 送信済みセクション */}
      <section>
        <h2 style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#6b7280",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 4,
          paddingBottom: 8,
          borderBottom: "1px solid #e5e7eb",
        }}>
          送信済み ({sent.length})
        </h2>
        {sent.length === 0 ? (
          <p style={{ fontSize: 14, color: "#9ca3af", padding: "24px 0" }}>
            まだ送信済みキャンペーンはありません。
          </p>
        ) : (
          sent.map((c) => <CampaignRow key={c.id} c={c} />)
        )}
      </section>
    </div>
  );
}
