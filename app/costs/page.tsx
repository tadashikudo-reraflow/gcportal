import type { Metadata } from "next";
import { CostReport, Vendor } from "@/lib/supabase";
import RelatedArticles from "@/components/RelatedArticles";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import { ExpandableCostCard, ExpandableMuniRow, VendorGroup } from "./CostClientComponents";
import CostSimulator from "./CostSimulator";

// ベンダー別コスト変化推定レンジ（公開TCO調査・先行事業報告から）
// 出典: デジタル庁先行事業TCO検証・中核市市長会調査・総務省地方財政調査
const VENDOR_COST_ESTIMATE: Record<string, {
  ratioMin: number; ratioMax: number; ratioTypical: number;
  mark: string; markColor: string; cloud: string; note: string;
}> = {
  TKC: {
    ratioMin: 1.1, ratioMax: 1.6, ratioTypical: 1.3,
    mark: "◎", markColor: "#007a3d", cloud: "AWS",
    note: "マルチテナント共同利用でコスト低減。中小自治体に有利。",
  },
  RKKCS: {
    ratioMin: 1.0, ratioMax: 1.5, ratioTypical: 1.2,
    mark: "◎", markColor: "#007a3d", cloud: "OCI",
    note: "OCI基盤。シンプルな価格体系・Egress 10TB/月無料・OCPU課金で利用料自体が安価。Oracle DB利用時はライセンス込みでさらに有利。",
  },
  富士通: {
    ratioMin: 1.5, ratioMax: 3.0, ratioTypical: 2.0,
    mark: "△", markColor: "#d97706", cloud: "AWS",
    note: "MICJET はAWS基盤。大規模カスタマイズ・移行遅延で追加費用リスクあり。",
  },
  NEC: {
    ratioMin: 1.3, ratioMax: 2.5, ratioTypical: 1.8,
    mark: "○", markColor: "#1d6fa4", cloud: "AWS",
    note: "住民・税務系はAWS主軸。GPRIME行政経営のみOCI。",
  },
  Gcom: {
    ratioMin: 1.2, ratioMax: 2.0, ratioTypical: 1.5,
    mark: "○", markColor: "#1d6fa4", cloud: "AWS",
    note: "Acrocity/GRAP等をAWS基盤で提供。ガバメントクラウド対応推進中（採用情報・公式）。",
  },
  電算: {
    ratioMin: 1.1, ratioMax: 1.8, ratioTypical: 1.4,
    mark: "◎", markColor: "#007a3d", cloud: "AWS",
    note: "Reams（総合行政情報システム）をAWSガバメントクラウドへ移行。甲信越・北海道中心（芽室町等2026年2月稼働予定）。",
  },
  日立: {
    ratioMin: 1.3, ratioMax: 2.2, ratioTypical: 1.6,
    mark: "○", markColor: "#1d6fa4", cloud: "AWS",
    note: "ADWORLD全20業務AWS対応。大規模自治体向け。",
  },
};

