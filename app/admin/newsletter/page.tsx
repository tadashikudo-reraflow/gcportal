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
};

async function getData() {
  const supabase = getSupabase();

  const [{ count: subscriberCount }, { data: campaigns }, { data: opens }] =
    await Promise.all([
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase
        .from("campaigns")
        .select("id, subject, status, sent_at, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("email_events")
        .select("campaign_id")
        .eq("event_type", "open"),
    ]);

  const openMap: Record<number, number> = {};
  for (const o of opens ?? []) {
    openMap[o.campaign_id] = (openMap[o.campaign_id] ?? 0) + 1;
  }

  const campaignList: Campaign[] = (campaigns ?? []).map((c) => ({
    ...c,
    open_count: openMap[c.id] ?? 0,
  }));

  const sentCount = campaignList.filter((c) => c.status === "sent").length;

  return {
    subscriberCount: subscriberCount ?? 0,
    sentCount,
    campaigns: campaignList,
  };
}

export default async function NewsletterPage() {
  const { subscriberCount, sentCount, campaigns } = await getData();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--color-text-primary, #111)" }}
          >
            ニュースレター管理
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
            購読者への一斉メール配信・開封率管理
          </p>
        </div>
        <Link
          href="/admin/newsletter/compose"
          className="px-4 py-2 rounded-lg text-sm font-bold text-white"
          style={{ backgroundColor: "#002D72" }}
        >
          + 新規作成
        </Link>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "購読者数",
            value: subscriberCount,
            color: "#002D72",
            bg: "#f0f4ff",
            href: "/admin/newsletter/subscribers",
          },
          {
            label: "配信済みキャンペーン",
            value: sentCount,
            color: "#16a34a",
            bg: "#f0fdf4",
            href: null,
          },
          {
            label: "下書き",
            value: campaigns.filter((c) => c.status === "draft").length,
            color: "#d97706",
            bg: "#fffbeb",
            href: null,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 text-center"
            style={{ backgroundColor: s.bg }}
          >
            <p
              className="text-3xl font-extrabold tabular-nums"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "#6b7280" }}>
              {s.label}
            </p>
            {s.href && (
              <Link
                href={s.href}
                className="text-xs mt-2 inline-block font-medium"
                style={{ color: s.color }}
              >
                一覧を見る &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* キャンペーン一覧 */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
        >
          <span className="text-sm font-bold" style={{ color: "#374151" }}>
            直近のキャンペーン
          </span>
          <Link
            href="/admin/newsletter/compose"
            className="text-xs font-medium"
            style={{ color: "#002D72" }}
          >
            新規作成 &rarr;
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "#9ca3af" }}>
            まだキャンペーンがありません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", color: "#6b7280" }}>
                <th className="text-left px-5 py-3 font-medium">件名</th>
                <th className="text-left px-5 py-3 font-medium">ステータス</th>
                <th className="text-left px-5 py-3 font-medium">送信日時</th>
                <th className="text-right px-5 py-3 font-medium">開封数</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-t"
                  style={{ borderColor: "#f3f4f6" }}
                >
                  <td className="px-5 py-3.5 font-medium" style={{ color: "#111827" }}>
                    {c.subject}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={
                        c.status === "sent"
                          ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                          : { backgroundColor: "#fef3c7", color: "#d97706" }
                      }
                    >
                      {c.status === "sent" ? "送信済み" : "下書き"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "#6b7280" }}>
                    {c.sent_at
                      ? new Date(c.sent_at).toLocaleString("ja-JP", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums" style={{ color: "#374151" }}>
                    {c.open_count}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {c.status === "draft" && (
                      <Link
                        href={`/admin/newsletter/compose?id=${c.id}`}
                        className="text-xs font-medium"
                        style={{ color: "#002D72" }}
                      >
                        編集
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* クイックリンク */}
      <div className="mt-6 flex gap-3">
        <Link
          href="/admin/newsletter/subscribers"
          className="text-sm px-4 py-2 rounded-lg border font-medium"
          style={{ borderColor: "#e5e7eb", color: "#374151" }}
        >
          購読者一覧
        </Link>
      </div>
    </div>
  );
}
