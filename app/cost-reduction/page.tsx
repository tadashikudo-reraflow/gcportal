import type { Metadata } from "next";
import Link from "next/link";
import RelatedArticles from "@/components/RelatedArticles";
import SourceAttribution from "@/components/SourceAttribution";
import { CLUSTERS } from "@/lib/clusters";
import { PAGE_SOURCES } from "@/lib/sources";
import { COST_CONSTANTS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ガバメントクラウド コスト削減特設 | GC Insight",
  description:
    "デジタル庁の2025年6月資料と先行事業データをもとに、FinOps、共同調達、SaaS化、基盤選定を含むコスト削減論点を整理。",
  alternates: { canonical: "/cost-reduction" },
};

const structuralFactors = [
  {
    title: "二重コストが残る",
    body: "接続回線費や運用管理補助委託費が新たに発生し、移行途中は旧基盤と新基盤の二重負担も残りやすい。",
  },
  {
    title: "ガバクラ向けに運用が最適化されていない",
    body: "クラウド前提の監視・自動化・権限設計が不足すると、人的運用と見積バッファーが膨らみやすい。",
  },
  {
    title: "競争不足と見積の不透明さ",
    body: "期限優先で現行ベンダー依存が残ると、比較不能な見積や安全率の上乗せが起こりやすい。",
  },
];

const recommendedMoves = [
  {
    title: "1. まずアーキテクチャを簡素化する",
    body: "FinOpsは利用料の可視化や最適化に有効ですが、それだけで高コスト構造全体を解消できるとは限りません。共同利用、SaaS化、運用自動化もあわせて検討する余地があります。",
  },
  {
    title: "2. Oracle DB中心なら OCI も有力な選択肢になる",
    body: "円建て課金、料金体系、Oracle DBとの親和性は検討材料になります。Oracle前提ワークロードでは、設計や運用の複雑さを抑えられる可能性がありますが、他クラウドや共同化案との比較が前提です。",
  },
  {
    title: "3. 共同調達・共同運用をコスト削減の本丸にする",
    body: "デジタル庁も都道府県と市区町村の共同利用・共同調達を対策に含めています。小規模団体ほど単独最適より共同化の効果が大きくなります。",
  },
  {
    title: "4. FinOpsは『最後に効かせる運用レイヤー』として使う",
    body: "構成が固まった後に、利用料の可視化、権限設計、停止ルール、予約・割引、ストレージ階層化を当てると効果が出やすいです。",
  },
];

const discussionPoints = [
  "OCIを有力な選択肢として扱う対象を『Oracle DB依存が強い業務』に絞るか、より広く比較対象に含めるか",
  "共同利用・共同調達を前提にしたコストモデルをページ上でどこまで前面に出すか",
  "FinOpsを主役ではなく補助線として扱う編集方針で良いか",
];

export default function CostReductionPage() {
  const increasePct = `+${COST_CONSTANTS.initialIncreaseRate}%`;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border px-6 py-7" style={{ borderColor: "#fecaca", background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 55%, #f0fdf4 100%)" }}>
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: "#fee2e2", color: "#b91c1c" }}>
            コスト削減特設
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#111827" }}>
              FinOpsだけで十分か。
              <br />
              構造見直しを含むコスト削減論点を整理
            </h1>
            <p className="text-sm leading-7" style={{ color: "#374151" }}>
              デジタル庁の2025年6月13日資料では、移行後の運用経費増加要因を「構造的な要因」「機能強化要因」「外部要因」に整理しています。
              中核市市長会調査を踏まえた既存分析では、一部自治体で当初見積より平均 {increasePct} の増加が課題化しており、
              利用料管理だけでなく、基盤選定・共同化・SaaS化を含めた見直し論点が議論されています。
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/cloud"
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: "#111827", color: "#ffffff", textDecoration: "none" }}
            >
              基盤比較を見る
            </Link>
            <Link
              href="/costs"
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: "#ffffff", color: "#b91c1c", border: "1px solid #fca5a5", textDecoration: "none" }}
            >
              ベンダー別コスト分析へ
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-5" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
          <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>公式資料の温度感</p>
          <p className="mt-2 text-2xl font-extrabold" style={{ color: "#111827" }}>即時の3割削減を約束する資料ではない</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
            2025年6月13日の総合対策は、中期的に3割削減に向けた環境整備を掲げています。足元では見積精査、共同化、競争促進が中心です。
          </p>
        </div>
        <div className="rounded-xl border p-5" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
          <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>いま起きている課題</p>
          <p className="mt-2 text-2xl font-extrabold" style={{ color: "#111827" }}>当初比 {increasePct}</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
            中核市市長会調査を踏まえた既存分析では、一部自治体で移行コストが当初比平均2.3倍相当とされています。局所的な最適化だけでは吸収しにくいケースがあります。
          </p>
        </div>
        <div className="rounded-xl border p-5" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
          <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>比較論点</p>
          <p className="mt-2 text-2xl font-extrabold" style={{ color: "#111827" }}>OCIも有力な選択肢の一つ</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
            Oracle DB中心の業務では、OCIが比較上有利になる可能性があります。ただし、ベンダー対応状況、共同化余地、既存運用との整合を含めた比較が前提です。
          </p>
        </div>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>なぜFinOpsだけでは足りないのか</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          2025年6月のデジタル庁資料でも、問題の中心はクラウド利用料単体ではなく、移行構造そのものにあると読めます。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {structuralFactors.map((item) => (
            <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
              <h3 className="text-sm font-bold" style={{ color: "#111827" }}>{item.title}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold" style={{ color: "#111827" }}>特設ページの主張案</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
              ページの軸は「コスト管理」だけでなく「高コスト構造の分解」にも置くのが自然です。特にOracle DB系のワークロードでは、
              OCIを単なる価格比較だけでなく、設計や運用負荷の観点から比較対象に含める余地があります。
            </p>
          </div>
          <a
            href="https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c58162cb-92e5-4a43-9ad5-095b7c45100c/9b626d3b/20250613_policies_local_governments_doc_01.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", textDecoration: "none" }}
          >
            2025-06-13 公式PDF
          </a>
        </div>

        <div className="mt-5 space-y-3">
          {recommendedMoves.map((item) => (
            <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: "#dbeafe", backgroundColor: "#f8fbff" }}>
              <h3 className="text-sm font-bold" style={{ color: "#1e3a8a" }}>{item.title}</h3>
              <p className="mt-1.5 text-sm leading-6" style={{ color: "#475569" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
          <h2 className="text-xl font-bold" style={{ color: "#111827" }}>ページで明確に出したい論点</h2>
          <ul className="mt-4 space-y-3">
            {discussionPoints.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm leading-6" style={{ color: "#374151" }}>
                <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#dc2626", flexShrink: 0 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border p-6" style={{ borderColor: "#fecaca", backgroundColor: "#fff7f7" }}>
          <h2 className="text-xl font-bold" style={{ color: "#991b1b" }}>現時点の結論</h2>
          <p className="mt-3 text-sm leading-7" style={{ color: "#7f1d1d" }}>
            「FinOpsで30%削減」をメインコピーにするより、
            「コスト増加の背景をどう構造的に見直すか」を正面に出した方が、中立的で説明しやすい構成です。
            そのうえで Oracle DB 前提領域では、OCIを含む複数案を比較対象として扱う編集方針が妥当です。
          </p>
        </div>
      </section>

      <SourceAttribution sourceIds={PAGE_SOURCES.costReduction} pageId="costReduction" />

      <RelatedArticles cluster={CLUSTERS.cost} />
    </div>
  );
}
