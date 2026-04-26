import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, Home, DollarSign, Info, Cloud, Code2, Database, BarChart3, LayoutTemplate, FileText, ClipboardCheck } from "lucide-react";
import PdfCTAButton from "@/components/PdfCTAButton";
import { CostReport, Vendor } from "@/lib/supabase";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import ReportLeadCta from "@/components/ReportLeadCta";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import { ExpandableCostCard } from "./CostClientComponents";
import Breadcrumb from "@/components/Breadcrumb";

// ベンダー別コスト変化推定レンジ（公開TCO調査・先行事業報告から）
// 出典: デジタル庁先行事業TCO検証・中核市市長会調査・総務省地方財政調査
// + 令和6年度 共同利用方式の推進及びマルチベンダーにおけるシステム間連携の検証事業 報告書（2026年3月27日公開）
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
    note: "ADWORLD全20業務AWS対応。大規模自治体向け。※令和6年度ベンダー検証事業には不参加。【出典: 日立システムズ（2024/8） ※コストレンジは独自調査・参考値】",
  },
};

// ISR: コストデータは週次更新のため1時間キャッシュで十分
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ガバメントクラウド移行コストは本当に削減できるか？自治体別試算と削減策【2026年最新】｜GCInsight",
  description:
    "政府目標−30%に対し実態は平均+156%（中核市市長会調査）。R6検証事業8団体データ・ベンダー別コスト比較（TKC/RKKCS/富士通/NEC）・ネットワーク費・SaaS構築費の費用内訳を公開。自治体規模別の削減策付き。",
  openGraph: {
    title: "ガバメントクラウド移行コスト分析【2026年最新】",
    description:
      "政府目標−30%→実態+156%。R6検証8団体データ・ベンダー別コスト比較・費用内訳を自治体規模別に公開。",
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
        .order("change_ratio", { ascending: false }),
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

  const costFaqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "ガバメントクラウド移行後、コストはどのくらい増加しますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "中核市市長会の調査によると、移行後の運用経費は移行前と比べて平均2.3倍に増加しています。最大で5.7倍になった事例も報告されており、5割以上の自治体で2倍以上のコスト増が見込まれています。",
        },
      },
      {
        "@type": "Question",
        name: "ベンダーによってコストに差はありますか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "大きな差があります。RKKCSのOCI基盤は円建て課金でコスト増1.0〜1.5倍、TKCは共同利用方式で1.1〜1.6倍と低コスト。一方、富士通MICJETは1.5〜3.0倍、NEC・日立は1.3〜2.5倍と、AWS基盤かつ大規模カスタマイズの場合にコスト増が大きくなる傾向があります。",
        },
      },
      {
        "@type": "Question",
        name: "コスト増加の主な原因は何ですか？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "主要因は3つです。(1)クラウド利用料（AWS寡占97%で価格競争が働かない）、(2)回線費・通信費（庁内LAN→東京リージョン集約に伴う費用増）、(3)移行期間中のオンプレとクラウドの二重運用コストです。",
        },
      },
    ],
  };

  return (
    <div className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(costFaqJsonLd) }} />
      {/* パンくず + ページヘッダー */}
      <Breadcrumb items={[{ label: "コスト効果分析" }]} />
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">ガバメントクラウド移行コスト分析</h1>
        <p className="page-subtitle">
          先行8自治体の実測データで分かる移行コストの実態と削減策
        </p>
        {/* ヒーローKPIバー — 目標vs実態の対比を強調 */}
        <div className="mt-4 space-y-2" role="region" aria-label="コスト変化サマリー">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 bg-green-50 border border-green-200 flex flex-col gap-1">
              <span className="text-2xl sm:text-3xl font-black tabular-nums text-green-600 leading-none">−30%</span>
              <span className="text-xs text-green-700 leading-tight">政府目標（R4）</span>
            </div>
            <div className="rounded-xl p-3 bg-red-50 border border-red-200 flex flex-col gap-1">
              <span className="text-2xl sm:text-3xl font-black tabular-nums text-red-600 leading-none">+{avgPct}%</span>
              <span className="text-xs text-red-700 leading-tight">実態平均（中核市）</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
            <span>最悪事例:</span>
            <span className="font-bold tabular-nums text-red-900">+{worstPct}%</span>
            <span>（個別報告）</span>
          </div>
        </div>
      </div>

      {/* ページナビ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            label: "全体像を知る",
            desc: "目標と実態のギャップ",
            href: "#cost-gap",
            icon: <LayoutGrid size={16} className="text-gray-500" aria-hidden="true" />,
          },
          {
            label: "団体別データ",
            desc: "R6検証事業 8団体",
            href: "#r6-verification",
            icon: <Home size={16} className="text-gray-500" aria-hidden="true" />,
          },
          {
            label: "費用按分",
            desc: "4方式・R6検証より",
            href: "#cost-allocation",
            icon: <DollarSign size={16} className="text-gray-500" aria-hidden="true" />,
          },
          {
            label: "対策を知る",
            desc: "FinOps・最適化",
            href: "#cost-measures",
            icon: <Info size={16} className="text-gray-500" aria-hidden="true" />,
          },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span>
              <span className="block text-xs font-semibold text-gray-800 leading-tight">{item.label}</span>
              <span className="block text-xs text-gray-500 leading-tight mt-0.5">{item.desc}</span>
            </span>
          </a>
        ))}
      </div>
      <PdfCTAButton
        className="block text-xs text-blue-600 hover:text-blue-800 transition text-right"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, width: "100%" }}
      >
        PDFでまとめて確認 →
      </PdfCTAButton>

      {/* ⑦ コストギャップ */}
      <div id="cost-gap" className="card p-5">
        <h2 className="text-sm font-bold mb-4" style={{ color: "var(--color-gov-primary)" }}>
          目標と実態のギャップ
        </h2>

        {/* ブレットチャート — 左端=0、目標ライン縦点線 */}
        {(() => {
          const MAX = 5.7;
          const TARGET_RATIO = (1.0 / MAX) * 100; // 移行前基準（100）位置(%)
          const rows = [
            { label: "当初目標", mult: 0.7, color: "#10B981", pct: "−30%", source: "政府目標（R4）", sourceCls: "bg-blue-100 text-blue-700" },
            { label: "実態平均", mult: 2.3, color: "#EF4444", pct: `+${avgPct}%`, source: "中核市市長会（R7.1）", sourceCls: "bg-gray-100 text-gray-600" },
            { label: "最悪事例", mult: 5.7, color: "#7f1d1d", pct: `+${worstPct}%`, source: "個別報告", sourceCls: "bg-amber-100 text-amber-700" },
          ];
          return (
            <div
              className="mt-3 space-y-4"
              role="img"
              aria-label={`コスト比較チャート: 政府目標−30%（0.7×）、実態平均+${avgPct}%（2.3×）、最悪事例+${worstPct}%（5.7×）`}
            >
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
                    <div className="w-32 flex-shrink-0 flex flex-col items-end gap-0.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold tabular-nums" style={{ color: row.color }}>{row.pct}</span>
                        <span className="text-xs text-gray-400">({row.mult}×)</span>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium leading-none ${row.sourceCls}`}>{row.source}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pl-[92px] pt-1">
                <div style={{ borderLeft: "2px dashed #374151", height: "14px", marginRight: "4px" }} />
                <span className="text-xs text-gray-500">移行前コスト基準（= 100）</span>
              </div>
              <p className="text-xs text-gray-400 pl-[92px]">出典: デジタル庁 R6検証事業・中核市市長会「ガバメントクラウド移行に関するアンケート調査」（令和7年1月）</p>
            </div>
          );
        })()}

        {/* 費用項目別内訳 */}
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-3">コスト増加の主な費用項目</p>
          <div className="space-y-2">
            {[
              {
                label: "クラウド利用料",
                pct: "約40〜50%",
                color: "#EF4444",
                note: "AWS寡占97%で価格競争が働きにくい。EC2・RDS・S3等の合計。Reserved Instance活用で削減余地あり。",
              },
              {
                label: "ネットワーク・回線費",
                pct: "約20〜30%",
                color: "#F97316",
                note: "庁内LAN→東京/大阪リージョン集約に伴うWAN回線増強費。移行後も発生し続ける固定費。",
              },
              {
                label: "SaaS構築・カスタマイズ費",
                pct: "約15〜25%",
                color: "#EAB308",
                note: "標準仕様に合わせたシステム改修・データ移行・テスト費用。自治体固有の業務フローで膨らみやすい。",
              },
              {
                label: "運用保守費（人件費含む）",
                pct: "約10〜20%",
                color: "#6B7280",
                note: "クラウド運用の専門人材不足により外部委託コストが増加。移行期間中はオンプレとの二重運用も発生。",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: item.color }}>{item.pct}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-3">※ 比率は中核市市長会調査・デジタル庁R6検証事業・総務省地方財政調査をもとにした推計。自治体規模・ベンダーにより大きく異なる。</p>
        </div>
      </div>

      {/* コスト変化実績（カード形式） */}
      <div id="cost-records" className="card p-5">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-gov-primary)" }}>
          コスト変化実績
        </h2>
        {costs.length > 0 ? (
          <table className="w-full border-collapse">
            <tbody>
              {costs.map((c) => {
                const ratio = c.change_ratio ?? 1;
                const pctChange = Math.round((ratio - 1) * 100);
                const isReduction = pctChange < 0;
                const barColor = isReduction ? "#10B981" : pctChange > 100 ? "#991B1B" : "#EF4444";
                const vendorName = c.vendors?.short_name ?? c.vendors?.name ?? "—";
                return (
                  <ExpandableCostCard
                    key={c.id}
                    scope={scopeToJapanese(c.scope)}
                    changeRatio={ratio}
                    vendorName={vendorName}
                    notes={c.notes}
                    sourceUrl={c.source_url}
                    reportedYear={c.reported_year}
                    barWidth={getBarWidth(ratio)}
                    barColor={barColor}
                    label={getRatioLabel(ratio)}
                    isReduction={isReduction}
                    pctChange={pctChange}
                  />
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-gray-400">データ読み込み中…</p>
        )}
        {/* クラウド基盤別コスト傾向（インライン）— /cloudへのQuickBack防止 */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">クラウド基盤別 コスト傾向まとめ</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                cloud: "AWS",
                share: "97%",
                costRange: "+1.3〜3.0倍",
                badge: "bg-orange-100 text-orange-700",
                note: "シェア最大。価格競争が働きにくく割高になりやすい。富士通/NEC/日立が主力。",
              },
              {
                cloud: "OCI（Oracle）",
                share: "〜2%",
                costRange: "+1.0〜1.5倍",
                badge: "bg-red-100 text-red-700",
                note: "円建て課金・データ転送10TB/月無料。RKKCS採用。札幌市32業務（2025年4月）。",
              },
              {
                cloud: "さくら・国内",
                share: "〜1%",
                costRange: "試算中",
                badge: "bg-purple-100 text-purple-700",
                note: "2026年に政府認定取得済み。競合圧力による価格抑制効果に期待。",
              },
            ].map((item) => (
              <div key={item.cloud} className="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badge}`}>{item.cloud}</span>
                  <span className="text-[10px] text-gray-400">シェア {item.share}</span>
                </div>
                <p className="text-xs font-bold text-gray-800 mb-0.5">コスト比 {item.costRange}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* R6検証事業 団体別コスト比較（図解） */}
      <div id="r6-verification" className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-gov-primary)" }}>
            R6検証事業 — 8団体のコスト比較
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">2026年3月27日公開</span>
        </div>

        {/* サマリー帯 */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex-shrink-0 text-center">
            <p className="text-2xl font-black text-red-600">+8.0%</p>
            <p className="text-xs text-gray-500">8団体・金額加重平均</p>
            <p className="text-xs text-gray-400">49.80億→53.77億（+3.97億）</p>
            <p className="text-xs mt-1 px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: "#fef9c3", color: "#854d0e" }}>推奨構成適用の好条件団体</p>
          </div>
          <div className="h-10 w-px bg-gray-300" />
          <div className="text-xs text-gray-600 leading-relaxed">
            現行システム継続（<span className="font-semibold text-gray-700">コストA</span>）vs ガバクラ移行＋推奨構成（<span className="font-semibold text-blue-600">コストB</span>）の<strong>5年間ランニングコスト</strong>比較。削減できたのは<span className="text-green-600 font-semibold">盛岡市・佐倉市の2団体のみ</span>
          </div>
        </div>

        {/* データ差異の説明 */}
        <div className="rounded-xl border border-amber-200 p-4 mb-4" style={{ backgroundColor: "#fffbeb" }}>
          <p className="text-sm font-bold mb-3 text-center" style={{ color: "#92400e" }}>
            なぜ数字がこんなに違うのか？
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: "計測対象", r6: "好条件8団体", survey: "59市の実態" },
              { label: "コスト範囲", r6: "ランニングのみ", survey: "移行費込み" },
              { label: "比較基準", r6: "現行継続との比較", survey: "移行前実費との比較" },
            ].map(({ label, r6, survey }) => (
              <div key={label} className="rounded-lg p-2 text-center" style={{ backgroundColor: "#fff8ed" }}>
                <p className="text-[11px] font-bold mb-1.5" style={{ color: "#92400e" }}>{label}</p>
                <div className="space-y-1">
                  <div className="rounded px-1 py-0.5" style={{ backgroundColor: "#dbeafe" }}>
                    <p className="text-[10px] font-semibold text-blue-700">R6検証</p>
                    <p className="text-[10px] text-blue-600 leading-tight">{r6}</p>
                  </div>
                  <div className="rounded px-1 py-0.5" style={{ backgroundColor: "#fee2e2" }}>
                    <p className="text-[10px] font-semibold text-red-700">中核市調査</p>
                    <p className="text-[10px] text-red-600 leading-tight">{survey}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* バーチャート — 団体別増減率 */}
        <div className="space-y-2 mb-5">
          {[
            { name: "美里町・川島町", pop: "1〜1.8万", env: "自治体クラウド", csp: "AWS", costA: 2.25, costB: 3.39, rate: 51.0 },
            { name: "宇和島市", pop: "6.5万", env: "DCハード共用", csp: "AWS+OCI", costA: 4.07, costB: 5.19, rate: 27.5 },
            { name: "せとうち3市", pop: "47〜51万", env: "自治体クラウド", csp: "AWS", costA: 6.27, costB: 7.88, rate: 25.6 },
            { name: "神戸市", pop: "149万", env: "DC単独", csp: "AWS", costA: 9.94, costB: 11.73, rate: 18.0 },
            { name: "須坂市", pop: "4.8万", env: "DCハード共用", csp: "AWS", costA: 4.87, costB: 5.10, rate: 4.6 },
            { name: "佐倉市", pop: "16.5万", env: "DC単独", csp: "AWS", costA: 10.69, costB: 10.38, rate: -2.9 },
            { name: "盛岡市", pop: "28万", env: "DC単独", csp: "AWS", costA: 11.71, costB: 10.10, rate: -13.7 },
          ].map((d) => {
            const isDown = d.rate < 0;
            const barWidth = Math.min(Math.abs(d.rate) / 55 * 100, 100);
            const rateColor = isDown ? "text-green-600" : d.rate > 20 ? "text-red-600" : "text-orange-600";
            return (
              <div key={d.name} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 mb-1">
                {/* 行1: 自治体名 + バッジ + 増減率 */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-800 truncate flex-1 min-w-0">{d.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 whitespace-nowrap ${
                    d.csp === "AWS" ? "bg-orange-100 text-orange-700"
                    : d.csp === "AWS+OCI" ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                  }`}>{d.csp}</span>
                  <span className={`text-sm font-black tabular-nums flex-shrink-0 ${rateColor}`}>
                    {isDown ? "" : "+"}{d.rate}%
                  </span>
                </div>
                {/* 行2: バー（増加=左から右、削減=右から左） */}
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden mb-1.5 relative">
                  <div
                    className={`h-full rounded-full absolute top-0 left-0 ${isDown ? "bg-green-400" : d.rate > 20 ? "bg-red-400" : "bg-orange-300"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                {/* 行3: 人口 + 金額 */}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>人口 {d.pop}</span>
                  <span className="tabular-nums">{d.costA}→{d.costB}億</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 出典・補足 */}
        <p className="text-xs text-gray-500 mt-1">
          ※ +8%はデジ庁R6検証（好条件8団体・推奨構成適用後）、2.3倍は中核市市長会調査（62市・対策なし）で条件が異なります。
        </p>
        <p className="text-xs text-gray-400 mt-1">
          出典: デジタル庁「令和6年度ガバメントクラウド早期移行団体検証事業 報告書」（令和8年3月27日公開）/ 中核市市長会調査（令和7年1月）
        </p>
      </div>

      {/* 費用按分・ベンダー・最適化 */}
        {/* 費用按分方式の比較 — 縦リスト */}
        <div id="cost-allocation" className="card p-5">
          <h3 className="text-sm font-bold mb-0.5" style={{ color: "var(--color-text-primary)" }}>
            共同利用の費用 — どう割り勘するか？
          </h3>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
            複数自治体でクラウドを共同利用する際、費用をどう按分するかが課題。R6検証事業（20社参画）で4手法が検証された。
          </p>

          {/* 主流方式 */}
          <div className="rounded-lg p-3 border-2 border-blue-300 bg-blue-50 mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">主流</span>
              <span className="text-xs font-bold text-blue-800">カスタムスコア按分</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs mb-1">
              <span className="text-green-700">✓ 規模に応じた公平な負担</span>
              <span className="text-red-500">✕ スコア合意形成が必要</span>
            </div>
            <p className="text-xs text-gray-400">TKC（人口7：業務量3）、内田洋行</p>
          </div>

          {/* 他の手法 — コンパクトリスト */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-100">
            {[
              { method: "利用状況按分", merit: "実利用に基づく合理的配分", demerit: "測定が複雑・運用負荷高" },
              { method: "均等按分", merit: "算定がシンプル", demerit: "小規模自治体に割高" },
              { method: "他環境コスト按分", merit: "既存比率を流用でき導入容易", demerit: "ガバクラ固有構造を反映しにくい" },
            ].map((item) => (
              <div key={item.method} className="px-3 py-2 flex items-start gap-2">
                <span className="text-xs font-semibold text-gray-600 w-28 flex-shrink-0">{item.method}</span>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                  <span className="text-green-700">✓ {item.merit}</span>
                  <span className="text-red-400">✕ {item.demerit}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            出典: 令和6年度 共同利用方式の推進及びマルチベンダーにおけるシステム間連携の検証事業 報告書 p.9
          </p>
        </div>

        {/* R6検証事業 参画ベンダー — 検証テーマ別 */}
        <div id="vendor-participation" className="mt-4 card p-5">
          <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
            R6検証事業 参画ベンダー（20社）— 検証テーマ別
          </h3>
          <div className="space-y-3">
            {[
              {
                theme: "共同利用",
                color: "#1d4ed8",
                bg: "#eff6ff",
                border: "#bfdbfe",
                vendors: ["TKC", "富士通", "Gcom", "JIP", "シンク", "HARP", "RKKCS", "電算"],
              },
              {
                theme: "費用按分",
                color: "#92400e",
                bg: "#fffbeb",
                border: "#fde68a",
                vendors: ["TKC", "内田洋行"],
              },
              {
                theme: "技術深掘",
                color: "#5b21b6",
                bg: "#f5f3ff",
                border: "#ddd6fe",
                vendors: ["NEC", "NTTデータ", "RKKコンピューターサービス", "GCC"],
              },
              {
                theme: "マルチCSP",
                color: "#065f46",
                bg: "#ecfdf5",
                border: "#a7f3d0",
                vendors: ["アイネス", "NECネクサソリューションズ", "日本コンピューター"],
              },
              {
                theme: "環境構築・運用",
                color: "#374151",
                bg: "#f9fafb",
                border: "#e5e7eb",
                vendors: ["SCC", "AGS", "両備システムズ", "さくらインターネット"],
              },
            ].map((group) => (
              <div key={group.theme} className="flex items-start gap-3">
                <span className="text-xs font-semibold whitespace-nowrap mt-0.5 w-28 flex-shrink-0" style={{ color: group.color }}>{group.theme}</span>
                <div className="flex flex-wrap gap-1.5">
                  {group.vendors.map((v) => (
                    <span key={v} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: group.bg, border: `1px solid ${group.border}`, color: group.color }}>{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            出典: デジタル庁「令和6年度 共同利用方式検証事業 成果報告書」2026年3月27日
          </p>
        </div>

        {/* クラウド最適化の知見 */}
        <div className="mt-4 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
              ガバメントクラウド コスト最適化の知見（R6検証事業）
            </h3>
            <a href="/articles?tag=finops" className="text-xs font-medium no-underline hover:underline flex-shrink-0" style={{ color: "var(--color-brand-primary)" }}>
              詳細コラムを読む →
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                label: "サーバーレス化",
                desc: "Lambda/Fargate等のサーバーレスサービスにより、EC2比でコスト優位性を確認。特にバッチ処理で効果大",
                icon: <Cloud size={14} aria-hidden="true" />,
              },
              {
                label: "IaC構築効率化",
                desc: "Terraform/CloudFormation等でインフラをコード管理。構築工数を大幅削減し、環境複製も容易に",
                icon: <Code2 size={14} aria-hidden="true" />,
              },
              {
                label: "マネージドサービス活用",
                desc: "RDS/Aurora等のマネージドDBにより運用負荷とコストを最適化。パッチ適用・バックアップの自動化",
                icon: <Database size={14} aria-hidden="true" />,
              },
              {
                label: "FinOpsダッシュボード",
                desc: "コスト可視化ダッシュボードで日次モニタリング。予算超過の早期検知と最適化サイクルの確立",
                icon: <BarChart3 size={14} aria-hidden="true" />,
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-md bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                    {item.icon}
                  </div>
                  <p className="text-xs font-semibold text-gray-800">{item.label}</p>
                </div>
                <p className="text-xs leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 公式資料リンク */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-500 mb-2">公式資料</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* デジタル庁資料 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <LayoutTemplate size={9} aria-hidden="true" />
                デジタル庁資料
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "運用経費対策（デジタル庁）", url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c58162cb-92e5-4a43-9ad5-095b7c45100c/dc96d895/20250613_policies_local_governments_doc_02.pdf" },
                  { label: "内閣官房WT資料", url: "https://www.cas.go.jp/jp/seisaku/digital_gyozaikaikaku/kyotsuwt3/siryou6.pdf" },
                  { label: "投資対効果検証（2022年）", url: "https://www.digital.go.jp/assets/contents/node/information/field_ref_resources/8c953d48-271d-467e-8e4c-f7baa8ec018b/4912aad2/20220914_news_local_governments_outline_03.pdf" },
                ].map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors w-full">
                    <FileText size={10} aria-hidden="true" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            {/* R6検証事業 */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <ClipboardCheck size={9} aria-hidden="true" />
                R6検証事業
              </p>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "R6検証事業報告書（本紙）", url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/92d70acb-8407-4f60-8b45-363d9a2d358d/c71cd4d5/20260327_policies_local_governments_government-cloud-vendor-verification_01.pdf" },
                  { label: "R6検証事業報告書（基礎資料）", url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/92d70acb-8407-4f60-8b45-363d9a2d358d/88ea1822/20260327_policies_local_governments_government-cloud-vendor-verification_03.pdf" },
                ].map((link) => (
                  <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md border border-green-100 bg-green-50 text-green-700 hover:bg-green-100 transition-colors w-full">
                    <FileText size={10} aria-hidden="true" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-400">
          個別の事例データは <a href="#cost-records" className="text-blue-500 hover:underline">コスト変化実績 ↑</a>
        </p>
        <ReportLeadCta source="costs-r6" compact title="R6検証データを含む詳細をまとめて確認" description="8団体の詳細比較とベンダー別の見方をまとめて確認できます。" />
      </div>

      {/* デジタル庁コスト管理ガイド */}
      <div id="cost-measures" className="card p-5">
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          コスト対策 — デジタル庁の支援策
        </h3>
        <ul className="space-y-2 mb-4">
          <li className="flex items-baseline gap-2 text-sm">
            <span className="font-bold text-blue-700 tabular-nums w-16 flex-shrink-0">1.0版</span>
            <span style={{ color: "var(--color-text-secondary)" }}>FinOpsガイド策定済み — RI・右サイジング等を体系化</span>
          </li>
          <li className="flex items-baseline gap-2 text-sm">
            <span className="font-bold text-indigo-700 tabular-nums w-16 flex-shrink-0">33/330</span>
            <span style={{ color: "var(--color-text-secondary)" }}>団体が見積精査支援を利用（チェックリスト公開済み）</span>
          </li>
          <li className="flex items-baseline gap-2 text-sm">
            <span className="font-bold text-gray-500 tabular-nums w-16 flex-shrink-0">交渉中</span>
            <span style={{ color: "var(--color-text-secondary)" }}>CSP各社（AWS・Azure・GCP・OCI）との利用料割引交渉</span>
          </li>
          <li className="flex items-baseline gap-2 text-sm">
            <span className="font-bold text-gray-500 tabular-nums w-16 flex-shrink-0">SaaS化</span>
            <span style={{ color: "var(--color-text-secondary)" }}>個別構築からSaaS共同利用への移行を費用削減策として推進</span>
          </li>
          <li className="flex items-baseline gap-2 text-sm">
            <span className="font-bold text-green-700 tabular-nums w-16 flex-shrink-0">350億円</span>
            <span style={{ color: "var(--color-text-secondary)" }}>令和7年度補正予算 — 運用最適化支援事業（国費350億・補助対象700億）</span>
          </li>
        </ul>
        <Link
          href="/finops"
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "#0f766e", color: "#ffffff", textDecoration: "none" }}
        >
          FinOps コスト最適化ハブ →
        </Link>
      </div>

      {/* 注記 */}
      <p className="text-xs text-gray-400 px-1">
        ※ コスト比率は移行前=1.0基準。判明分のみ集計。全国町村会は2025年4月25日付で「移行前比数倍の増加見込み」として国に財政支援の拡充を要望しています。
      </p>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.costs} pageId="costs" />

      <ReportLeadCta
        source="costs"
        compact
        title="コスト比較の背景をまとめて確認"
        description="ベンダー別の見方だけでなく、進捗や遅延構造まで含めて無料レポートで確認できます。"
      />


      <PageNavCards exclude="/costs" />
      <RelatedArticles cluster={CLUSTERS.cost} />
    </div>
  );
}
