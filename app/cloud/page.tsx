import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "クラウド基盤分析 | 自治体標準化ダッシュボード",
};

// ガバクラ インフラシェア実績（デジタル庁 先行事業調査 令和6年9月／2024年10月時点）
const INFRA_SHARE = [
  { cloud: "AWS",          systems: 1452, color: "#FF9900" },
  { cloud: "Azure",        systems:   30, color: "#0078D4" },
  { cloud: "Google Cloud", systems:   10, color: "#4285F4" },
  { cloud: "OCI",          systems:    4, color: "#F80000" },
  { cloud: "さくら",       systems:    1, color: "#E2004B" },
];
const INFRA_TOTAL = INFRA_SHARE.reduce((s, v) => s + v.systems, 0); // 1,497

// クラウド別コスト比較（ガバクラ典型ワークロード基準）
// 出典: Oracle vs AWS TCO比較ホワイトペーパー・デジタル庁TCO検証・Gartner IaaS比較レポート
const COST_COMPARE = [
  {
    item: "コンピュート\n(4vCPU / 16GB / 月)",
    aws:    180,
    azure:  170,
    gcp:    160,
    oci:     56,
    sakura: null,
    unit: "USD/月",
    note: "OCI E4.Flex vs AWS m6i.xlarge 相当",
  },
  {
    item: "オブジェクトストレージ\n(1TB / 月)",
    aws:  23,
    azure: 18,
    gcp:  20,
    oci:   3,
    sakura: 8,
    unit: "USD/月",
    note: "OCI Standard vs AWS S3 Standard",
  },
  {
    item: "データ転送（アウトバウンド）\n(1TB)",
    aws:  90,
    azure: 87,
    gcp:  80,
    oci:   0,
    sakura: 0,
    unit: "USD",
    note: "OCI: 月10TBまで無料。AWS: 帯域幅コストが最大の差異要因",
  },
  {
    item: "Oracle DB Enterprise\n(2コア / 月)",
    aws:  960,
    azure: 900,
    gcp:  null,
    oci:  480,
    sakura: null,
    unit: "USD/月",
    note: "OCI: BYOL割引あり。多くの自治体業務システムはOracle DB使用",
  },
  {
    item: "TCO 総合推定比\n（政府ワークロード）",
    aws:  100,
    azure: 95,
    gcp:   90,
    oci:   55,
    sakura: 70,
    unit: "AWS=100として",
    note: "出典: Oracle TCO白書・ガバクラ先行事業TCO検証。参考値。",
  },
];

// ガバクラ認定クラウド詳細
const GOVCLOUD_PROVIDERS = [
  {
    id: "aws",
    name: "AWS",
    fullName: "Amazon Web Services",
    certifiedYear: 2021,
    origin: "米国",
    color: "#FF9900",
    bgColor: "#fff8ed",
    infraShare: 97.0,
    costIndex: 100,
    strengths: ["豊富なサービス群(200+)", "最大の実績・ノウハウ", "グローバル標準"],
    weaknesses: ["データ転送コストが高い", "AWS独自機能でロックイン", "米国CLOUD Act対象"],
    govNote: "先行事業の97%がAWS。事実上のデファクトスタンダード。",
  },
  {
    id: "azure",
    name: "Azure",
    fullName: "Microsoft Azure",
    certifiedYear: 2021,
    origin: "米国",
    color: "#0078D4",
    bgColor: "#eef6ff",
    infraShare: 2.0,
    costIndex: 95,
    strengths: ["Microsoft 365 完全統合", "Active Directory/Entra ID", "ハイブリッド対応"],
    weaknesses: ["Azure独自サービス依存", "複雑な料金体系", "米国CLOUD Act対象"],
    govNote: "M365導入済みの省庁・自治体で選択されやすい。",
  },
  {
    id: "gcp",
    name: "Google Cloud",
    fullName: "Google Cloud Platform",
    certifiedYear: 2021,
    origin: "米国",
    color: "#4285F4",
    bgColor: "#eef3ff",
    infraShare: 0.7,
    costIndex: 90,
    strengths: ["BigQuery・分析基盤", "AI/ML(Vertex AI)", "Workspace連携"],
    weaknesses: ["政府実績が少ない", "サポート体制が他社比弱い"],
    govNote: "データ分析・AI活用に強み。政府実績はまだ少ない。",
  },
  {
    id: "oci",
    name: "OCI",
    fullName: "Oracle Cloud Infrastructure",
    certifiedYear: 2022,
    origin: "米国",
    color: "#F80000",
    bgColor: "#fff3f3",
    infraShare: 0.3,
    costIndex: 55,
    strengths: ["Oracle DB自治体で主流", "固定価格(Universal Credits)", "出口転送無料", "AWS比40-45%安い"],
    weaknesses: ["サービス数がAWSより少ない", "認定遅れでシェア低い", "Oracle製品以外は弱い"],
    govNote: "自治体業務システムはOracle DB依存が多い→OCI移行でライセンスコスト大幅削減可能。コスト面で最有力だが移行障壁あり。",
  },
  {
    id: "sakura",
    name: "さくら",
    fullName: "さくらインターネット",
    certifiedYear: 2024,
    origin: "日本",
    color: "#E2004B",
    bgColor: "#fff0f5",
    infraShare: 0.1,
    costIndex: 70,
    strengths: ["唯一の国産クラウド", "CLOUD Act非対象", "データ主権確保", "固定費用型"],
    weaknesses: ["試行段階・実績なし", "サービス数が少ない", "グローバル展開なし"],
    govNote: "2024年認定。国産クラウド育成方針の象徴だが、まだ試行段階。長期的に価格競争促進が期待される。",
  },
];

