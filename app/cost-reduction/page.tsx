import type { Metadata } from "next";
import Link from "next/link";
import ReportLeadCta from "@/components/ReportLeadCta";
import SourceAttribution from "@/components/SourceAttribution";
import { COST_CONSTANTS } from "@/lib/constants";
import { PAGE_SOURCES } from "@/lib/sources";

const detailLinks = [
  {
    href: "/costs",
    title: "ベンダー別コスト分析",
    body: "自治体ごとの採用状況とコスト増の傾向を確認できます。",
  },
  {
    href: "/cloud",
    title: "クラウド基盤比較",
    body: "基盤費と通信費の観点から、主要クラウドの差を整理しています。",
  },
  {
    href: "/articles/gc-cost-reality-2026",
    title: "コスト実態コラム",
    body: "平均2倍超とされる背景を、一次資料ベースで短く整理しています。",
  },
  {
    href: "/articles/govcloud-delay-risk",
    title: "遅延リスクコラム",
    body: "移行遅延とコスト負担がどう結びつくかを確認できます。",
  },
];

export const metadata: Metadata = {
  title: "ガバメントクラウド コスト削減特設 | GC Insight",
  description:
    "移行済みの運用最適化と、未移行システムの基盤再選定という二段構えで、現実的なコスト削減策を整理。",
  alternates: { canonical: "/cost-reduction" },
};

export default function CostReductionPage() {
  const increasePct = `+${COST_CONSTANTS.initialIncreaseRate}%`;
  const averageIncrease = `${(1 + COST_CONSTANTS.initialIncreaseRate / 100).toFixed(1)}倍相当`;

  return (
    <div className="space-y-8">
      <section
        className="rounded-2xl border px-6 py-7"
        style={{ borderColor: "#fecaca", backgroundColor: "#fff7ed" }}
      >
        <div className="max-w-4xl space-y-4">
          <div
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
            style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}
          >
            コスト削減特設
          </div>

          <div className="space-y-2">
            <h1
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: "#111827" }}
            >
              残りのシステムを
              <br />
              同じ思想で移す前に
            </h1>
            <p className="text-sm leading-7" style={{ color: "#374151" }}>
              移行コストが平均 {averageIncrease} まで膨張した事例を踏まえ、
              移行済み→運用最適化、未移行→基盤再選定の順で打ち手を整理します。
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/report?from=cost_reduction_hero"
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "#111827",
                color: "#ffffff",
                textDecoration: "none",
              }}
            >
              無料でPDFを受け取る
            </Link>
            <Link
              href="/costs"
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "#ffffff",
                color: "#b91c1c",
                border: "1px solid #fca5a5",
                textDecoration: "none",
              }}
            >
              コスト分析を見る
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "#fecaca", backgroundColor: "#ffffff" }}
        >
          <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>
            見えている課題
          </p>
          <p className="mt-2 text-3xl font-extrabold" style={{ color: "#dc2626" }}>
            {increasePct}
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
            平均 {averageIncrease}
            の前提が見えている以上、残存システムまで同じ考え方で移すと全体負担が積み上がりやすくなります。
          </p>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "#bfdbfe", backgroundColor: "#ffffff" }}
        >
          <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>
            移行済みシステム
          </p>
          <p className="mt-2 text-xl font-extrabold" style={{ color: "#1e3a8a" }}>
            運用最適化
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
            サイズ見直し、停止ルール、ストレージ階層化など、アプリ本体を大きく変えずに進めやすい施策です。
          </p>
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ borderColor: "#bbf7d0", backgroundColor: "#ffffff" }}
        >
          <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>
            未移行システム
          </p>
          <p className="mt-2 text-xl font-extrabold" style={{ color: "#14532d" }}>
            基盤再選定
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
            ベンダーと基盤、回線、要件の前提を見直し、同じ思想のまま移行を広げないことが重要です。
          </p>
        </div>
      </section>

      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
      >
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
          なぜ見直しが必要か
        </h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          FinOpsだけでは不十分な理由——回線費・二重負担・競争不足が重なると運用最適化では追いつきません。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            "FinOpsは移行後の運用最適化には効くが、移行前提そのものは変えない",
            "通信費や回線費は、庁内完結から東京集約へ変わるほど効きやすい",
            "競争不足や一律要件が残ると、残存システムでも高コストが再生産されやすい",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border p-4"
              style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
            >
              <p className="text-sm leading-6" style={{ color: "#374151" }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
      >
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
          今すぐやること
        </h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          移行済み→運用最適化、未移行→基盤再選定。アプリに大きく手を入れない打ち手を優先します。
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}
          >
            <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>
              移行済みシステム
            </p>
            <h3 className="mt-2 text-lg font-bold" style={{ color: "#1e3a8a" }}>
              運用最適化を先に進める
            </h3>
            <ul
              className="mt-3 space-y-2 list-disc pl-5 text-sm leading-6"
              style={{ color: "#475569" }}
            >
              <li>サイズ見直し、停止ルール、タグ整備</li>
              <li>ストレージ階層化や保存期間ポリシー</li>
              <li>通信経路の整理と転送量の見える化</li>
            </ul>
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "#bbf7d0", backgroundColor: "#f0fdf4" }}
          >
            <p className="text-xs font-semibold" style={{ color: "#15803d" }}>
              未移行システム
            </p>
            <h3 className="mt-2 text-lg font-bold" style={{ color: "#14532d" }}>
              移行前に基盤を見直す
            </h3>
            <ul
              className="mt-3 space-y-2 list-disc pl-5 text-sm leading-6"
              style={{ color: "#475569" }}
            >
              <li>ベンダーと基盤再選定を協議する</li>
              <li>回線設計と外部連携の前提を見直す</li>
              <li>人口規模に応じて要件が過剰でないか確認する</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "回線は共同利用から始める",
              body: "都道府県単位で回線をとりまとめると、通信費と運用負担の両方に効きやすくなります。",
            },
            {
              title: "基盤選定は単価だけで見ない",
              body: "基盤費だけでなく、回線費、転送費、既存システムとの並存期間まで含めて比較する必要があります。",
            },
            {
              title: "抜本改修は後段で扱う",
              body: "サーバレス化や大規模なデータベース刷新は工数が重く、短期の削減策としては優先度を下げるのが現実的です。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border p-4"
              style={{ borderColor: "#e5e7eb", backgroundColor: "#fafafa" }}
            >
              <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "#475569" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ReportLeadCta
        source="cost_reduction"
        title="コスト削減の論点をPDFでまとめて共有"
        description="全国の進捗、コスト、遅延構造を1本に整理した無料レポートです。庁内説明や事業者との協議材料づくりに使えます。"
      />

      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}
      >
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>
          詳しく見る
        </h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          詳細な比較や背景は、個別ページとコラムへ分けています。必要な論点だけを深掘りしてください。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {detailLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border p-4 transition-colors hover:bg-slate-50"
              style={{
                borderColor: "#e5e7eb",
                backgroundColor: "#ffffff",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              <h3 className="text-sm font-bold" style={{ color: "#111827" }}>
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "#475569" }}>
                {item.body}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <SourceAttribution sourceIds={PAGE_SOURCES.costReduction} pageId="costReduction" />
    </div>
  );
}
