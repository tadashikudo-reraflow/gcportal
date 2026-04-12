import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Breadcrumb from "@/components/Breadcrumb";
import DisclosureTabs from "@/components/DisclosureTabs";

export const metadata: Metadata = {
  title: "開示請求 結果一覧｜GCInsight",
  description:
    "GCInsight編集部がデジタル庁へ提出した情報公開請求の結果一覧。開示・不開示の決定内容と関連分析記事。",
  alternates: { canonical: "/disclosure/results" },
};

export const revalidate = 3600; // 1時間キャッシュ

type DisclosureResult = {
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
  submitted: { label: "請求中",   color: "#2563EB", bg: "#DBEAFE" },
  disclosed: { label: "開示済",   color: "var(--color-success)", bg: "var(--color-success-bg)" },
  rejected:  { label: "不開示",   color: "#DC2626", bg: "#FEE2E2" },
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

async function getResults(): Promise<DisclosureResult[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("disclosure_requests")
    .select("id, topic, category, municipality, status, submitted_at, disclosed_at, result_title, result_summary, result_url, created_at")
    .in("status", ["submitted", "disclosed", "rejected"])
    .order("submitted_at", { ascending: false, nullsFirst: false });
  return (data ?? []) as DisclosureResult[];
}

export default async function DisclosureResultsPage() {
  const results = await getResults();
  const disclosed = results.filter((r) => r.status === "disclosed");
  const inProgress = results.filter((r) => r.status === "submitted");
  const rejected   = results.filter((r) => r.status === "rejected");

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "開示請求" }]} />

      {/* タブ */}
      <DisclosureTabs active="results" />

      {/* ヘッダー */}
      <div>
        <h1 className="page-title">開示結果一覧</h1>
        <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
          GCInsight編集部がデジタル庁に提出した情報公開請求の結果です。
          開示された文書をもとにした分析記事もあわせてご覧ください。
        </p>
      </div>

      {/* KPIバー */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "請求中",  value: inProgress.length, color: "#2563EB" },
          { label: "開示済",  value: disclosed.length,  color: "var(--color-success)" },
          { label: "不開示",  value: rejected.length,   color: "#DC2626" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
            <p className="text-2xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl p-10 text-center"
          style={{ backgroundColor: "var(--color-card)", border: "1px dashed var(--color-border-strong)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            現在、編集部が請求内容を審査中です。<br />
            最初の開示結果をお楽しみに。
          </p>
          <Link href="/disclosure" className="inline-block mt-4 text-sm font-semibold hover:underline"
            style={{ color: "var(--color-brand-secondary)" }}>
            リクエストを送る →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 開示済 */}
          {disclosed.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  開示済
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "var(--color-success-bg)", color: "var(--color-success)" }}>
                  {disclosed.length}件
                </span>
              </div>
              {disclosed.map((r) => (
                <ResultCard key={r.id} r={r} />
              ))}
            </section>
          )}

          {/* 請求中 */}
          {inProgress.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  請求中
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#DBEAFE", color: "#2563EB" }}>
                  {inProgress.length}件
                </span>
              </div>
              {inProgress.map((r) => (
                <ResultCard key={r.id} r={r} />
              ))}
            </section>
          )}

          {/* 不開示 */}
          {rejected.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  不開示
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                  {rejected.length}件
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                不開示の決定自体も重要な情報です。経緯と理由を記事で報告します。
              </p>
              {rejected.map((r) => (
                <ResultCard key={r.id} r={r} />
              ))}
            </section>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--color-brand-primary)" }}>
            知りたい情報がありますか？
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
            編集部が代わりにデジタル庁へ開示請求します
          </p>
        </div>
        <Link href="/disclosure"
          className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold no-underline"
          style={{ backgroundColor: "var(--color-brand-primary)", color: "#ffffff" }}>
          リクエストを送る
        </Link>
      </div>
    </div>
  );
}

function ResultCard({ r }: { r: DisclosureResult }) {
  const sc = STATUS_CONFIG[r.status];
  const title = r.result_title ?? r.topic;

  const content = (
    <div className="rounded-xl p-4 sm:p-5 transition-shadow"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        ...(r.result_url ? { cursor: "pointer" } : {}),
      }}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded mt-0.5"
          style={{ backgroundColor: sc.bg, color: sc.color }}>
          {sc.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug" style={{ color: "var(--color-text-primary)" }}>
            {title}
          </p>
          {r.result_summary && (
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {r.result_summary}
            </p>
          )}

          {/* タイムライン */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              カテゴリ: {CATEGORY_LABELS[r.category] ?? r.category}
              {r.municipality && ` ・ ${r.municipality}`}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {r.submitted_at && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                📨 提出: {new Date(r.submitted_at).toLocaleDateString("ja-JP")}
              </span>
            )}
            {r.disclosed_at && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                📋 決定: {new Date(r.disclosed_at).toLocaleDateString("ja-JP")}
              </span>
            )}
          </div>

          {r.result_url && (
            <p className="text-xs mt-2 font-semibold" style={{ color: "var(--color-brand-secondary)" }}>
              分析記事を読む →
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (r.result_url) {
    return (
      <Link href={r.result_url} className="block no-underline hover:shadow-md transition-shadow rounded-xl">
        {content}
      </Link>
    );
  }
  return content;
}