type CloudCostItem = { cloud: string; avg: number; min: number; max: number; n: number };

export default async function CloudPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let vendorCloudShare: { cloud: string; count: number; pct: number }[] = [];
  let cloudCosts: CloudCostItem[] = [];
  let vendorTotal = 0;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data: vendors } = await supabase
        .from("vendors")
        .select("cloud_platform, municipality_count")
        .not("cloud_platform", "is", null);

      if (vendors && vendors.length > 0) {
        const shareMap: Record<string, number> = {};
        for (const v of vendors) {
          const cp = v.cloud_platform ?? "不明";
          shareMap[cp] = (shareMap[cp] ?? 0) + (v.municipality_count ?? 0);
        }
        vendorTotal = Object.values(shareMap).reduce((a, b) => a + b, 0);
        vendorCloudShare = Object.entries(shareMap)
          .map(([cloud, count]) => ({ cloud, count, pct: vendorTotal > 0 ? (count / vendorTotal) * 100 : 0 }))
          .sort((a, b) => b.count - a.count);
      }

      const { data: costRows } = await supabase
        .from("cost_reports")
        .select("change_ratio, vendors(cloud_platform)")
        .not("change_ratio", "is", null);

      if (costRows && costRows.length > 0) {
        const costMap: Record<string, number[]> = {};
        for (const row of costRows) {
          const cp = (row.vendors as { cloud_platform?: string } | null)?.cloud_platform ?? "不明";
          if (!costMap[cp]) costMap[cp] = [];
          costMap[cp].push(row.change_ratio);
        }
        cloudCosts = Object.entries(costMap).map(([cloud, vals]) => ({
          cloud,
          avg: vals.reduce((a, b) => a + b, 0) / vals.length,
          min: Math.min(...vals), max: Math.max(...vals), n: vals.length,
        }));
      }
    } catch { /* fallthrough */ }
  }

  const getProviderById = (id: string) => GOVCLOUD_PROVIDERS.find((p) => p.id === id);
  const getColorForCloud = (cloudName: string) =>
    GOVCLOUD_PROVIDERS.find((p) =>
      cloudName.toLowerCase().includes(p.id) ||
      p.name.toLowerCase().includes(cloudName.toLowerCase())
    )?.color ?? "#6b7280";

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">クラウド基盤分析</h1>
        <p className="page-subtitle">
          ガバクラ認定5クラウドの実稼働シェア・コスト比較・OCI割安の実態
        </p>
      </div>

      {/* ① ガバクラ インフラシェア実態 */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "#FF9900" }} />
          ガバクラ インフラシェア実態
          <span className="ml-1 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
            本番稼働システム数（2024年10月時点）
          </span>
        </h2>
        <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
          出典: デジタル庁ガバメントクラウド先行事業調査（令和6年9月）。本番環境 {INFRA_TOTAL.toLocaleString()} システムのクラウド別稼働数。
        </p>

        <div className="rounded-xl p-5 mb-5 flex items-center gap-5" style={{ backgroundColor: "#fff8ed", border: "2px solid #FF9900" }}>
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: "#FF9900" }}>AWS（Amazon Web Services）</p>
            <p className="text-5xl font-extrabold leading-none" style={{ color: "#FF9900" }}>97%</p>
            <p className="text-sm mt-1" style={{ color: "#b45309" }}>
              {INFRA_SHARE[0].systems.toLocaleString()} / {INFRA_TOTAL.toLocaleString()} システム
            </p>
          </div>
          <div className="flex-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            <p className="font-medium mb-1">事実上の独占状態</p>
            <p className="text-xs">認定クラウドは5社あるが、実際に移行が進んでいるシステムはほぼAWS一択。Azure・GCP・OCI・さくらの合計は残り3%（45システム）。認定が遅れたOCIとさくらは本来コスト面で優位性があるにもかかわらず、ほぼ実績がない状態。</p>
          </div>
        </div>

        <div className="space-y-2">
          {INFRA_SHARE.map((item) => {
            const pct = (item.systems / INFRA_TOTAL) * 100;
            return (
              <div key={item.cloud} className="flex items-center gap-3">
                <span className="text-sm w-28 flex-shrink-0 text-right font-medium" style={{ color: item.color }}>{item.cloud}</span>
                <div className="bar-track flex-1">
                  <div className="bar-fill" style={{ width: `${Math.max(pct, 0.3)}%`, backgroundColor: item.color }} />
                </div>
                <span className="text-sm font-bold w-16 flex-shrink-0 text-right tabular-nums" style={{ color: item.color }}>{pct.toFixed(1)}%</span>
                <span className="text-xs text-gray-400 w-20 flex-shrink-0 text-right tabular-nums">{item.systems.toLocaleString()}システム</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ② クラウド別コスト比較（ガバクラ典型ワークロード） */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "#F80000" }} />
          クラウド別コスト比較
          <span className="ml-1 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>ガバクラ典型ワークロード</span>
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          出典: Oracle TCO白書・デジタル庁ガバクラ先行事業TCO検証・Gartner IaaS比較。参考値（為替・構成により変動）。
        </p>

        {/* OCI注目バナー */}
        <div className="rounded-lg p-4 mb-4 flex items-start gap-3" style={{ backgroundColor: "#fff3f3", border: "1px solid #F8000040" }}>
          <span className="text-xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "#F80000" }}>OCI は AWS の約55% のコスト</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              自治体業務システムの多くが Oracle DB を使用しているため、OCI に移行するとライセンスコスト（BYOL）も含めて大幅削減可能。
              特にデータ転送（エグレス）費用が無料なため、データ量が多い自治体ほど差が出る。
              ガバクラのAWS97%独占はコスト最適化の観点では疑問が残る。
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs text-gray-500 font-medium w-44">項目</th>
                {["aws","azure","gcp","oci","sakura"].map((id) => {
                  const p = getProviderById(id)!;
                  return (
                    <th key={id} className="text-right py-2.5 px-3 text-xs font-bold" style={{ color: p.color }}>
                      {p.name}
                    </th>
                  );
                })}
                <th className="text-left py-2.5 px-3 text-xs text-gray-400 font-normal">備考</th>
              </tr>
            </thead>
            <tbody>
              {COST_COMPARE.map((row) => {
                const vals = [row.aws, row.azure, row.gcp, row.oci, row.sakura].filter((v): v is number => v !== null);
                const minVal = Math.min(...vals);
                return (
                  <tr key={row.item} className="border-b border-gray-100">
                    <td className="py-3 px-3 text-xs text-gray-600 leading-tight whitespace-pre-wrap">{row.item}<br /><span className="text-gray-400">{row.unit}</span></td>
                    {[
                      { id: "aws",    val: row.aws },
                      { id: "azure",  val: row.azure },
                      { id: "gcp",    val: row.gcp },
                      { id: "oci",    val: row.oci },
                      { id: "sakura", val: row.sakura },
                    ].map(({ id, val }) => {
                      const p = getProviderById(id)!;
                      const isCheapest = val !== null && val === minVal;
                      return (
                        <td key={id} className="py-3 px-3 text-right tabular-nums">
                          {val === null ? (
                            <span className="text-gray-300 text-xs">—</span>
                          ) : (
                            <span
                              className={`font-bold text-sm ${isCheapest ? "px-1.5 py-0.5 rounded" : ""}`}
                              style={{
                                color: isCheapest ? p.color : "var(--color-text-secondary)",
                                backgroundColor: isCheapest ? p.color + "18" : "transparent",
                              }}
                            >
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-xs text-gray-400 max-w-xs leading-relaxed">{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          ※ 最小値（最安）を各行でハイライト表示。実際のコストは構成・ボリューム・契約形態により異なります。
        </p>
      </div>

      {/* ③ クラウド詳細比較カード */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          ガバクラ認定クラウド 詳細評価
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          コスト・強み・弱み・ガバクラでの位置づけ
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {GOVCLOUD_PROVIDERS.map((p) => (
            <div key={p.id} className="rounded-lg border p-4" style={{ borderColor: p.color + "40", backgroundColor: p.bgColor }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold" style={{ color: p.color }}>{p.name}</span>
                  {p.origin === "日本" && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#e2004b20", color: "#e2004b" }}>国産</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400">コスト指数</span>
                  <p className="text-lg font-extrabold leading-none" style={{ color: p.costIndex <= 60 ? "#007a3d" : p.costIndex <= 80 ? "#1e40af" : "#b45309" }}>
                    {p.costIndex}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{p.certifiedYear}年認定 · インフラシェア {p.infraShare}%</p>

              <div className="mb-2">
                <p className="text-xs font-semibold mb-1 text-green-700">◎ 強み</p>
                <ul className="space-y-0.5">
                  {p.strengths.map((s) => <li key={s} className="text-xs text-gray-600">・{s}</li>)}
                </ul>
              </div>
              <div className="mb-3">
                <p className="text-xs font-semibold mb-1 text-red-600">△ 弱み</p>
                <ul className="space-y-0.5">
                  {p.weaknesses.map((w) => <li key={w} className="text-xs text-gray-500">・{w}</li>)}
                </ul>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: p.color + "30" }}>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{p.govNote}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ④ 2層構造説明 */}
      <div className="rounded-lg border-l-4 px-5 py-4 flex gap-4" style={{ borderLeftColor: "var(--color-gov-primary)", backgroundColor: "#f0f5ff" }}>
        <div className="text-2xl leading-none flex-shrink-0 mt-0.5">🏗️</div>
        <div className="w-full">
          <p className="text-sm font-bold mb-2" style={{ color: "var(--color-gov-primary)" }}>ガバクラの2層構造：インフラ層 vs アプリ層</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="font-medium mb-1" style={{ color: "#FF9900" }}>① インフラ層（上のグラフ）</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                自治体・省庁のシステムが「どのクラウド上で動いているか」。AWS 97%はこの層の話。デジタル庁の先行事業調査が出典。
              </p>
            </div>
            <div>
              <p className="font-medium mb-1" style={{ color: "var(--color-gov-primary)" }}>② アプリ層（SaaSベンダー）</p>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                TKC・RKKCS・富士通等のSaaSベンダーが自社パッケージをどのクラウドで運用しているか。本DBのvendors.cloud_platformが出典。アプリ層では OCI・Azure の比率が高い。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ⑤ SaaSベンダー利用クラウド分布 */}
      {vendorCloudShare.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
            SaaSベンダー利用クラウド分布（アプリ層）
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            vendors.cloud_platform × municipality_count。インフラ層（AWS97%）とは別指標。
          </p>
          <div className="space-y-3">
            {vendorCloudShare.map((item) => {
              const color = getColorForCloud(item.cloud);
              return (
                <div key={item.cloud} className="flex items-center gap-3">
                  <span className="text-sm w-28 flex-shrink-0 text-right font-medium" style={{ color }}>{item.cloud}</span>
                  <div className="bar-track flex-1">
                    <div className="bar-fill" style={{ width: `${item.pct}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-sm font-bold w-16 flex-shrink-0 text-right tabular-nums" style={{ color }}>{item.pct.toFixed(1)}%</span>
                  <span className="text-xs text-gray-400 w-20 flex-shrink-0 text-right tabular-nums">{item.count.toLocaleString()}件</span>
                </div>
              );
            })}
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">合計 {vendorTotal.toLocaleString()} 件</p>
          </div>
        </div>
      )}

      {/* ⑥ ガバクラ費用構造 */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          ガバクラ費用構造の整理
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg p-4" style={{ backgroundColor: "#f0f5ff" }}>
            <p className="text-sm font-bold mb-2" style={{ color: "var(--color-gov-primary)" }}>📦 費用の構成要素</p>
            <ul className="space-y-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <li><span className="font-medium">①クラウド利用料</span>（AWS/Azure/GCP等）<br /><span className="text-xs text-gray-400">デジタル庁一括契約 → 自治体に按分</span></li>
              <li><span className="font-medium">②パッケージSaaS料金</span>（TKC/RKKCS等）<br /><span className="text-xs text-gray-400">業務ソフト利用料。クラウド利用料とは別途発生</span></li>
              <li><span className="font-medium">③移行・導入費</span><br /><span className="text-xs text-gray-400">データ移行・システム連携・職員研修など一時費用</span></li>
              <li><span className="font-medium">④運用保守費</span><br /><span className="text-xs text-gray-400">ヘルプデスク・バージョンアップ対応</span></li>
            </ul>
          </div>
          <div className="rounded-lg p-4" style={{ backgroundColor: "#fff8ed" }}>
            <p className="text-sm font-bold mb-2" style={{ color: "#b45309" }}>⚠️ コスト増の主因</p>
            <ul className="space-y-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <li>• オンプレ→クラウド移行で<span className="font-medium">構造的コスト増</span>（設備費→運用費）</li>
              <li>• <span className="font-medium">中小自治体は規模の経済が効かない</span></li>
              <li>• 移行期間中は新旧<span className="font-medium">二重コスト</span>が発生</li>
              <li>• <span className="font-medium text-red-700">AWS97%独占</span>が価格競争を阻害</li>
              <li>• OCI・さくら活用で<span className="font-medium text-green-700">30〜45%削減余地あり</span></li>
              <li>• デジタル庁が2024年にAWS値下げ交渉実施（効果検証中）</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ⑦ コスト実績（DBデータ） */}
      {cloudCosts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
            <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "#b91c1c" }} />
            クラウド別コスト変化実績（DB）
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            cost_reports の change_ratio をベンダーのcloud_platform 別に集計
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">クラウド</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium">平均倍率</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium">最小</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium">最大</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium">件数</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">評価</th>
                </tr>
              </thead>
              <tbody>
                {cloudCosts.sort((a, b) => a.avg - b.avg).map((item) => {
                  const badgeColor = item.avg < 1.0 ? "#007a3d" : item.avg < 1.5 ? "#1e40af" : item.avg < 2.0 ? "#d97706" : "#b91c1c";
                  const label = item.avg < 1.0 ? "削減" : item.avg < 1.5 ? "微増" : item.avg < 2.0 ? "増加" : "大幅増";
                  const color = getColorForCloud(item.cloud);
                  return (
                    <tr key={item.cloud} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-semibold" style={{ color }}>{item.cloud}</td>
                      <td className="py-3 px-3 text-right font-bold tabular-nums" style={{ color: badgeColor }}>{item.avg.toFixed(2)}倍</td>
                      <td className="py-3 px-3 text-right tabular-nums text-gray-600">{item.min.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-gray-600">{item.max.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-gray-400 tabular-nums">{item.n}件</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: badgeColor + "20", color: badgeColor }}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* データソース */}
      <div className="rounded-lg border border-gray-100 px-5 py-3 bg-gray-50">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-600">データソース:</span>{" "}
          インフラシェア: デジタル庁先行事業調査（令和6年9月）／
          コスト比較: Oracle TCO白書・Gartner IaaS比較レポート・デジタル庁TCO検証（参考値）／
          ベンダー基盤: vendors.cloud_platform（本DB）
        </p>
      </div>
    </div>
  );
}
