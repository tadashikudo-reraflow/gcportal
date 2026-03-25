import type { Metadata } from "next";
import Link from "next/link";
import RelatedArticles from "@/components/RelatedArticles";
import SourceAttribution from "@/components/SourceAttribution";
import { CLUSTERS } from "@/lib/clusters";
import { PAGE_SOURCES } from "@/lib/sources";
import { COST_CONSTANTS } from "@/lib/constants";

const awsOciComparison = [
  {
    factor: "RDB",
    ratio: "10-25%",
    aws: "比較前提を RDS for PostgreSQL に置くと、構成は分かりやすい一方、I/O や接続数、読み取り構成次第でコストが積み上がりやすい。",
    oci: "比較前提を Base Database Service Standard に置くと、構成は比較的シンプルに整理しやすい。DB費用を単純比較しやすいのが利点です。",
    trigger: "Oracleの高ライセンス負担、I/O増、クエリ未最適化、DBの役割が肥大化していると増えやすい。",
    action: "PostgreSQLマネージド移行、クエリ最適化、Read Replica、バッチ分離など低改修策から着手。",
  },
  {
    factor: "回線/Egress",
    ratio: "5-15%（隠れやすい）",
    aws: "データ転送やAZ/リージョンまたぎ、外部連携が増えると積み上がりやすい。設計時に見落としやすい費目です。",
    oci: "日本を含むAPACでアウトバウンド転送が月10TBまで無料という条件があり、通信費を抑えやすい。外部連携が多い構成では差が出やすい。",
    trigger: "外部連携が多い、データ出力が多い、未圧縮、リージョン配置が分散していると増えやすい。",
    action: "CDN導入、同一リージョン配置、圧縮、ライフサイクルポリシー、都道府県単位の回線共同利用。",
  },
  {
    factor: "コンピュート",
    ratio: "30-40%",
    aws: "インスタンスタイプが豊富で最適化余地が大きい反面、常時稼働の過剰スペックが残りやすい。割引を使わなくても Rightsizing の余地は大きい。",
    oci: "シンプルな料金体系でサイズ調整しやすく、Rightsizing の効果を出しやすい。OCPUベースで設計整理しやすい。",
    trigger: "常時稼働の過剰スペック、夜間停止なし、用途別分離不足がコスト増のきっかけ。",
    action: "Rightsizing、停止ルール、自動スケールの導入。",
  },
  {
    factor: "ストレージ",
    ratio: "15-25%",
    aws: "S3 の階層選択肢は多いが、Hotのまま長期保存すると効率が落ちやすい。運用ルール未整備だと積み上がる。",
    oci: "Object Storageでも階層管理は可能で、通信費と合わせて総額を下げやすい。長期保存の整理で効果を出しやすい。",
    trigger: "データ未整理、重複保存、Hot階層のまま長期保存すると増えやすい。",
    action: "Hot→Cool→Archiveの自動階層化、重複削除、保存期間ポリシーの導入。",
  },
];

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
  {
    title: "人口規模に対して要件が一律になりやすい",
    body: "人口規模や業務量が異なるにもかかわらず、機能要件・非機能要件が一律に近い形で適用されると、小規模自治体ほど過剰要件によるコスト増が起きやすくなります。",
  },
];

const recommendedMoves = [
  {
    title: "1. まずアーキテクチャを簡素化する",
    body: "FinOpsは利用料の可視化や最適化に有効ですが、それだけで高コスト構造全体を解消できるとは限りません。共同利用、SaaS化、運用自動化もあわせて検討する余地があります。",
  },
  {
    title: "2. 基盤選定ではインフラ費と通信費を分けて評価する",
    body: "当サイトの比較では、OCIはAWS、Azure、さくらと並べた場合にインフラコストで優位に見えるケースがあります。特に通信費は差が出やすく、OCIの月10TB無料枠のような条件は無視しにくい要素です。",
  },
  {
    title: "3. 共同調達・共同運用をコスト削減の本丸にする",
    body: "デジタル庁も都道府県と市区町村の共同利用・共同調達を対策に含めています。小規模団体ほど単独最適より共同化の効果が大きくなります。",
  },
  {
    title: "4. 人口規模に応じて要件を選べるよう見直す",
    body: "今後の制度・仕様見直しでは、全自治体一律ではなく、人口規模や業務量に応じて機能要件・非機能要件を選択できる余地を広げることが、過剰投資の抑制につながります。",
  },
  {
    title: "5. FinOpsは『最後に効かせる運用レイヤー』として使う",
    body: "構成が固まった後に、利用料の可視化、権限設計、停止ルール、ストレージ階層化を当てると効果が出やすいです。",
  },
];

