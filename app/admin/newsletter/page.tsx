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

  const sentCount = campaignList.filter((c) => c.status === "sent").length;
  const draftCount = campaignList.filter((c) => c.status === "draft").length;

  return {
    subscriberCount: subscriberCount ?? 0,
    sentCount,
    draftCount,
    campaigns: campaignList,
  };
}

export default async function NewsletterPage() {
  const { subscriberCount, sentCount, draftCount, campaigns } = await getData();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f7f7" }}>
      <div className="max-w-3xl mx-auto px-8 py-10">

        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "#111827" }}>
              ニュースレター
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              キャンペーンの作成・管理・統計確認
            </p>
          </div>
          <Link
            href="/admin/newsletter/compose"
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#002D72" }}
          >
            + 新規作成
          </Link>
        </div>

        {/* KPIバッジ行 */}
        <div className="flex gap-3 mb-8">
          {[
            { label: "購読者", value: subscriberCount, color: "#002D72", bg: "#eef2fa", href: "/admin/newsletter/subscribers" },
            { label: "配信済み", value: sentCount, color: "#16a34a", bg: "#f0fdf4", href: null },
            { label: "下書き", value: draftCount, color: "#d97706", bg: "#fffbeb", href: null },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{ backgroundColor: kpi.bg }}
            >
              <span className="text-xl font-extrabold tabular-nums" style={{ color: kpi.color }}>
                {kpi.value}
              </span>
              <span className="text-xs font-medium" style={{ color: kpi.color }}>
                {kpi.label}
              </span>
              {kpi.href && (
                <Link href={kpi.href} className="text-xs underline ml-1" style={{ color: kpi.color }}>
                  &rarr;
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* キャンペーン一覧 — note風カードリスト */}
        {campaigns.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <p className="text-sm mb-3" style={{ color: "#9ca3af" }}>
              まだキャンペーンがありません
            </p>
            <Link
              href="/admin/newsletter/compose"
              className="text-sm font-bold"
              style={{ color: "#002D72" }}
            >
              最初のキャンペーンを作成する &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl bg-white px-6 py-5 flex items-center justify-between hover:shadow-md transition-shadow"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
              >
                <div className="flex items-center gap-4 min-w-0">
                  {/* ステータスバッジ */}
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                    style={
                      c.status === "sent"
                        ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                        : { backgroundColor: "#fef3c7", color: "#d97706" }
                    }
                  >
                    {c.status === "sent" ? "送信済み" : "下書き"}
                  </span>

                  {/* タイトル */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#111827" }}>
                      {c.subject}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
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

                {/* 統計 + アクション */}
                <div className="flex items-center gap-5 flex-shrink-0 ml-6">
                  {c.status === "sent" && (
                    <>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums" style={{ color: "#111827" }}>
                          {c.open_count}
                        </p>
                        <p className="text-xs" style={{ color: "#9ca3af" }}>開封</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums" style={{ color: "#111827" }}>
                          {c.click_count}
                        </p>
                        <p className="text-xs" style={{ color: "#9ca3af" }}>クリック</p>
                      </div>
                    </>
                  )}
                  {c.status === "sent" ? (
                    <Link
                      href={`/admin/newsletter/${c.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                      style={{ borderColor: "#e5e7eb", color: "#374151" }}
                    >
                      詳細
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/newsletter/compose?id=${c.id}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#002D72" }}
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
    </div>
  );
}
