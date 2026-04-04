import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Breadcrumb from "@/components/Breadcrumb";
import DisclosureRequestForm from "@/components/DisclosureRequestForm";

export const metadata: Metadata = {
  title: "開示請求依頼｜GCInsight",
  description:
    "デジタル庁への情報公開（開示）請求をGCInsight編集部が代理提出し、結果をサイトで公開するプロジェクト。知りたい情報をリクエストできます。",
  alternates: { canonical: "/disclosure" },
};

export const revalidate = 3600;

type RecentResult = {
  id: string;
  topic: string;
  result_title: string | null;
  status: string;
  submitted_at: string | null;
  disclosed_at: string | null;
  result_url: string | null;
};

async function getRecentResults(): Promise<RecentResult[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("disclosure_requests")
    .select("id, topic, result_title, status, submitted_at, disclosed_at, result_url")
    .in("status", ["submitted", "disclosed", "rejected"])
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(5);
  return (data ?? []) as RecentResult[];
}

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "📝",
    title: "リクエストを送る",
    desc: "「こんな情報が欲しい」をフォームで送信。カテゴリ・背景・希望する文書の種類を教えてください。",
  },
  {
    step: "02",
    icon: "🔍",
    title: "編集部が審査",
    desc: "GCInsight編集部が内容を確認。公開価値があると判断した場合、デジタル庁へ行政文書開示請求書を提出します（300円/件）。",
  },
  {
    step: "03",
    icon: "⏳",
    title: "30日以内に決定",
    desc: "行政機関情報公開法に基づき、デジタル庁は原則30日以内に開示・不開示を決定し通知。",
  },
  {
    step: "04",
    icon: "📢",
    title: "GCInsightで公開",
    desc: "開示された文書はGCInsightでコラム・分析記事として公開。希望者にはメールで通知します。",
  },
];

const STATUS_LABELS: Record<string, string> = {
  submitted: "請求中",
  disclosed: "開示済",
  rejected:  "不開示",
};
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  submitted: { color: "#2563EB", bg: "#DBEAFE" },
  disclosed: { color: "#059669", bg: "#D1FAE5" },
  rejected:  { color: "#DC2626", bg: "#FEE2E2" },
};

export default async function DisclosurePage() {
  const recentResults = await getRecentResults();
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "開示請求依頼" }]} />

      {/* ヒーロー */}
      <div
        className="rounded-2xl px-6 py-8 sm:px-10 sm:py-10"
        style={{
          background: "linear-gradient(135deg, #00338D 0%, #00205F 100%)",
          color: "#FFFFFF",
        }}
      >
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">
            Information Disclosure
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3">
            開示請求依頼
          </h1>
          <p className="text-sm sm:text-base opacity-85 leading-relaxed">
            デジタル庁への行政文書開示請求をGCInsight編集部が代理で提出し、
            結果をサイトで公開するプロジェクトです。
            <br />
            「ガバメントクラウド関連でこんな情報が知りたい」を下のフォームで送ってください。
          </p>
        </div>
      </div>

      {/* 仕組み */}
      <div className="space-y-3">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          仕組み
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="rounded-xl p-4"
              style={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: "#EFF6FF",
                    color: "var(--color-brand-primary)",
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
                    {item.icon} {item.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* フォーム + サイドバー */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DisclosureRequestForm />
        </div>

        {/* 補足情報 */}
        <div className="space-y-4">
          {/* 根拠法 */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-xs font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              ⚖️ 根拠法
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              行政機関の保有する情報の公開に関する法律（情報公開法）に基づき、
              誰でもデジタル庁に行政文書の開示を請求できます。
            </p>
          </div>

          {/* 費用 */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-xs font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              💴 費用について
            </p>
            <div className="space-y-1.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <p>・請求手数料: 1件 300円（収入印紙）</p>
              <p>・開示実施手数料: 300円まで無料</p>
              <p className="pt-1" style={{ color: "var(--color-text-muted)" }}>
                ※ 費用はGCInsight編集部が負担します。リクエスト者の費用負担はありません。
              </p>
            </div>
          </div>

          {/* デジタル庁窓口 */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <p
              className="text-xs font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              🏢 デジタル庁 情報公開窓口
            </p>
            <div className="space-y-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
              <p>東京都千代田区紀尾井町1-3</p>
              <p>東京ガーデンテラス紀尾井町</p>
              <p>📞 03-4477-6775</p>
              <p>受付: 平日 9:30〜17:00</p>
            </div>
            <Link
              href="https://www.digital.go.jp/disclosure"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs hover:underline"
              style={{ color: "var(--color-brand-secondary)" }}
            >
              デジタル庁 情報公開ページ →
            </Link>
          </div>
        </div>
      </div>

      {/* 開示請求の結果 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
            開示請求の結果
          </h2>
          <Link href="/disclosure/results" className="text-xs font-semibold hover:underline"
            style={{ color: "var(--color-brand-secondary)" }}>
            すべて見る →
          </Link>
        </div>
        {recentResults.length === 0 ? (
          <div className="rounded-xl p-6 text-center"
            style={{ backgroundColor: "var(--color-card)", border: "1px dashed var(--color-border-strong)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              現在準備中です。最初のリクエストをお待ちしています。
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentResults.map((r) => {
              const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.submitted;
              const title = r.result_title ?? r.topic;
              const href = `/disclosure/results/${r.id}`;
              return (
                <Link key={r.id} href={href}
                  className="flex items-center justify-between rounded-xl p-4 no-underline hover:shadow-md transition-shadow"
                  style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded mt-0.5"
                      style={{ backgroundColor: sc.bg, color: sc.color }}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {title}
                      </p>
                      {r.submitted_at && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          提出: {new Date(r.submitted_at).toLocaleDateString("ja-JP")}
                          {r.disclosed_at && ` → 決定: ${new Date(r.disclosed_at).toLocaleDateString("ja-JP")}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0 ml-4"
                    style={{ color: "var(--color-brand-secondary)" }}>
                    詳細 →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 注意事項 */}
      <div
        className="rounded-xl p-4 text-xs leading-relaxed"
        style={{
          backgroundColor: "var(--color-surface-container-low)",
          color: "var(--color-text-muted)",
        }}
      >
        <p className="font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
          注意事項
        </p>
        <ul className="space-y-1 list-disc list-inside">
          <li>全てのリクエストへの開示請求提出を保証するものではありません。編集部が内容・優先度を判断します。</li>
          <li>開示・不開示の決定はデジタル庁が行います。不開示の場合もGCInsightでその旨を報告します。</li>
          <li>入力情報（メールアドレス等）は開示請求業務および結果通知にのみ使用します。</li>
          <li>本サービスは行政書士法に基づく有償代理業務ではありません（GCInsight編集部による自主活動）。</li>
        </ul>
      </div>
    </div>
  );
}
