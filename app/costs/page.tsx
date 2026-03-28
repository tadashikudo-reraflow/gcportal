import type { Metadata } from "next";
import Link from "next/link";
import { CostReport, Vendor } from "@/lib/supabase";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import ReportLeadCta from "@/components/ReportLeadCta";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import { ExpandableCostCard, VendorCard } from "./CostClientComponents";
import Breadcrumb from "@/components/Breadcrumb";

// ベンダー別コスト変化推定レンジ（公開TCO調査・先行事業報告から）
// 出典: デジタル庁先行事業TCO検証・中核市市長会調査・総務省地方財政調査
// ※ コストレンジは独自調査・参考値。実際の契約条件・規模により大幅に異なる場合があります。
// ⚠️ データ整合性: cloud フィールドは Supabase vendors.cloud_platform を正とする。
//    gc-rag-refresh Phase 2 Step 8 で定期照合。不一致時はDB側を優先して修正すること。
const VENDOR_COST_ESTIMATE: Record<string, {
  ratioMin: number; ratioMax: number; ratioTypical: number;
  mark: string; markColor: string; cloud: string; note: string;
}> = {
  TKC: {
    ratioMin: 1.1, ratioMax: 1.6, ratioTypical: 1.3,
    mark: "◎", markColor: "#007a3d", cloud: "AWS",
    note: "マルチテナント共同利用でコスト低減。中小自治体に有利。【出典: デジタル庁先行事業TCO検証・中核市市長会調査 ※参考値】",
  },
  RKKCS: {
    ratioMin: 1.0, ratioMax: 1.5, ratioTypical: 1.2,
    mark: "◎", markColor: "#007a3d", cloud: "OCI",
    note: "OCI（Oracle Cloud）基盤。円建て課金でコスト効率に優れる。データ転送料が月10TBまで無料で利用料が安価。札幌市は2025年4月にOCIで32業務移行を発表。【出典: RKKCS公式・日本オラクル ※一部参考値】",
  },
  富士通: {
    ratioMin: 1.5, ratioMax: 3.0, ratioTypical: 2.0,
    mark: "△", markColor: "#d97706", cloud: "AWS",
    note: "MICJET はAWS基盤。大規模カスタマイズ・移行遅延で追加費用リスクあり。【出典: 中核市市長会調査・デジタル庁TCO検証 ※参考値】",
  },
  NEC: {
    ratioMin: 1.3, ratioMax: 2.5, ratioTypical: 1.8,
    mark: "○", markColor: "#1d6fa4", cloud: "AWS",
    note: "住民・税務系はAWS主軸。GPRIME行政経営のみOCI。【出典: NEC公式（2024/10） ※コストレンジは参考値】",
  },
  Gcom: {
    ratioMin: 1.2, ratioMax: 2.0, ratioTypical: 1.5,
    mark: "○", markColor: "#1d6fa4", cloud: "AWS",
    note: "Acrocity/GRAP等をAWS基盤で提供。ガバメントクラウド対応推進中（採用情報・公式）。【出典: Gcom公式採用情報 ※コストレンジは独自調査・参考値】",
  },
  電算: {
    ratioMin: 1.1, ratioMax: 1.8, ratioTypical: 1.4,
    mark: "◎", markColor: "#007a3d", cloud: "AWS",
    note: "Reams（総合行政情報システム）をAWSガバメントクラウドへ移行。甲信越・北海道中心（芽室町等2026年2月稼働予定）。【出典: 電算公式プレスリリース ※コストレンジは参考値】",
  },
  日立: {
    ratioMin: 1.3, ratioMax: 2.2, ratioTypical: 1.6,
    mark: "○", markColor: "#1d6fa4", cloud: "AWS",
    note: "ADWORLD全20業務AWS対応。大規模自治体向け。【出典: 日立システムズ（2024/8） ※コストレンジは独自調査・参考値】",
  },
};

