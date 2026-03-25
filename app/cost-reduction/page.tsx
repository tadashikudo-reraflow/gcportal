import type { Metadata } from "next";
import Link from "next/link";
import RelatedArticles from "@/components/RelatedArticles";
import ReportLeadCta from "@/components/ReportLeadCta";
import SourceAttribution from "@/components/SourceAttribution";
import { CLUSTERS } from "@/lib/clusters";
import { PAGE_SOURCES } from "@/lib/sources";
import { COST_CONSTANTS } from "@/lib/constants";

const awsOciComparison = [
  {
    factor: "データベース",
    ratio: "10-25%",
    aws: "EC2上でOracle Databaseのライセンス持ち込みを続ける形は、ライセンス負担が重くなりやすく、高額化しやすい構成です。",
    oci: "Oracle Databaseを採用する場合、オンプレミスより安価になりうる料金体系として比較しやすく、基盤費用の整理がしやすいのが利点です。",
    trigger: "IaaS上にライセンスを持ち込む形を続けると、ライセンス費用とI/O負荷の影響で総額が膨らみやすい。",
    action: "持ち込みライセンス前提は縮小し、マネージド型のデータベースサービスへ移行する。あわせて、コストメリットが出る基盤をベンダーと再選定する。",
  },
  {
    factor: "回線・転送料",
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
    "2025年6月のデジタル庁資料と先行事業データをもとに、移行済みの運用最適化と未移行の基盤見直しを整理。",
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
    body: "人口規模や業務量が異なるにもかかわらず、機能要件・非機能要件の見直し余地が限られると、小規模自治体ほど過剰要件によるコスト増が起きやすくなります。",
  },
];

const postMigrationActions = [
  {
    title: "インフラチームで進めやすいFinOps",
    body: "サイズ見直し、停止ルール、ストレージ階層化、タグ整備、利用状況の可視化は、アプリ改修なしで進めやすい。既存パッケージに手を入れず始めやすい施策が中心です。",
  },
  {
    title: "通信コストの削減",
    body: "同一リージョン配置、圧縮、CDN、回線共同利用などは比較的低改修で進めやすい。自治体横断で共通化しやすいテーマでもあります。",
  },
];

const remainingSystemActions = [
  {
    title: "ベンダーと基盤再選定を協議する",
    body: "全体の移行完了はまだで、特定移行団体も多く、実際の移行率も4割弱にとどまっています。これから移行する残存システムについては、ベンダー側にアプリケーション特性に合った、より安価な基盤を改めて選定してもらう余地があります。",
  },
  {
    title: "残存システムの並存期間を短くする",
    body: "標準化20業務だけが先に移行し、その他の既存システムが残るほど、二重のネットワークや連携経路が長く残ります。移行順序や対象範囲を見直し、並存期間を短くすること自体がコスト低減策になります。",
  },
];

const majorChangeActions = [
  "サーバレス化や全面的なマイクロサービス化は、アプリケーション設計や運用の抜本改修が前提になりやすい",
  "DBのサーバレス化やDBエンジン移行は、接続方式、性能特性、監視、テスト設計まで影響しやすく、工数が大きくなりやすい",
  "既存パッケージをFinOps前提の細かな自動制御に対応させるには、パッケージ改修やベンダー調整が必要になりやすい",
];

