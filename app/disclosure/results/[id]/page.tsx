import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Breadcrumb from "@/components/Breadcrumb";

export const revalidate = 3600;

type DisclosureRequest = {
  id: string;
  topic: string;
  category: string;
  municipality: string | null;
  status: string;
  submitted_at: string | null;
  disclosed_at: string | null;
  result_title: string | null;
  result_summary: string | null;
  result_url: string | null;
  created_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: "請求中",  color: "#2563EB", bg: "#DBEAFE" },
  disclosed: { label: "開示済",  color: "var(--color-success)", bg: "var(--color-success-bg)" },
  rejected:  { label: "不開示",  color: "#DC2626", bg: "#FEE2E2" },
};

const CATEGORY_LABELS: Record<string, string> = {
  migration_plan: "移行計画・方針",
  delay_reason:   "遅延・未移行の理由",
  cost:           "コスト・予算",
  vendor:         "ベンダー・調達",
  schedule:       "スケジュール",
  municipality:   "特定自治体の状況",
  other:          "その他",
};

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getRequest(id: string): Promise<DisclosureRequest | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("disclosure_requests")
    .select("id, topic, category, municipality, status, submitted_at, disclosed_at, result_title, result_summary, result_url, created_at")
    .eq("id", id)
    .in("status", ["submitted", "disclosed", "rejected"])
    .single();
  return data ?? null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const r = await getRequest(id);
  if (!r) return { title: "開示請求 | GCInsight" };
  const title = r.result_title ?? r.topic;
  return {
    title: `${title}｜開示請求依頼｜GCInsight`,
    description: r.result_summary ?? `GCInsight編集部がデジタル庁へ提出した情報公開請求の結果: ${r.topic}`,
  };
}

export default async function DisclosureResultDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const r = await getRequest(id);
  if (!r) notFound();

  const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.submitted;
  const title = r.result_title ?? r.topic;

  const timeline = [
    { label: "リクエスト受付", date: r.created_at, icon: "📝", done: true },
    { label: "デジタル庁へ提出", date: r.submitted_at, icon: "📨", done: !!r.submitted_at },
    { label: "開示・不開示の決定", date: r.disclosed_at, icon: "📋", done: !!r.disclosed_at },
    { label: "GCInsightで公開", date: r.result_url ? (r.disclosed_at ?? null) : null, icon: "📢", done: !!r.result_url },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Breadcrumb items={[
        { label: "開示請求依頼", href: "/disclosure" },
        { label: "開示結果一覧", href: "/disclosure/results" },
        { label: title.length > 20 ? title.slice(0, 20) + "…" : title },
      ]} />

      {/* ヘッダー */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2.5 py-1 rounded"
            style={{ backgroundColor: sc.bg, color: sc.color }}>
            {sc.label}
          </span>
          <span className="text-xs px-2.5 py-1 rounded"
            style={{ backgroundColor: "var(--color-surface-container-low)", color: "var(--color-text-secondary)" }}>
            {CATEGORY_LABELS[r.category] ?? r.category}
            {r.municipality && ` ・ ${r.municipality}`}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold leading-tight"
          style={{ color: "var(--color-text-primary)" }}>
          {title}
        </h1>
        {r.result_summary && (
          <p className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}>
            {r.result_summary}
          </p>
        )}
      </div>

      {/* タイムライン */}
      <div className="rounded-xl p-5"
        style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
        <p className="text-xs font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
          請求の経緯
        </p>
        <div className="space-y-0">
          {timeline.map((step, i) => (
            <div key={i} className="flex gap-4">
              {/* 縦線 + アイコン */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                  style={{
                    backgroundColor: step.done ? "#EFF6FF" : "var(--color-surface-container-low)",
                    opacity: step.done ? 1 : 0.4,
                  }}>
                  {step.icon}
                </div>
                {i < timeline.length - 1 && (
                  <div className="w-px flex-1 mt-1 mb-1"
                    style={{ backgroundColor: step.done ? "#BFDBFE" : "var(--color-border)", minHeight: 24 }} />
                )}
              </div>
              {/* テキスト */}
              <div className="pb-5 pt-1 min-w-0" style={{ opacity: step.done ? 1 : 0.45 }}>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(step.date).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
                {!step.done && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {i === 1 ? "編集部が審査中" : i === 2 ? "デジタル庁が30日以内に決定" : "開示後に公開予定"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 開示済: 記事リンク */}
      {r.status === "disclosed" && r.result_url && (
        <div className="rounded-xl p-5"
          style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}>
          <p className="text-sm font-bold mb-1" style={{ color: "var(--color-success)" }}>
            開示文書の分析記事
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--color-success-dark)" }}>
            開示された行政文書をもとにGCInsight編集部が分析した記事です。
          </p>
          <Link href={r.result_url}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-bold no-underline"
            style={{ backgroundColor: "var(--color-success)", color: "#ffffff" }}>
            分析記事を読む →
          </Link>
        </div>
      )}

      {/* 不開示: 理由と審査請求案内 */}
      {r.status === "rejected" && (
        <div className="rounded-xl p-5"
          style={{ backgroundColor: "#FFF5F5", border: "1px solid #FED7D7" }}>
          <p className="text-sm font-bold mb-1" style={{ color: "#DC2626" }}>
            ✕ 不開示の決定
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#9B1C1C" }}>
            デジタル庁より不開示の決定通知を受けました。
            行政不服審査法に基づき、内閣総理大臣に審査請求を行うことが可能です。
            GCInsight編集部で対応を検討します。
          </p>
          {r.result_url && (
            <Link href={r.result_url}
              className="inline-block mt-3 text-xs font-semibold hover:underline"
              style={{ color: "#DC2626" }}>
              詳細レポートを読む →
            </Link>
          )}
        </div>
      )}

      {/* 請求中 */}
      {r.status === "submitted" && (
        <div className="rounded-xl p-5"
          style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <p className="text-sm font-bold mb-1" style={{ color: "#2563EB" }}>
            ⏳ デジタル庁への回答を待っています
          </p>
          <p className="text-xs" style={{ color: "#1E40AF" }}>
            行政機関情報公開法により、原則30日以内に開示・不開示の決定が通知されます。
            結果が出次第このページを更新します。
          </p>
        </div>
      )}

      {/* 根拠情報 */}
      <div className="rounded-xl p-4 text-xs leading-relaxed"
        style={{ backgroundColor: "var(--color-surface-container-low)", color: "var(--color-text-muted)" }}>
        <p className="font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
          この請求について
        </p>
        <p>
          本件はGCInsight読者からのリクエストをもとに、GCInsight編集部が
          行政機関情報公開法（平成11年法律第42号）に基づきデジタル庁へ提出した
          行政文書開示請求です。請求手数料（300円）は編集部が負担しています。
        </p>
        <Link href="https://www.digital.go.jp/disclosure" target="_blank" rel="noopener noreferrer"
          className="inline-block mt-1 hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}>
          デジタル庁 情報公開ページ →
        </Link>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/disclosure/results" className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}>
          ← 結果一覧
        </Link>
        <Link href="/disclosure" className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}>
          リクエストを送る →
        </Link>
      </div>
    </div>
  );
}