// ISR: コストデータは週次更新のため1時間キャッシュで十分
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ガバメントクラウド移行コスト分析【ベンダー別比較】| ガバメントクラウド移行状況ダッシュボード",
  description:
    "ガバメントクラウド移行コストが当初比+156%（複数調査の編集部集計・参考値）になる実態をベンダー別に分析。TKC・富士通・NEC・日立などのコスト指数と費用対効果を比較。自治体のコスト削減・FinOps実践に活用。",
  openGraph: {
    title: "ガバメントクラウド移行コスト分析",
    description:
      "移行コストが当初比+156%（編集部推計・参考値）。ベンダー別コスト比較と費用対効果を可視化。",
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
    detail: "OCI（Oracle Cloud）採用。円建て課金でコスト効率に優れる。データ転送料が月10TBまで無料で利用料が安価。札幌市が2025年4月に32業務のOCI移行を発表（RKKCS公式・日本オラクル）",
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
    label: "AWS＋自社クラウド○",
    detail: "WizLIFEはAWS対応。自社クラウド「Jip-Base」（自治体専用）も提供（JIP公式）",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  "行政S": {
    label: "AWS検証済○",
    detail: "デジタル庁令和5年度検証事業でAWS上検証実施（2024/9報告）。共同利用・マルチベンダー連携対応",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
  "京都GIS": {
    label: "接続基盤（AWS基本）",
    detail: "京都GC接続サービス（2024/7〜）。AWSへの専用回線接続が基本。OCI/Azure/GCPもサポート。接続基盤提供",
    mark: "○", markColor: "#1d6fa4", cloud: "AWS", confirmed: true,
  },
};


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
      supabase.from("vendors").select("id, name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count, notes").order("name"),
      supabase
        .from("municipality_packages")
        .select("municipality_id, municipalities(city, prefecture), packages(vendor_id, cloud_platform, vendors(id, short_name, name, cloud_platform))")
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

  const muniMap: Record<number, {
    city: string;
    prefecture: string;
    vendorCounts: Record<string, number>;
    cloudCounts: Record<string, number>;
  }> = {};
  for (const row of muniPkgData) {
    const mid = row.municipality_id;
    const city = row.municipalities?.city ?? "不明";
    const prefecture = row.municipalities?.prefecture ?? "";
    const vendorShort = row.packages?.vendors?.short_name ?? row.packages?.vendors?.name ?? "不明";
    const packageCloud = row.packages?.cloud_platform ?? row.packages?.vendors?.cloud_platform ?? null;
    if (!muniMap[mid]) muniMap[mid] = { city, prefecture, vendorCounts: {}, cloudCounts: {} };
    muniMap[mid].vendorCounts[vendorShort] = (muniMap[mid].vendorCounts[vendorShort] ?? 0) + 1;
    if (packageCloud) {
      muniMap[mid].cloudCounts[packageCloud] = (muniMap[mid].cloudCounts[packageCloud] ?? 0) + 1;
    }
  }

  function getMainCloud(
    cloudCounts: Record<string, number>,
    fallback: string
  ): string {
    const entries = Object.entries(cloudCounts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return fallback;
    if (entries.length === 1) return entries[0][0];
    const [firstCloud, firstCount] = entries[0];
    const secondCount = entries[1]?.[1] ?? 0;
    if (firstCount === secondCount) return "混在";
    return firstCloud;
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
      cloud: est?.cloud ?? getMainCloud(info.cloudCounts, "調査中"),
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

  function getGroupCloudLabel(items: MuniCostEstimate[], fallback: string): string {
    const uniqueClouds = [...new Set(items.map((item) => item.cloud).filter(Boolean))];
    if (uniqueClouds.length === 0) return fallback;
    if (uniqueClouds.length === 1) return uniqueClouds[0];
    return "混在";
  }

  // 最小・最大・平均
  const ratios = costs.map((c) => c.change_ratio).filter((r) => r != null);
  const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
  const minRatio = ratios.length > 0 ? Math.min(...ratios) : null;
  const maxRatio = ratios.length > 0 ? Math.max(...ratios) : null;

  // サマリー数値
  const avgPct = avgRatio != null ? Math.round((avgRatio - 1) * 100) : 156;
  const worstPct = maxRatio != null ? Math.round((maxRatio - 1) * 100) : 470;

  return (
    <div className="space-y-6">
      {/* パンくず + ページヘッダー */}
      <Breadcrumb items={[{ label: "コスト効果分析" }]} />
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">コスト効果分析</h1>
        <p className="page-subtitle">
          標準化移行に伴うコスト変化を、実績と比較表で整理
        </p>
      </div>

      {/* ⑦ コストギャップ */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--color-gov-primary)" }}>
          目標と実態のギャップ
        </h2>

        {/* ブレットチャート — 左端=0、目標ライン縦点線 */}
        {(() => {
          const MAX = 5.7;
          const TARGET_RATIO = (1.0 / MAX) * 100; // 移行前基準（100）位置(%)
          const rows = [
            { label: "当初目標", mult: 0.7, color: "#10B981", pct: "−30%" },
            { label: "実態平均", mult: 2.3, color: "#EF4444", pct: `+${avgPct}%` },
            { label: "最悪事例", mult: 5.7, color: "#7f1d1d", pct: `+${worstPct}%` },
          ];
          return (
            <div className="mt-3 space-y-4">
              {rows.map((row) => {
                const barW = (row.mult / MAX) * 100;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-20 flex-shrink-0 text-xs font-medium text-gray-600 text-right">{row.label}</span>
                    <div className="relative flex-1 h-7">
                      {/* 背景トラック */}
                      <div className="absolute inset-0 bg-gray-100 rounded" />
                      {/* バー */}
                      <div
                        className="absolute left-0 top-0 h-full rounded"
                        style={{ width: `${barW}%`, backgroundColor: row.color, opacity: 0.85 }}
                      />
                      {/* 目標ライン（overflow外に伸ばす） */}
                      <div
                        className="absolute"
                        style={{ left: `${TARGET_RATIO}%`, top: "-6px", bottom: "-6px", borderLeft: "2px dashed #1f2937", zIndex: 10 }}
                      />
                    </div>
                    <div className="w-32 flex-shrink-0 flex items-baseline gap-1">
                      <span className="text-base font-extrabold tabular-nums" style={{ color: row.color }}>{row.pct}</span>
                      <span className="text-[11px] text-gray-400">({row.mult}×)</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pl-[92px] pt-1">
                <div style={{ borderLeft: "2px dashed #374151", height: "14px", marginRight: "4px" }} />
                <span className="text-[11px] text-gray-500">移行前コスト基準（= 100）</span>
              </div>
              <p className="text-[11px] text-gray-400 pl-[92px]">出典: デジタル庁・中核市市長会調査</p>
            </div>
          );
        })()}
      </div>

      {/* コスト内訳（増加・減少項目） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-1">
          コスト内訳（増加・減少項目）
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          出典: デジタル庁資料、内閣官房資料、中核市市長会調査
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-5">
          {/* 増加する経費 */}
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
            <h3 className="text-xs font-bold text-red-700 mb-3 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-red-500"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              増加する経費
            </h3>
            <div className="space-y-2.5">
              {[
                { name: "クラウド利用料", desc: "計算資源・ストレージ費用。為替・物価上昇の影響を受けやすい" },
                { name: "クラウド接続回線費", desc: "閉域網・冗長回線の新設。既存回線費に上積みされる新規コスト" },
                { name: "クラウド運用費", desc: "クラウド対応要員確保・教育・賃上げで単価が上がりやすい" },
                { name: "ガバナンス・セキュリティ費", desc: "監査・設定管理・インシデント対応に伴う追加費用" },
                { name: "ソフトウェア借料・保守費", desc: "ミドルウェア・DBライセンス等、クラウド未最適化のまま移行した場合に増加", note: true },
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700">↑</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">{item.desc}</p>
                    {"note" in item && item.note && (
                      <p className="text-[10px] text-orange-500 mt-0.5">※ 標準化パッケージ（ASP）自体の費用は移行前と大きく変わらないケースが多い</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 減少する経費 */}
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4">
            <h3 className="text-xs font-bold text-green-700 mb-3 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-500"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              減少する経費
            </h3>
            <div className="space-y-2.5">
              {[
                { name: "ハードウェア借料・保守費", desc: "共同利用基盤への移行で削減しやすい項目" },
                { name: "データセンター利用費", desc: "自前設備の縮小で削減しやすい項目" },
                { name: "システム運用費", desc: "標準化・共同利用化で運用の一部を委託できるため削減余地あり" },
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-2">
                  <span className="flex-shrink-0 mt-0.5 px-1 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">↓</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-[11px] text-green-700 font-medium">
                ※ 増加項目の方が多く、先行8地域中5地域で移行後コスト増が確認されています。
              </p>
            </div>
          </div>
        </div>

        {/* 人口規模別コスト目安 */}
        <h3 className="text-sm font-bold text-gray-700 mb-2">人口規模別コスト変化の目安</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-600 border-b">自治体規模</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 border-b">移行前（年間）</th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 border-b">移行後変化</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 border-b">出典</th>
              </tr>
            </thead>
            <tbody>
              {[
                { scale: "小規模町村（〜1万人）", before: "数千万〜1億円", change: "3〜5倍以上", color: "text-red-600", source: "先行事業検証" },
                { scale: "中小市（5〜10万人）", before: "1〜2億円", change: "2〜4倍", color: "text-red-600", source: "富山県14市町村" },
                { scale: "中核市（20〜50万人）", before: "平均3.4億円", change: "平均2.3倍", color: "text-orange-600", source: "中核市市長会" },
                { scale: "政令市・大都市", before: "数十億円規模", change: "1.5〜1.7倍", color: "text-yellow-600", source: "東京都調査" },
              ].map((row) => (
                <tr key={row.scale} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-800">{row.scale}</td>
                  <td className="py-2 px-3 text-right text-gray-600">{row.before}</td>
                  <td className={`py-2 px-3 text-center font-bold ${row.color}`}>{row.change}</td>
                  <td className="py-2 px-3 text-gray-400">{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          ※ 小規模団体ほど固定費の影響が重くなりやすい傾向があります。
        </p>

        {/* 公式資料リンク */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-[11px] font-semibold text-gray-500 mb-2">公式資料</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "運用経費対策（デジタル庁）", url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c58162cb-92e5-4a43-9ad5-095b7c45100c/dc96d895/20250613_policies_local_governments_doc_02.pdf" },
              { label: "内閣官房WT資料", url: "https://www.cas.go.jp/jp/seisaku/digital_gyozaikaikaku/kyotsuwt3/siryou6.pdf" },
              { label: "投資対効果検証（2022年）", url: "https://www.digital.go.jp/assets/contents/node/information/field_ref_resources/8c953d48-271d-467e-8e4c-f7baa8ec018b/4912aad2/20220914_news_local_governments_outline_03.pdf" },
            ].map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded border border-gray-200 text-blue-600 hover:bg-blue-50 transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ⑧ コスト変化実績（展開可能カード） */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          コスト変化実績
        </h2>
        <p className="text-xs mb-4 flex items-center gap-2 flex-wrap" style={{ color: "var(--color-text-muted)" }}>
          移行前を基準に増減率・出典を整理しています。
          <SourceAttribution sourceIds={["digital-cho-senkou-tco", "chukakushi-survey-2025"]} variant="inline" />
        </p>

        {costs.length === 0 ? (
          <p className="text-sm text-gray-400">データがありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2 px-3 text-xs text-gray-400 font-medium w-16"></th>
                  <th className="text-left py-2 px-3 text-xs text-gray-400 font-medium">対象・出典</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-400 font-medium">変化率</th>
                  <th className="py-2 px-3 text-xs text-gray-400 font-medium w-32 hidden sm:table-cell"></th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => {
                  const isReduction = cost.change_ratio < 1.0;
                  const pctChange = Math.abs((cost.change_ratio - 1) * 100);
                  const barColor = isReduction ? "#007a3d" : cost.change_ratio >= 3.0 ? "#7f1d1d" : cost.change_ratio >= 1.5 ? "#EF4444" : "#d97706";
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
                      sourceUrl={cost.source_url}
                      reportedYear={cost.reported_year}
                      barWidth={barWidth}
                      barColor={barColor}
                      label={label}
                      isReduction={isReduction}
                      pctChange={pctChange}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-green-600" />削減（−%）</div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block bg-red-600" />増加（+%）</div>
          <span className="text-gray-400">縦線 = 変化なし基準（0%）</span>
        </div>
      </div>

      {/* ベンダー別コスト評価（カード表示） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4">
          ベンダー別コスト評価
        </h2>
        <div className="space-y-2">
          {vendors
            .slice()
            .sort((a, b) => (b.municipality_count ?? 0) - (a.municipality_count ?? 0))
            .filter((v) => !["NTT西日本", "京都GIS", "SBS情報S", "北日本CS"].includes(v.short_name ?? v.name))
            .slice(0, 5)
            .map((vendor) => {
              const shortName = vendor.short_name ?? vendor.name;
              const evalData = vendorEvaluations[shortName];
              return (
                <VendorCard
                  key={shortName}
                  vendorName={shortName}
                  cloud={evalData?.cloud ?? vendor.cloud_platform ?? "—"}
                  mark={evalData?.mark ?? "—"}
                  markColor={evalData?.markColor ?? "#9ca3af"}
                  label={evalData?.label ?? ""}
                  detail={evalData?.detail ?? ""}
                />
              );
            })}
        </div>
      </div>

      {/* デジタル庁コスト管理ガイド */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 px-6 py-4">
        <h3 className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          デジタル庁コスト管理・FinOps動向
        </h3>
        <ul className="space-y-1.5 text-xs text-blue-700">
          <li className="flex items-start gap-1.5">
            <span className="flex-shrink-0 mt-0.5">•</span>
            <span><span className="font-semibold">運用経費見積チェックリスト</span>: 費用漏れを防ぐ確認項目が公開済み。</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="flex-shrink-0 mt-0.5">•</span>
            <span><span className="font-semibold">FinOpsガイド策定中</span>: 運用最適化の標準化が進められています。</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="flex-shrink-0 mt-0.5">•</span>
            <span><span className="font-semibold">東京都+178億円/年</span>: コスト超過が全国規模の政策課題になっています。</span>
          </li>
        </ul>

        <div className="mt-4 rounded-lg border border-blue-200 bg-white/70 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">特設: 移行済み最適化と未移行見直し</p>
            <p className="text-xs text-slate-600">運用最適化と基盤再選定を分けて整理しています。</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/cost-reduction"
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: "#1d4ed8", color: "#ffffff", textDecoration: "none" }}
            >
              コスト削減特設を見る
            </Link>
            <Link
              href="/report?from=costs"
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: "#ffffff", color: "#1d4ed8", border: "1px solid #93c5fd", textDecoration: "none" }}
            >
              無料レポートを受け取る
            </Link>
          </div>
        </div>
      </div>

      {/* 注記 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400">
          ※ コスト比率は移行前=1.0基準。判明分のみ集計。
        </p>
      </div>

      {/* 令和7年度補正予算 */}
      <div
        className="rounded-lg border border-blue-200 bg-blue-50/50 px-5 py-4"
      >
        <p className="text-xs font-bold text-blue-800 mb-1">令和7年度補正予算（支援措置）</p>
        <p className="text-xs text-blue-700 leading-relaxed">
          地方公共団体情報システム運用最適化支援事業として、補助対象経費 <strong>700億円</strong>、国費 <strong>350億円</strong> が計上されています。
        </p>
      </div>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.costs} pageId="costs" />

      <ReportLeadCta
        source="costs"
        compact
        title="コスト比較の背景をPDFでまとめて確認"
        description="ベンダー別の見方だけでなく、進捗や遅延構造まで含めて無料レポートで確認できます。"
      />


      <PageNavCards exclude="/costs" />
      <RelatedArticles cluster={CLUSTERS.cost} />
    </div>
  );
}
