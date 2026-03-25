import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getCampaign(id: number) {
  const supabase = getSupabase();

  const [{ data: campaign }, { count: totalSubscribers }, { data: events }] =
    await Promise.all([
      supabase
        .from("campaigns")
        .select("id, subject, body_html, status, sent_at, created_at")
        .eq("id", id)
        .single(),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("email_events")
        .select("event_type, lead_id")
        .eq("campaign_id", id),
    ]);

  if (!campaign) return null;

  const opens = (events ?? []).filter((e) => e.event_type === "open");
  const clicks = (events ?? []).filter((e) => e.event_type === "click");
  const uniqueOpens = new Set(opens.map((e) => e.lead_id)).size;
  const uniqueClicks = new Set(clicks.map((e) => e.lead_id)).size;
  const sent = totalSubscribers ?? 0;
  const openRate = sent > 0 ? Math.round((uniqueOpens / sent) * 100) : 0;
  const clickRate = sent > 0 ? Math.round((uniqueClicks / sent) * 100) : 0;

  return {
    campaign,
    stats: {
      sent,
      opens: uniqueOpens,
      open_rate: openRate,
      clicks: uniqueClicks,
      click_rate: clickRate,
    },
  };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (isNaN(id)) notFound();

  const result = await getCampaign(id);
  if (!result) notFound();

  const { campaign, stats } = result;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f7f7f7" }}>
      <div className="max-w-3xl mx-auto px-8 py-10 space-y-6">

        {/* ヘッダー */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/newsletter"
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:bg-white"
            style={{ borderColor: "#e5e7eb", color: "#6b7280" }}
          >
            &larr; 戻る
          </Link>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={
              campaign.status === "sent"
                ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                : { backgroundColor: "#fef3c7", color: "#d97706" }
            }
          >
            {campaign.status === "sent" ? "送信済み" : "下書き"}
          </span>
        </div>

        {/* タイトルカード */}
        <div className="rounded-2xl bg-white px-7 py-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
          <h1 className="text-2xl font-extrabold mb-2" style={{ color: "#111827" }}>
            {campaign.subject}
          </h1>
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            {campaign.sent_at
              ? `配信日時: ${new Date(campaign.sent_at).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : `作成日: ${new Date(campaign.created_at).toLocaleDateString("ja-JP")}`}
          </p>
        </div>

        {/* 統計カード */}
        {campaign.status === "sent" && (
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "送信数", value: stats.sent, unit: "件", color: "#002D72" },
              { label: "開封数", value: stats.opens, unit: "件", color: "#0891b2" },
              { label: "開封率", value: stats.open_rate, unit: "%", color: "#16a34a" },
              { label: "クリック数", value: stats.clicks, unit: "件", color: "#7c3aed" },
              { label: "クリック率", value: stats.click_rate, unit: "%", color: "#d97706" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white p-4 text-center"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
              >
                <p className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>
                  {s.value}
                  <span className="text-sm font-medium">{s.unit}</span>
                </p>
                <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 本文プレビュー */}
        {campaign.body_html && (
          <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#f3f4f6" }}>
              <span className="text-sm font-bold" style={{ color: "#374151" }}>
                メール本文プレビュー
              </span>
            </div>
            <iframe
              srcDoc={campaign.body_html}
              className="w-full"
              style={{ height: 480, border: "none" }}
              sandbox="allow-same-origin"
            />
          </div>
        )}

        {/* アクション */}
        {campaign.status !== "sent" && (
          <div className="flex gap-3">
            <Link
              href={`/admin/newsletter/compose?id=${campaign.id}`}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90"
              style={{ backgroundColor: "#002D72" }}
            >
              編集する
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