export const metadata: Metadata = {
  title: "ガバメントクラウド移行コスト分析【ベンダー別比較】| ガバメントクラウド移行状況ダッシュボード",
  description:
    "ガバメントクラウド移行コストが当初比156%増になる実態をベンダー別に分析。TKC・富士通・NEC・日立などのコスト指数と費用対効果を比較。自治体のコスト削減・FinOps実践に活用。",
  openGraph: {
    title: "ガバメントクラウド移行コスト分析",
    description:
      "移行コストが当初比156%増。ベンダー別コスト比較と費用対効果を可視化。",
    images: [
      {
        url: `/og?title=${encodeURIComponent("コスト分析")}&subtitle=${encodeURIComponent("ガバメントクラウド移行コスト増減を可視化")}&type=cost`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/costs" },
};

// change_ratioに応じたバー幅（基準1.0 = 50%、最大3.0 = 100%）
function getBarWidth(ratio: number): number {
  if (ratio <= 0) return 0;
  const pct = (ratio / 3.0) * 100;
  return Math.min(pct, 100);
}

function getRatioLabel(ratio: number): string {
  if (ratio < 1.0) return `${((1 - ratio) * 100).toFixed(0)}%削減`;
  return `+${((ratio - 1) * 100).toFixed(0)}%増加`;
}

// scope（DB値）を日本語ラベルに変換
function scopeToJapanese(scope: string): string {
  const map: Record<string, string> = {
    municipality: "自治体",
    city_group: "自治体区分",
    prefecture: "都道府県",
    national: "全国",
    vendor: "ベンダー",
  };
  return map[scope] ?? scope;
}

function toPercent(ratio: number): string {
  if (ratio < 1.0) return `−${((1 - ratio) * 100).toFixed(0)}%`;
  return `+${((ratio - 1) * 100).toFixed(0)}%`;
}

// ベンダー別評価（出典: Grok調査 + 公式プレスリリース・自治体資料）
const vendorEvaluations: Record<string, { label: string; detail: string; mark: string; markColor: string; cloud: string; confirmed: boolean }> = {
  TKC: {
    label: "コスト効率◎",
    detail: "マルチテナント共同利用 → 規模の経済によるコスト低減",
    mark: "◎", markColor: "#007a3d", cloud: "AWS", confirmed: true,
  },
  NEC: {
    label: "コスト管理○",
    detail: "住民・税務系はAWS主軸。GPRIME行政経営のみOCI（NEC公式 2024/10）",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  富士通: {
    label: "コスト増リスク△",
    detail: "MICJET on AWS。大規模カスタマイズ・移行遅延で追加費用リスクあり",
    mark: "△", markColor: "#d97706", cloud: "AWS", confirmed: true,
  },
  RKKCS: {
    label: "コスト効率◎",
    detail: "OCI採用。シンプルな価格体系・Egress無料枠大・OCPU課金で利用料自体が安価。Oracle DB利用時はライセンス込みでさらに有利（RKKCS公式）",
    mark: "◎", markColor: "#007a3d", cloud: "OCI", confirmed: true,
  },
  日立: {
    label: "AWS全業務対応○",
    detail: "ADWORLD全20業務AWS対応確認済。Azure主要8業務も検証済（日立システムズ 2024/8プレスリリース）",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  アイネス: {
    label: "AWS実績○",
    detail: "倉敷市・町田市等でAWS稼働。WebRings福祉総合システム標準化対応済",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  Gcom: {
    label: "AWS標準○",
    detail: "Acrocity/GRAP等をAWS基盤で提供。ガバメントクラウド対応推進中（公式採用情報）",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  電算: {
    label: "AWS採用◎",
    detail: "Reams（総合行政情報システム）をAWSガバメントクラウドへ移行。甲信越・北海道中心（北海道芽室町等2026年2月稼働予定）",
    mark: "◎", markColor: "#007a3d", cloud: "AWS", confirmed: true,
  },
  GCC: {
    label: "OCI採用○",
    detail: "e-SUITE v2 for Government CloudをOCI基盤で提供。富岡市等本稼働（日本オラクル共同プレスリリース）",
    mark: "○", markColor: "#1d6fa4", cloud: "OCI", confirmed: true,
  },
  JIP: {
    label: "AWS＋自社IaaS○",
    detail: "WizLIFEはAWS対応。自社IaaS「Jip-Base」（自治体専用）も提供（JIP公式）",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  "行政S": {
    label: "AWS検証済○",
    detail: "デジタル庁令和5年度検証事業でAWS上検証実施（2024/9報告）。共同利用・マルチベンダー連携対応",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  "京都GIS": {
    label: "接続基盤（AWS基本）",
    detail: "京都GC接続サービス（2024/7〜）。AWS Direct Connect基本。OCI/Azure/GCPもサポート。接続基盤提供",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
};

// クラウド別コスト比較データ（AWS=100 基準）
// 算出根拠: 各クラウドの公式料金表（2025年時点）で標準化20業務想定ワークロード
// （vCPU 4-8、メモリ16-32GB、ストレージ500GB-1TB、DB: RDB中規模）のTCOを比較。
// Egress料金・サポート費用・ライセンス費用を含む月額総額の相対比。
const CLOUD_COMPARISON = [
  {
    cloud: "AWS",
    color: "#FF9900",
    index: 100,
    basis: "基準値。EC2 RI 1年 + RDS + S3 + データ転送（Egress月100GB）+ Business Support。",
    strengths: "最大のシェア・豊富なサービス・ガバメントクラウド第一号認定。リージョン冗長性高い。",
    weaknesses: "従量課金が複雑。データ転送コスト（Egress）が高い。RI/SP活用が必須。",
    govCloudNote: "ガバメントクラウド最多採用。AP Northeast (Tokyo/Osaka) リージョン利用。",
  },
  {
    cloud: "GCP",
    color: "#4285F4",
    index: 85,
    basis: "Compute Engine CUD 1年 + Cloud SQL + GCS。Sustained Use Discount自動適用。Egress料金がAWSより安価。",
    strengths: "ネットワーク性能高い。BigQuery等のデータ分析基盤。Sustained Use Discount自動適用。",
    weaknesses: "ガバメントクラウドでの採用実績がまだ限定的。エンタープライズサポート体制の充実度。",
    govCloudNote: "電算等一部ベンダーが採用。データ分析系ワークロードに強み。",
  },
  {
    cloud: "Azure",
    color: "#0078D4",
    index: 95,
    basis: "VM RI 1年 + Azure SQL + Blob Storage。Microsoft EA契約時の割引反映前。Egress料金はAWSと同水準。",
    strengths: "Microsoft製品との統合性。ハイブリッドクラウド（Azure Arc）。行政機関での実績。",
    weaknesses: "リージョン構成がAWSより限定的。ライセンス体系がやや複雑。",
    govCloudNote: "日立等一部ベンダーが検証済。Microsoft 365との親和性で選定される場合あり。",
  },
  {
    cloud: "OCI",
    color: "#F80000",
    index: 55,
    basis: "Compute OCPU + Autonomous DB。Egress月10TB無料（AWSは100GBで課金開始）。OCPU課金はvCPU換算で安価。Oracle DB利用時はライセンス込みでさらに有利。",
    strengths: "シンプルな価格体系で利用料自体が安価。Egress 10TB/月無料。OCPU課金がvCPU比で低コスト。Oracle DB利用時はライセンス込みでTCO大幅削減。",
    weaknesses: "サービスラインナップがAWS/Azureに比べ限定的。エコシステムの規模。非Oracle DBワークロードでの優位性は限定的。",
    govCloudNote: "RKKCS・GCC等が採用。Oracle DB依存に限らず、シンプルな料金体系を評価して選定する自治体も。日本オラクルが自治体向け支援強化中。",
  },
  {
    cloud: "さくらのクラウド",
    color: "#FF8C9E",
    index: 80,
    basis: "専有サーバ + MariaDB/PostgreSQL + オブジェクトストレージ。国内DCのみで低レイテンシ。転送量課金なし（閉域網内）。",
    strengths: "国産クラウド。データ主権・国内完結。転送量課金なし（閉域網）。専有型でセキュリティ高。",
    weaknesses: "マネージドサービスが限定的。グローバル展開なし。大規模ワークロードの実績が少ない。",
    govCloudNote: "ガバメントクラウド認定済。国内データセンター完結を重視する自治体が選定。さくらインターネットが自治体支援を強化。",
  },
];

export default async function CostsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let costs: (CostReport & { vendors?: Vendor })[] = [];
  let vendors: Vendor[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let muniPkgData: any[] = [];

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <p className="text-yellow-700 font-medium">Supabase環境変数が設定されていません。</p>
        <p className="text-yellow-600 text-sm mt-1">.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。</p>
      </div>
    );
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [costRes, vendorRes, muniPkgRes] = await Promise.all([
      supabase
        .from("cost_reports")
        .select("*, vendors(name, short_name, cloud_platform)")
        .order("change_ratio"),
      supabase.from("vendors").select("*").order("name"),
      supabase
        .from("municipality_packages")
        .select("municipality_id, municipalities(city, prefecture), packages(vendor_id, vendors(id, short_name, name, cloud_platform))")
        .limit(2000),
    ]);

    costs = costRes.data ?? [];
    vendors = vendorRes.data ?? [];
    muniPkgData = muniPkgRes.data ?? [];
  } catch {
    costs = [];
    vendors = [];
    muniPkgData = [];
  }

  // 自治体×ベンダーの紐付け集計
  type MuniCostEstimate = {
    municipality_id: number;
    city: string;
    prefecture: string;
    primaryVendor: string;
    cloud: string;
    ratioTypical: number;
    ratioMin: number;
    ratioMax: number;
    mark: string;
    markColor: string;
  };

  const muniMap: Record<number, { city: string; prefecture: string; vendorCounts: Record<string, number> }> = {};
  for (const row of muniPkgData) {
    const mid = row.municipality_id;
    const city = row.municipalities?.city ?? "不明";
    const prefecture = row.municipalities?.prefecture ?? "";
    const vendorShort = row.packages?.vendors?.short_name ?? row.packages?.vendors?.name ?? "不明";
    if (!muniMap[mid]) muniMap[mid] = { city, prefecture, vendorCounts: {} };
    muniMap[mid].vendorCounts[vendorShort] = (muniMap[mid].vendorCounts[vendorShort] ?? 0) + 1;
  }

  const muniEstimates: MuniCostEstimate[] = Object.entries(muniMap).map(([midStr, info]) => {
    const mid = Number(midStr);
    const primaryVendor = Object.entries(info.vendorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "不明";
    const est = VENDOR_COST_ESTIMATE[primaryVendor];
    return {
      municipality_id: mid,
      city: info.city,
      prefecture: info.prefecture,
      primaryVendor,
      cloud: est?.cloud ?? "調査中",
      ratioTypical: est?.ratioTypical ?? 1.5,
      ratioMin: est?.ratioMin ?? 1.0,
      ratioMax: est?.ratioMax ?? 2.5,
      mark: est?.mark ?? "—",
      markColor: est?.markColor ?? "#9ca3af",
    };
  }).sort((a, b) => b.ratioTypical - a.ratioTypical);

  // ベンダーごとにグループ化
  const vendorGroups: Record<string, MuniCostEstimate[]> = {};
  for (const m of muniEstimates) {
    if (!vendorGroups[m.primaryVendor]) vendorGroups[m.primaryVendor] = [];
    vendorGroups[m.primaryVendor].push(m);
  }
  // ベンダー名をratioTypicalの高い順にソート
  const sortedVendorNames = Object.keys(vendorGroups).sort((a, b) => {
    const aTyp = VENDOR_COST_ESTIMATE[a]?.ratioTypical ?? 1.5;
    const bTyp = VENDOR_COST_ESTIMATE[b]?.ratioTypical ?? 1.5;
    return bTyp - aTyp;
  });

  // 最小・最大・平均
  const ratios = costs.map((c) => c.change_ratio).filter((r) => r != null);
  const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
  const minRatio = ratios.length > 0 ? Math.min(...ratios) : null;
  const maxRatio = ratios.length > 0 ? Math.max(...ratios) : null;

  // サマリー数値
  const targetPct = -30;
  const avgPct = avgRatio != null ? Math.round((avgRatio - 1) * 100) : 156;
  const worstPct = maxRatio != null ? Math.round((maxRatio - 1) * 100) : 470;

  // ゲージ上の位置計算（-50%〜+500% → 0〜100%）
  const scaleMin = -50;
  const scaleMax = 500;
  const toScalePos = (pct: number) => Math.max(0, Math.min(100, ((pct - scaleMin) / (scaleMax - scaleMin)) * 100));

  const targetPos = toScalePos(targetPct);
  const avgPos = toScalePos(avgPct);
  const worstPos = toScalePos(worstPct);
  const zeroPos = toScalePos(0);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">コスト効果分析</h1>
        <p className="page-subtitle">
          標準化移行によるコスト変化の実態。TCO比較・ベンダー別評価。
        </p>
      </div>

      {/* ⑦ サマリーバナー: 数直線ゲージ形式 */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          目標と実態のギャップ
        </h2>

        {/* 3つの数値サマリー */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg border-2 border-green-200 bg-green-50">
            <p className="text-xs text-green-600 font-semibold mb-0.5">当初目標</p>
            <p className="text-3xl font-extrabold text-green-700 tabular-nums leading-tight">−30%</p>
            <p className="text-xs text-green-500 mt-1">コスト削減</p>
          </div>
          <div className="text-center p-3 rounded-lg border-2 border-red-200 bg-red-50">
            <p className="text-xs text-red-500 font-semibold mb-0.5">実態平均</p>
            <p className="text-3xl font-extrabold text-red-600 tabular-nums leading-tight">
              +{avgPct}%
            </p>
            <p className="text-xs text-red-400 mt-1">コスト増加</p>
          </div>
          <div className="text-center p-3 rounded-lg border-2 border-red-300 bg-red-100">
            <p className="text-xs text-red-600 font-semibold mb-0.5">最悪事例</p>
            <p className="text-3xl font-extrabold text-red-800 tabular-nums leading-tight">
              +{worstPct}%
            </p>
            <p className="text-xs text-red-500 mt-1">中核市</p>
          </div>
        </div>

        {/* 数直線ゲージ */}
        <div className="relative px-2 mb-2">
          {/* ラベル行 — 上段と下段に分散して文字被りを回避 */}
          <div className="relative h-24 mb-1">
            {/* 目標マーカー（上段） */}
            <div className="absolute flex flex-col items-center" style={{ left: `${targetPos}%`, transform: "translateX(-50%)", top: 0 }}>
              <span className="text-[10px] font-bold text-green-700 whitespace-nowrap">目標</span>
              <span className="text-sm font-extrabold text-green-700">−30%</span>
              <div className="w-0.5 h-6 bg-green-600" />
            </div>
            {/* 0% = 現行運用経費 基準マーカー（下段） */}
            <div className="absolute flex flex-col items-center" style={{ left: `${zeroPos}%`, transform: "translateX(-50%)", top: 28 }}>
              <span className="text-[10px] font-bold text-gray-600 whitespace-nowrap px-1 py-0.5 rounded" style={{ backgroundColor: "#f3f4f6", border: "1px solid #d1d5db" }}>
                0%基準
              </span>
              <div className="w-0.5 h-5 bg-gray-500 mt-0.5" />
            </div>
            {/* 実態平均マーカー（上段） */}
            <div className="absolute flex flex-col items-center" style={{ left: `${avgPos}%`, transform: "translateX(-50%)", top: 0 }}>
              <span className="text-[10px] font-bold text-red-600 whitespace-nowrap">実態平均</span>
              <span className="text-sm font-extrabold text-red-600">+{avgPct}%</span>
              <div className="w-0.5 h-6 bg-red-500" />
            </div>
            {/* 最悪事例マーカー（下段） */}
            <div className="absolute flex flex-col items-center" style={{ left: `${worstPos}%`, transform: "translateX(-50%)", top: 28 }}>
              <span className="text-[10px] font-bold text-red-800 whitespace-nowrap">最悪</span>
              <span className="text-sm font-extrabold text-red-800">+{worstPct}%</span>
              <div className="w-0.5 h-5 bg-red-800" />
            </div>
          </div>

          {/* メインゲージバー */}
          <div className="relative h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {/* 削減ゾーン（緑グラデーション） */}
            <div
              className="absolute top-0 bottom-0 rounded-l-full"
              style={{
                left: 0,
                width: `${zeroPos}%`,
                background: "linear-gradient(90deg, #22c55e 0%, #bbf7d0 100%)",
                opacity: 0.4,
              }}
            />
            {/* 増加ゾーン（赤グラデーション） */}
            <div
              className="absolute top-0 bottom-0 rounded-r-full"
              style={{
                left: `${zeroPos}%`,
                width: `${100 - zeroPos}%`,
                background: "linear-gradient(90deg, #fecaca 0%, #ef4444 50%, #7f1d1d 100%)",
                opacity: 0.3,
              }}
            />
            {/* 0%基準線（現行運用経費） */}
            <div className="absolute top-0 bottom-0 w-0.5 z-10 bg-gray-600" style={{ left: `${zeroPos}%` }} />
            {/* 目標位置マーカー */}
            <div
              className="absolute top-0 bottom-0 w-1 z-20 rounded-full"
              style={{ left: `${targetPos}%`, backgroundColor: "#15803d" }}
            />
            {/* 実態平均マーカー */}
            <div
              className="absolute top-0 bottom-0 w-1 z-20 rounded-full"
              style={{ left: `${avgPos}%`, backgroundColor: "#dc2626" }}
            />
            {/* 最悪マーカー */}
            <div
              className="absolute top-0 bottom-0 w-1 z-20 rounded-full"
              style={{ left: `${worstPos}%`, backgroundColor: "#7f1d1d" }}
            />
            {/* ギャップ矢印ゾーン（目標〜実態平均） */}
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 z-15"
              style={{
                left: `${targetPos}%`,
                width: `${avgPos - targetPos}%`,
                background: "repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 4px, transparent 4px, transparent 8px)",
                opacity: 0.6,
              }}
            />
          </div>

          {/* 目盛り */}
          <div className="relative h-4 mt-0.5">
            {[-30, 0, 50, 100, 200, 300, 400, 500].map((tick) => (
              <span
                key={tick}
                className="absolute text-xs text-gray-400 tabular-nums"
                style={{ left: `${toScalePos(tick)}%`, transform: "translateX(-50%)" }}
              >
                {tick > 0 ? `+${tick}%` : `${tick}%`}
              </span>
            ))}
          </div>
        </div>

        {/* ギャップ注記 */}
        <div className="bg-amber-50 px-4 py-2.5 rounded-lg border border-amber-200 mt-3 flex items-start gap-2">
          <span className="text-amber-600 text-sm flex-shrink-0 mt-0.5">&#9888;</span>
          <div className="text-xs text-amber-700">
            <p className="font-semibold mb-0.5">
              目標（−30%）と実態平均（+{avgPct}%）の間に約{avgPct + 30}ポイントの乖離
            </p>
            <p>
              特に中小自治体・大規模カスタマイズ先で顕著。運用費・回線費の増加が主因。
            </p>
          </div>
        </div>
      </div>

      {/* 数値ハイライトバナー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 text-center" style={{ borderTop: "4px solid #c8102e" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>中核市 平均</p>
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: "#c8102e" }}>2.3<span className="text-lg">倍</span></p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>移行前コスト比</p>
        </div>
        <div className="card p-5 text-center" style={{ borderTop: "4px solid #7f1d1d" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>最大事例</p>
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: "#7f1d1d" }}>5.7<span className="text-lg">倍</span></p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>一部中核市で確認</p>
        </div>
        <div className="card p-5 text-center" style={{ borderTop: "4px solid #d97706" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>東京都</p>
          <p className="text-4xl font-extrabold tabular-nums" style={{ color: "#d97706" }}>1.6<span className="text-lg">倍</span></p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>特別区の平均増加率</p>
        </div>
      </div>

      {/* コスト増の構造的原因 */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "#c8102e" }} />
          コスト増の構造的原因
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ガバメントクラウド利用料 */}
          <div className="rounded-lg border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: "#fef3c7" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">ガバメントクラウド利用料</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  AWS/Azure/GCP/OCI等のIaaS利用料が新規発生。
                  オンプレミスでは不要だったクラウド基盤料・データ転送料が年間コストを押し上げる。
                  特に小規模自治体ではスケールメリットが効かず割高に。
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    影響大
                  </span>
                  <span className="text-xs text-gray-400">全自治体共通</span>
                </div>
              </div>
            </div>
          </div>

          {/* ソフトウェア借料 */}
          <div className="rounded-lg border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: "#ede9fe" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">ソフトウェア借料</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  標準準拠システムのSaaS/ライセンス料が移行前比で増加。
                  カスタマイズ不可の標準化仕様により、別途アドオン費用が発生するケースも。
                  ベンダーロックインによる価格交渉力の低下が一因。
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                    影響中〜大
                  </span>
                  <span className="text-xs text-gray-400">ベンダー依存</span>
                </div>
              </div>
            </div>
          </div>

          {/* ネットワーク費用 */}
          <div className="rounded-lg border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: "#dbeafe" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">ネットワーク費用</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  LGWAN-ASP接続からクラウド直接接続（Direct Connect等）への切り替えコスト。
                  閉域網接続・VPN費用・帯域増強が必要。
                  複数クラウドを利用する場合は接続ポイントごとに費用が発生。
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                    影響中
                  </span>
                  <span className="text-xs text-gray-400">インフラ依存</span>
                </div>
              </div>
            </div>
          </div>

          {/* SE単価高騰 */}
          <div className="rounded-lg border border-gray-200 p-4 bg-white hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: "#fce7f3" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 mb-1">SE単価高騰</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  全国1,741自治体の同時移行需要によりSE・PMのリソースが逼迫。
                  クラウド移行スキルを持つ技術者の単価が上昇。
                  移行期限が迫るほど「急ぎ対応」プレミアムが加算される傾向。
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-700">
                    影響中〜大
                  </span>
                  <span className="text-xs text-gray-400">市場構造</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* コストシミュレーター */}
      <CostSimulator />

      {/* ⑧ コスト変化実績（展開可能カード） */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          コスト変化実績
        </h2>
        <p className="text-xs mb-4 flex items-center gap-2 flex-wrap" style={{ color: "var(--color-text-muted)" }}>
          移行前コストを0%基準として、増減率で表示。各カードをクリックでコスト内訳を表示。
          <SourceAttribution sourceIds={["digital-cho-senkou-tco", "chukakushi-survey-2025"]} variant="inline" />
        </p>

        {costs.length === 0 ? (
          <p className="text-sm text-gray-400">データがありません。</p>
        ) : (
          <div className="space-y-3">
            {costs.map((cost) => {
              const isReduction = cost.change_ratio < 1.0;
              const pctChange = Math.abs((cost.change_ratio - 1) * 100);
              const barColor = isReduction ? "#007a3d" : cost.change_ratio >= 3.0 ? "#7f1d1d" : cost.change_ratio >= 1.5 ? "#c8102e" : "#d97706";
              const barWidth = getBarWidth(cost.change_ratio);
              const label = getRatioLabel(cost.change_ratio);
              const vendorName = cost.vendors?.short_name ?? cost.vendors?.name ?? "—";

              return (
                <ExpandableCostCard
                  key={cost.id}
                  scope={scopeToJapanese(cost.scope)}
                  changeRatio={cost.change_ratio}
                  vendorName={vendorName}
                  notes={cost.notes}
                  barWidth={barWidth}
                  barColor={barColor}
                  label={label}
                  isReduction={isReduction}
                  pctChange={pctChange}
                />
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-green-600" />削減（−%）</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-red-600" />増加（+%）</div>
          <span className="text-gray-400">縦線 = 変化なし基準（0%）</span>
        </div>
      </div>

      {/* ベンダー別評価テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#003087" }} />
          ベンダー別コスト評価
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">ベンダー</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">クラウド</th>
                <th className="text-center py-2 px-3 text-xs text-gray-500 font-medium">評価</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">評価観点</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">詳細</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => {
                const shortName = vendor.short_name ?? vendor.name;
                const evalData = vendorEvaluations[shortName];
                return (
                  <tr
                    key={vendor.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <p className="font-semibold text-gray-800">{shortName}</p>
                      {vendor.short_name && (
                        <p className="text-xs text-gray-400">{vendor.name}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs">
                      {evalData?.cloud ? (
                        <span className="font-medium" style={{
                          color: evalData.cloud === "AWS" ? "#FF9900" : evalData.cloud === "OCI" ? "#F80000" : evalData.cloud === "Azure" ? "#0078D4" : evalData.cloud === "GCP" ? "#4285F4" : "#6b7280"
                        }}>
                          {evalData.cloud}
                          {evalData.confirmed && <span className="ml-1 text-green-600">&#10003;</span>}
                        </span>
                      ) : (
                        <span className="text-gray-400">調査中</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {evalData ? (
                        <span
                          className="text-xl font-bold"
                          style={{ color: evalData.markColor }}
                        >
                          {evalData.mark}
                        </span>
                      ) : (
                        <span className="text-gray-400">調査中</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600">
                      {evalData?.label ?? "調査中"}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">
                      {evalData?.detail ?? "調査中"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ⑧ クラウド別コスト比較（AWS=100基準） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#003087" }} />
          クラウド別コスト比較
          <span className="text-xs font-normal text-gray-400 ml-1">AWSを100とした相対指数</span>
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          同一ワークロード（標準化20業務）想定でのコスト指数比較。値が低いほど低コスト。
          出典: 各クラウド公式料金表・先行事業TCO分析・ベンダーヒアリングを基に推定。
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium">クラウド</th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-medium w-28">
                  コスト指数
                  <br />
                  <span className="text-gray-400 font-normal">（AWS=100）</span>
                </th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium" style={{ minWidth: 120 }}>指数バー</th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium">強み</th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium">課題</th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium">ガバクラ動向</th>
              </tr>
            </thead>
            <tbody>
              {CLOUD_COMPARISON.map((row) => {
                const isBaseline = row.cloud === "AWS";
                return (
                  <tr
                    key={row.cloud}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isBaseline ? "bg-amber-50/30" : ""}`}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="font-semibold text-gray-800">{row.cloud}</span>
                        {isBaseline && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">基準</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-2xl font-extrabold tabular-nums" style={{ color: row.color }}>
                        {row.index}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="relative h-5 rounded-full overflow-hidden bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${row.index}%`, backgroundColor: row.color, opacity: 0.7 }}
                        />
                        {isBaseline && (
                          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-gray-400" style={{ left: "100%" }} />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600 max-w-[200px]">{row.strengths}</td>
                    <td className="py-3 px-3 text-xs text-gray-500 max-w-[200px]">{row.weaknesses}</td>
                    <td className="py-3 px-3 text-xs text-gray-500 max-w-[200px]">{row.govCloudNote}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            ※ コスト指数はAWSの標準料金を100とした場合の相対値。RI/SP/Committed Use等の割引適用前の参考値。
            実際のコストは利用パターン・契約条件・ベンダー独自割引により大きく変動します。
          </p>
        </div>
      </div>

      {/* 注記 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400">
          ※ コスト比率は移行前を1.0とした比率。1.0未満 = コスト削減、1.0以上 = コスト増。
          判明分のみ集計のため、実態との乖離がある場合があります。
        </p>
      </div>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.costs} pageId="costs" />

      {/* ⑧ 自治体別コスト影響推定（ベンダー別グループ） */}
      {muniEstimates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#d97706" }} />
            自治体別コスト影響推定
            <span className="text-xs font-normal text-gray-400 ml-1">（全{muniEstimates.length}件・ベンダー別）</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            自治体の採用パッケージ・ベンダー情報とコスト調査レポートを紐付けた推定値。実際の請求額ではありません。
            主ベンダー（最多採用パッケージ）のコスト変化レンジを適用。各行をクリックで詳細展開。
          </p>

          <div className="space-y-3">
            {sortedVendorNames.map((vendorName) => {
              const items = vendorGroups[vendorName];
              const est = VENDOR_COST_ESTIMATE[vendorName];
              return (
                <VendorGroup
                  key={vendorName}
                  vendorName={vendorName}
                  cloud={est?.cloud ?? "調査中"}
                  mark={est?.mark ?? "—"}
                  markColor={est?.markColor ?? "#9ca3af"}
                  note={est?.note ?? ""}
                  count={items.length}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">#</th>
                          <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">都道府県</th>
                          <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">市区町村</th>
                          <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">主ベンダー</th>
                          <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">クラウド</th>
                          <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">推定増加率</th>
                          <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">増加レンジ</th>
                          <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium">評価</th>
                          <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <ExpandableMuniRow
                            key={item.municipality_id}
                            index={i + 1}
                            city={item.city}
                            prefecture={item.prefecture}
                            primaryVendor={item.primaryVendor}
                            cloud={item.cloud}
                            ratioTypical={item.ratioTypical}
                            ratioMin={item.ratioMin}
                            ratioMax={item.ratioMax}
                            mark={item.mark}
                            markColor={item.markColor}
                            vendorNote={est?.note ?? ""}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </VendorGroup>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              &#9888; 推定値（参考）: ベンダー種別ごとのコスト変化レンジを自治体に紐付けた推計。
              実際のコストは契約・規模・移行状況により大きく異なります。
              出典: デジタル庁TCO検証・中核市市長会調査・総務省地方財政調査を基に推定。
            </p>
          </div>
        </div>
      )}

      <RelatedArticles cluster={CLUSTERS.cost} />
    </div>
  );
}