export default function CostReductionPage() {
  const increasePct = `+${COST_CONSTANTS.initialIncreaseRate}%`;
  const costPcts = awsOciComparison.map((row) => {
    const parts = row.ratio.split("-");
    return parseInt(parts[1] || parts[0] || "30") || 30;
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border px-6 py-7" style={{ borderColor: "#fecaca", backgroundColor: "#fff7ed" }}>
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
              2025年6月のデジタル庁資料は、運用経費増の要因を構造面まで含めて整理しています。
              一部自治体では当初見積より平均 {increasePct} の増加が課題化しており、利用料管理だけでなく基盤選定や共同化も含めた見直しが必要です。
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
        {/* Card 1 */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
          <div className="h-1" style={{ backgroundColor: "#6b7280" }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f3f4f6" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>公式資料の温度感</p>
            </div>
            <p className="text-xl font-extrabold leading-snug" style={{ color: "#111827" }}>即時の3割削減を約束する資料ではない</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
              2025年6月13日の総合対策は、中期的に3割削減に向けた環境整備を掲げています。足元では見積精査、共同化、競争促進が中心です。
            </p>
          </div>
        </div>
        {/* Card 2 */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#fecaca", backgroundColor: "#ffffff" }}>
          <div className="h-1" style={{ backgroundColor: "#dc2626" }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#fef2f2" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>いま起きている課題</p>
            </div>
            <p className="text-3xl font-extrabold" style={{ color: "#dc2626" }}>当初比 {increasePct}</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
              中核市市長会調査を踏まえた既存分析では、一部自治体で移行コストが当初比平均2.3倍相当とされています。この前提のまま残っているシステムを順次移行すると、全体のコスト負荷がさらに高まりやすい状況です。
            </p>
          </div>
        </div>
        {/* Card 3 */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#bfdbfe", backgroundColor: "#ffffff" }}>
          <div className="h-1" style={{ backgroundColor: "#2563eb" }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eff6ff" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>比較論点</p>
            </div>
            <p className="text-xl font-extrabold leading-snug" style={{ color: "#111827" }}>通信費を含めて比べる必要がある</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>
              基盤費だけでなく、回線費やデータ転送費まで含めるとコスト差は大きくなります。特に外向き通信や閉域接続が増える構成では、通信費の設計が重要です。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>このページの立ち位置</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          デジタル庁の方向性は継続的改善としての FinOps です。ただし、既存パッケージをその前提に合わせるには、
          監視、権限、停止制御、課金可視化などで相応の工数がかかります。
        </p>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          そのため本ページでは、移行済みは運用最適化、未移行は基盤再選定という二段構えで、
          自治体職員や事業者が今すぐ検討しやすい打ち手を優先して整理します。
        </p>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>現実的に今すぐ進めやすいこと</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          現場で着手しやすいのは、パッケージ本体を大きく変えずに進められる施策です。
          まずは「移行済みの最適化」と「未移行の見直し」を分けて考えるのが実務的です。
        </p>
        {/* 二分岐フロー図 */}
        <div className="mt-6">
          <div className="flex flex-col items-center">
            <div className="rounded-lg px-5 py-2.5 text-sm font-bold text-center" style={{ backgroundColor: "#fef9c3", color: "#854d0e", border: "1.5px solid #fde047" }}>
              平均2倍超のコスト増が課題化
            </div>
            <div className="flex flex-col items-center gap-0.5 my-1">
              <div className="w-px h-5" style={{ backgroundColor: "#d1d5db" }} />
              <svg width="12" height="8" viewBox="0 0 12 8"><path d="M1 1l5 6 5-6" stroke="#9ca3af" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
            </div>
            <p className="text-xs mb-2" style={{ color: "#9ca3af" }}>今すぐできること（二分法）</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#eff6ff", border: "1.5px solid #bfdbfe" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#1d4ed8" }}>✓ 移行済みシステム</p>
              <p className="text-base font-extrabold" style={{ color: "#1e3a8a" }}>運用最適化</p>
              <p className="text-xs mt-1.5 leading-5" style={{ color: "#3b82f6" }}>FinOps · Rightsizing<br />ストレージ階層化</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: "#f0fdf4", border: "1.5px solid #bbf7d0" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#15803d" }}>→ 未移行システム</p>
              <p className="text-base font-extrabold" style={{ color: "#14532d" }}>基盤再選定</p>
              <p className="text-xs mt-1.5 leading-5" style={{ color: "#16a34a" }}>ベンダー協議<br />要件・通信設計の見直し</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>移行後の運用最適化</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
          {postMigrationActions.map((item) => (
            <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: "#dbeafe", backgroundColor: "#f8fbff" }}>
              <h3 className="text-sm font-bold" style={{ color: "#1e3a8a" }}>{item.title}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "#475569" }}>{item.body}</p>
            </div>
          ))}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-bold" style={{ color: "#111827" }}>これから移行する残存システムのコスト低減</h3>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
          {remainingSystemActions.map((item) => (
            <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: "#dbeafe", backgroundColor: "#f8fbff" }}>
              <h3 className="text-sm font-bold" style={{ color: "#1e3a8a" }}>{item.title}</h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "#475569" }}>{item.body}</p>
            </div>
          ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "#fee2e2", backgroundColor: "#fff7f7" }}>
          <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>抜本改修が必要になりやすいテーマ</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 list-disc pl-5" style={{ color: "#7f1d1d" }}>
            {majorChangeActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6" style={{ color: "#7f1d1d" }}>
            特にDBのサーバレス化は、単なる設定変更ではなく性能検証や接続設計の見直しまで含むことが多く、短期のコスト削減策としては重い選択肢です。
          </p>
        </div>

        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#fafafa" }}>
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>このページの基本整理</p>
          <p className="mt-2 text-sm leading-7" style={{ color: "#475569" }}>
            平均で2倍超のコスト増が見えている以上、残りのシステムを同じ前提で移すのは危うい状況です。
            移行済みは運用最適化、未移行は移行前の基盤再選定という順で進めるのが現実的です。
          </p>
        </div>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>運用最適化だけでは解けない論点</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          デジタル庁資料では、FinOps は移行そのものの前提というより、移行後の運用経費を継続的に最適化するための手法として位置づけられています。
          一方で、足元のコスト増には、移行方式、見積構造、要件設定など、運用最適化だけでは解きにくい論点も含まれています。
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {structuralFactors.map((item, i) => {
            const icons = [
              // 二重コスト
              <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
              // 運用最適化不足
              <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 1v2M12 21v2M1 12h2M21 12h2"/></svg>,
              // 競争不足
              <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              // 一律要件
              <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
            ];
            const iconBgs = ["#fef9c3", "#eff6ff", "#f5f3ff", "#ecfdf5"];
            return (
              <div key={item.title} className="rounded-xl border p-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: iconBgs[i] }}>
                  {icons[i]}
                </div>
                <h3 className="text-sm font-bold" style={{ color: "#111827" }}>{item.title}</h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "#4b5563" }}>{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border p-6" style={{ borderColor: "#e5e7eb", backgroundColor: "#ffffff" }}>
        <h2 className="text-xl font-bold" style={{ color: "#111827" }}>インフラ費と通信費の見方</h2>
        <p className="mt-2 text-sm leading-7" style={{ color: "#4b5563" }}>
          当サイトの既存比較では、クラウドの総合コスト指標は AWS=100、Azure=95、さくら=70、OCI=55 です。
          差が出るのは単価だけではなく通信費で、従来は庁内や近隣のデータセンターで完結していた処理が東京側へ集約されるほど、回線費や転送費が目立ちやすくなります。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: "#fee2e2", backgroundColor: "#fff7f7" }}>
            <h3 className="text-sm font-bold" style={{ color: "#991b1b" }}>押さえるべき論点</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 list-disc pl-5" style={{ color: "#4b5563" }}>
              <li>AWS、Azure、さくら、OCIを同じ前提で並べると、通信費の差が総額に効きやすい。</li>
              <li>特に、庁内や近隣データセンターから東京集約の構成へ変わると、閉域接続や外向き通信のコストが増えやすい。</li>
              <li>標準化20業務だけが先にガバメントクラウドへ移行し、それ以外は既存システムのまま残る間は、二重のネットワークや連携経路が残りやすい。</li>
              <li>そのため、コスト削減の論点は「どのクラウドが安いか」だけでなく「どの通信設計が安いか」「既存システムとの並存期間をどう短くするか」まで掘る必要があります。</li>
            </ul>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: "#dbeafe", backgroundColor: "#f8fbff" }}>
            <h3 className="text-sm font-bold" style={{ color: "#1e3a8a" }}>このページでの立ち位置</h3>
          <p className="mt-3 text-sm leading-7" style={{ color: "#475569" }}>
            本ページでは、特定ベンダー推奨ではなく、インフラ費と通信費を含めて比較したときにどこへ差が出るかを見ます。
            重要なのは、その差を共同利用や回線設計の見直しにどうつなげるかです。
          </p>
          <p className="mt-2 text-sm leading-7" style={{ color: "#475569" }}>
            デジタル庁資料でも、都道府県と市区町村の連携体制の下で、ガバクラ接続回線や運用管理補助者等の共同利用・共同調達を進める方向が示されています。
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
          ここでは AWS と OCI を、データベース、回線・転送料、コンピュート、ストレージの4観点で並べます。
          データベースは `RDS for PostgreSQL` と `Base Database Service Standard` を前提にし、割引は考慮していません。
        </p>

        {/* モバイル: カード表示 */}
        <div className="mt-5 md:hidden space-y-4">
          {awsOciComparison.map((row, i) => (
            <div key={row.factor} className="rounded-xl border p-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm" style={{ color: "#111827" }}>{row.factor}</span>
                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>{row.ratio}</span>
              </div>
              {/* コスト割合バー */}
              <div className="mb-3">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
                  <div className="h-full rounded-full" style={{ width: `${costPcts[i]}%`, backgroundColor: "#3b82f6" }} />
                </div>
                <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>コスト全体に占める割合目安: {row.ratio}</p>
              </div>
              <div className="space-y-2.5 text-sm leading-6">
                <div><span className="font-semibold" style={{ color: "#6b7280" }}>AWS: </span><span style={{ color: "#475569" }}>{row.aws}</span></div>
                <div><span className="font-semibold" style={{ color: "#6b7280" }}>OCI: </span><span style={{ color: "#475569" }}>{row.oci}</span></div>
                <div className="pt-1 border-t" style={{ borderColor: "#e5e7eb" }}>
                  <span className="font-semibold" style={{ color: "#b45309" }}>きっかけ: </span><span style={{ color: "#78350f" }}>{row.trigger}</span>
                </div>
                <div><span className="font-semibold" style={{ color: "#1d4ed8" }}>対策: </span><span style={{ color: "#1e3a8a" }}>{row.action}</span></div>
              </div>
            </div>
          ))}
        </div>

        {/* デスクトップ: テーブル表示 */}
        <div className="mt-5 hidden md:block overflow-x-auto">
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
            AWS は選択肢が広い一方で設計が複雑になりやすく、OCI は通信費と料金体系の差が出やすい、という整理です。
            背景は
            <Link href="/articles/gc-cost-reality-2026" className="underline mx-1" style={{ color: "#1d4ed8" }}>
              コスト実態コラム
            </Link>
            も参照してください。
          </p>
        </div>

        <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "#e5e7eb", backgroundColor: "#fafafa" }}>
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>データベース比較時の注意点</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 list-disc pl-5" style={{ color: "#475569" }}>
            <li>RDS for PostgreSQL は、DBインスタンス料金だけでなく、ストレージ種別やI/O性能の考え方で総額が動きやすい。</li>
            <li>大きなインスタンスになるほど、標準でどこまでI/O性能が含まれるかの差が効きやすい。</li>
            <li>OCIの Base Database Service Standard は、標準I/O性能の範囲内であれば追加料金が発生しにくく、I/O負荷が高い構成ではコスト差が大きくなりやすい。</li>
          </ul>
        </div>
      </section>
      <section>
        <div className="rounded-2xl border p-6" style={{ borderColor: "#fecaca", backgroundColor: "#fff7f7" }}>
          <h2 className="text-xl font-bold" style={{ color: "#991b1b" }}>現時点の結論</h2>
          <p className="mt-3 text-sm leading-7" style={{ color: "#7f1d1d" }}>
            「FinOpsで30%削減」をメインコピーにするより、
            「平均2倍超のコスト前提をこのまま残存システムへ広げないために、何を先に見直すか」を正面に出した方が、実務的で現実的です。
            そのうえで、移行済みシステムは運用最適化、未移行システムはベンダーとの基盤再選定、という二段構えで示す論調が自然です。
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

      <ReportLeadCta
        source="cost_reduction"
        title="コスト削減の論点をPDFで社内共有しやすく整理"
        description="この特設ページの論点に加えて、全国の進捗、コスト、遅延構造をまとめた無料レポートです。自治体内の説明や事業者との協議材料づくりに使えます。"
      />

      <SourceAttribution sourceIds={PAGE_SOURCES.costReduction} pageId="costReduction" />

      <RelatedArticles cluster={CLUSTERS.cost} />
    </div>
  );
}