const discussionPoints = [
  "インフラ費と通信費を切り分けて比較し、どこに削減余地があるかを示せているか",
  "都道府県単位で回線をとりまとめ、まず回線の共同利用から始める現実策を前面に出すか",
  "人口規模に応じて機能要件・非機能要件を選択できるようにする制度・仕様見直しを論点として入れるか",
  "FinOpsを主役ではなく、構造対策の後段に置く編集方針で良いか",
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
          <p className="mt-2 text-2xl font-extrabold" style={{ color: "#111827" }}>通信費を含めて比べる必要がある</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
            基盤費だけでなく、回線費やデータ転送費まで含めるとコスト差は大きくなります。特に外向き通信や閉域接続が増える構成では、通信費の設計が重要です。
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
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>インフラ費と通信費の見方</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          当サイトの既存比較では、クラウドの総合コスト指標は AWS=100、Azure=95、さくら=70、OCI=55 という整理です。
          この差はコンピュート単価だけでなく、通信費の扱いが効いています。Oracle公式のネットワーキング価格では、日本を含むAPACのアウトバウンド転送が月10TBまで無料と案内されています。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: "#fee2e2", backgroundColor: "#fff7f7" }}>
            <h3 className="text-sm font-bold" style={{ color: "#991b1b" }}>押さえるべき論点</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: "#4b5563" }}>
              <li>AWS、Azure、さくら、OCIを同じ前提で並べると、通信費の差が総額に効きやすい。</li>
              <li>閉域接続や外向き通信が多い構成では、IaaS単価より回線・転送の方がボトルネックになりやすい。</li>
              <li>そのため、コスト削減の論点は「どのクラウドが安いか」だけでなく「どの通信設計が安いか」「要件が過剰でないか」まで掘る必要があります。</li>
            </ul>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "#dbeafe", backgroundColor: "#f8fbff" }}>
            <h3 className="text-sm font-bold" style={{ color: "#1e3a8a" }}>このページでの立ち位置</h3>
            <p className="mt-3 text-sm leading-7" style={{ color: "#475569" }}>
              本ページでは、OCIを特定ベンダー推奨としてではなく、インフラ費と通信費を含む比較の中で、安価になりやすい選択肢として扱います。
              重要なのは、比較結果を示したうえで、自治体の共同利用や回線設計にどう落とし込むかです。
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#fafafa" }}>
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>関連コラム</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/articles/gc-cost-reality-2026" className="underline" style={{ color: "#1d4ed8" }}>
              コスト実態の解説
            </Link>
            <Link href="/articles/govcloud-delay-risk" className="underline" style={{ color: "#1d4ed8" }}>
              遅延リスクの解説
            </Link>
            <Link href="/articles/gc-standardization-law-guide" className="underline" style={{ color: "#1d4ed8" }}>
              標準化法の解説
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>AWS と OCI の実務比較</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          ここでは、実務上の主要比較対象として AWS と OCI を、RDB、回線/Egress、コンピュート、ストレージの4観点で並べます。
          DBは `RDS for PostgreSQL` と `Base Database Service Standard` を前提にし、割引は考慮しない比較にそろえています。特にコスト削減では、単価だけでなく「多くなるきっかけ」と「低改修で効く対策」を合わせて見ることが重要です。
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                {["要因", "コスト割合の目安", "AWS", "OCI", "多くなるきっかけ", "即効性の高い対策（低改修）"].map((label) => (
                  <th
                    key={label}
                    className="border-b px-3 py-3 text-left font-semibold whitespace-nowrap"
                    style={{ borderColor: "#e5e7eb", color: "#111827", backgroundColor: "#f9fafb" }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {awsOciComparison.map((row) => (
                <tr key={row.factor}>
                  <td className="border-b px-3 py-3 font-semibold align-top" style={{ borderColor: "#f1f5f9", color: "#111827" }}>{row.factor}</td>
                  <td className="border-b px-3 py-3 align-top" style={{ borderColor: "#f1f5f9", color: "#475569" }}>{row.ratio}</td>
                  <td className="border-b px-3 py-3 align-top" style={{ borderColor: "#f1f5f9", color: "#475569", minWidth: 220 }}>{row.aws}</td>
                  <td className="border-b px-3 py-3 align-top" style={{ borderColor: "#f1f5f9", color: "#475569", minWidth: 220 }}>{row.oci}</td>
                  <td className="border-b px-3 py-3 align-top" style={{ borderColor: "#f1f5f9", color: "#475569", minWidth: 220 }}>{row.trigger}</td>
                  <td className="border-b px-3 py-3 align-top" style={{ borderColor: "#f1f5f9", color: "#475569", minWidth: 220 }}>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "#dbeafe", backgroundColor: "#f8fbff" }}>
          <p className="text-sm font-semibold" style={{ color: "#1e3a8a" }}>読み方のポイント</p>
          <p className="mt-2 text-sm leading-7" style={{ color: "#475569" }}>
            AWS は選択肢が広く最適化余地も大きい一方、設計が複雑になると通信費や構成差分を見落としやすい傾向があります。
            OCI は通信費と料金体系の単純さが効きやすく、特に Egress や Oracle 系DBの見直しが論点になる環境では比較優位が出やすい、という整理です。
          </p>
          <p className="mt-2 text-sm leading-7" style={{ color: "#475569" }}>
            背景整理は
            <Link href="/articles/gc-cost-reality-2026" className="underline mx-1" style={{ color: "#1d4ed8" }}>
              コスト実態コラム
            </Link>
            も参照してください。
          </p>
        </div>

        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#fafafa" }}>
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>DB比較時の注意点</p>
          <ul className="mt-3 space-y-2 text-sm leading-6" style={{ color: "#475569" }}>
            <li>RDS for PostgreSQL は、DBインスタンス料金だけでなく、ストレージ種別やI/O特性によって総額が動きやすい。</li>
            <li>Base Database Service Standard は標準料金の見え方が比較的単純でも、冗長化や追加構成を入れると総額は増えるため、標準構成の範囲確認が必要です。</li>
            <li>DB比較は vCPU やメモリだけでなく、I/Oが多い運用か、バックアップが長いか、HA構成が前提かまで揃えないと逆転しうります。</li>
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold" style={{ color: "#111827" }}>特設ページの主張案</h2>
            <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
              ページの軸は「コスト管理」だけでなく「高コスト構造の分解」にも置くのが自然です。クラウド比較では、インフラ費と通信費の差を示しつつ、
              現実的な打ち手として都道府県単位の回線共同利用や共同調達を前に出し、加えて人口規模に応じて必要要件を選べる制度・仕様見直しを論点化する構成が適しています。
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
            「インフラ費と通信費をどう下げるか」「そのために共同利用をどう進めるか」「人口規模に応じて要件を選べるようにするか」を正面に出した方が、実務的で現実的です。
            そのうえで、クラウド比較ではOCIの低コスト性を示しつつ、都道府県単位の回線共同利用と、過剰要件を抑える制度・仕様見直しを並行して提起する論調が自然です。
          </p>
          <p className="mt-3 text-sm leading-7" style={{ color: "#7f1d1d" }}>
            詳細な背景は
            <Link href="/articles/gc-cost-reality-2026" className="underline mx-1" style={{ color: "#b91c1c" }}>
              コスト実態コラム
            </Link>
            と
            <Link href="/articles/govcloud-delay-risk" className="underline mx-1" style={{ color: "#b91c1c" }}>
              遅延リスクコラム
            </Link>
            も合わせて参照してください。
          </p>
        </div>
      </section>

      <SourceAttribution sourceIds={PAGE_SOURCES.costReduction} pageId="costReduction" />

      <RelatedArticles cluster={CLUSTERS.cost} />
    </div>
  );
}
