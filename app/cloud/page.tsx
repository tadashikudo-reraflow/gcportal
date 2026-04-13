import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import Breadcrumb from "@/components/Breadcrumb";

// ISR: インフラシェアデータは静的だが念のため1日キャッシュ
export const revalidate = 86400;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "ガバメントクラウドでGCPを使うと割引はありますか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GCP（Google Cloud Platform）ではCommitted Use Discounts（CUD）が適用可能です。Compute Engineリソースへの1年コミットで約37%、3年コミットで約55%の割引となります。ガバメントクラウドはデジタル庁が一括調達するため、自治体は直接GCPと契約せずにこの割引を享受できます。ただしGCPのシェアは全体の約1%未満で、AWS（97%）と比較すると採用自治体は限られています。",
      },
    },
    {
      "@type": "Question",
      name: "ガバメントクラウドでAWSとGCPのコストはどちらが安いですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "自治体標準システム規模でのTCO比較では、GCPはAWSを約10%下回る水準（AWS=100に対しGCP=90）です。ただしOCI（55）やさくら（70）はさらに低コストです。コスト以外の観点では、OCIは全サービス一括割引・円建て請求でFinOps管理がしやすく、さくらは国産で円安リスク・データ主権リスクがありません。",
      },
    },
    {
      "@type": "Question",
      name: "ガバメントクラウドの割引はどのCSPが最もお得ですか？",
      acceptedAnswer: {
        "@type": "Answer",
        text: "割引率だけで見るとAWS（Savings Plans最大55%）とAzure（最大60%）が高水準です。ただしOCIは年間総額コミット型で全サービスに自由配分できるため柔軟性が高く、実質コストはAWSの約55%水準です。さくらは円建て固定のため為替変動リスクがなく予算管理が容易です。自治体調達では割引率だけでなく通貨・コミット形式・データ主権も考慮が必要です。",
      },
    },
  ],
};

export const metadata: Metadata = {
  title: "ガバクラ割引比較（AWS/Azure/GCP/OCI/さくら）コスト・割引モデル徹底比較",
  description: "GCP CUD最大37%・AWS Savings Plans最大55%・OCI全サービス共通割引——ガバメントクラウド認定5CSPの割引率・コスト・データ主権リスクを自治体担当者向けに徹底比較。",
  alternates: { canonical: "/cloud" },
};

// ガバクラ インフラシェア実績（デジタル庁 先行事業調査 令和6年9月）
const INFRA_SHARE = [
  { cloud: "AWS",          systems: 1452, color: "#FF9900" },
  { cloud: "Azure",        systems:   30, color: "#0078D4" },
  { cloud: "Google Cloud", systems:   10, color: "#4285F4" },
  { cloud: "OCI",          systems:    4, color: "#F80000" },
  { cloud: "さくら",       systems:    1, color: "#E2004B" },
];
const INFRA_TOTAL = INFRA_SHARE.reduce((s, v) => s + v.systems, 0);

// クラウド設定
const CLOUD_CONFIG: Record<string, {
  color: string;
  label: string; certYear: number; infraPct: string; costIndex: number;
}> = {
  AWS:    { color: "#FF9900", label: "Amazon Web Services",         certYear: 2021, infraPct: "97%",  costIndex: 100 },
  OCI:    { color: "#F80000", label: "Oracle Cloud Infrastructure", certYear: 2022, infraPct: "<1%",  costIndex: 55  },
  Azure:  { color: "#0078D4", label: "Microsoft Azure",             certYear: 2021, infraPct: "2%",   costIndex: 95  },
  GCP:    { color: "#4285F4", label: "Google Cloud Platform",       certYear: 2021, infraPct: "<1%",  costIndex: 90  },
  Sakura: { color: "#E2004B", label: "さくらインターネット",         certYear: 2026, infraPct: "<1%",  costIndex: 70  },
};
const CLOUD_ORDER = ["AWS", "OCI", "Azure", "GCP", "Sakura"];

type VendorInfo = {
  id: string;
  name: string;
  short_name: string | null;
  municipality_count: number | null;
  multitenancy: boolean | null;
  cloud_confirmed: boolean;
  cloud_platform: string | null;
  notes: string | null;
};

type PackageRow = {
  package_name: string;
  business: string | null;
  cloud_platform: string | null;
  vendors: VendorInfo | null;
};

// cloud → vendor_id → { vendor, packages[] } のネスト構造
type CloudVendorEntry = { vendor: VendorInfo; packages: { package_name: string; business: string | null }[] };

export default async function CloudPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const cloudMap: Record<string, Record<string, CloudVendorEntry>> = {};

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const { data: pkgRows } = await supabase
        .from("packages")
        .select("package_name, business, cloud_platform, vendors(id, name, short_name, municipality_count, multitenancy, cloud_confirmed, notes)")
        .not("cloud_platform", "is", null)
        .order("business");

      if (pkgRows) {
        for (const row of pkgRows as unknown as PackageRow[]) {
          const cp = row.cloud_platform ?? "不明";
          const vendor = row.vendors;
          if (!vendor) continue;
          if (!cloudMap[cp]) cloudMap[cp] = {};
          if (!cloudMap[cp][vendor.id]) cloudMap[cp][vendor.id] = { vendor, packages: [] };
          cloudMap[cp][vendor.id].packages.push({ package_name: row.package_name, business: row.business });
        }
      }
    } catch { /* fallthrough */ }
  }

  // cloud → sorted vendor entries
  const cloudVendors: Record<string, CloudVendorEntry[]> = {};
  for (const [cloud, vendorMap] of Object.entries(cloudMap)) {
    cloudVendors[cloud] = Object.values(vendorMap).sort(
      (a, b) => (b.vendor.municipality_count ?? 0) - (a.vendor.municipality_count ?? 0)
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    <div className="space-y-6">
      {/* パンくず + ページヘッダー */}
      <Breadcrumb items={[{ label: "ガバメントクラウド比較" }]} />
      <div>
        <h1 className="page-title">ガバメントクラウド比較</h1>
        <p className="page-subtitle">認定5CSPの機能・コスト・割引モデルを比較</p>
      </div>

      {/* インフラシェア */}
      <div className="card p-5">
        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>インフラシェア実態</h2>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>本番稼働システム数（2024年10月・デジタル庁調査）</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          {/* ドーナツチャート */}
          <div className="flex-shrink-0">
            <svg width="160" height="160" viewBox="0 0 160 160"
              role="img"
              aria-label={`インフラシェア: ${INFRA_SHARE.map((s) => `${s.cloud} ${((s.systems / INFRA_TOTAL) * 100).toFixed(1)}%`).join("、")}`}
            >
              {(() => {
                const cx = 80, cy = 80, r = 60, strokeW = 24;
                let cumAngle = -90;
                return INFRA_SHARE.map((item) => {
                  const pct = item.systems / INFRA_TOTAL;
                  const angle = pct * 360;
                  const startAngle = cumAngle;
                  cumAngle += angle;
                  const endAngle = cumAngle;
                  const largeArc = angle > 180 ? 1 : 0;
                  const rad = (a: number) => (a * Math.PI) / 180;
                  const x1 = cx + r * Math.cos(rad(startAngle));
                  const y1 = cy + r * Math.sin(rad(startAngle));
                  const x2 = cx + r * Math.cos(rad(endAngle));
                  const y2 = cy + r * Math.sin(rad(endAngle));
                  return (
                    <path
                      key={item.cloud}
                      d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={strokeW}
                      strokeLinecap="butt"
                    />
                  );
                });
              })()}
              <text x="80" y="73" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--color-text-primary)">
                {INFRA_TOTAL.toLocaleString()}
              </text>
              <text x="80" y="92" textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">
                システム
              </text>
            </svg>
          </div>

          {/* バーチャート（凡例兼用） */}
          <div className="flex-1 space-y-2 w-full">
            {INFRA_SHARE.map((item) => {
              const pct = (item.systems / INFRA_TOTAL) * 100;
              return (
                <div key={item.cloud} className="flex items-center gap-2">
                  <span className="text-xs w-24 flex-shrink-0 text-right font-semibold" style={{ color: item.color }}>{item.cloud}</span>
                  <div className="bar-track flex-1">
                    <div className="bar-fill" style={{ width: `${Math.max(pct, 0.3)}%`, backgroundColor: item.color }} />
                  </div>
                  <span className="text-xs font-bold w-10 flex-shrink-0 text-right tabular-nums" style={{ color: item.color }}>{pct.toFixed(1)}%</span>
                  <span className="text-xs w-14 flex-shrink-0 text-right tabular-nums" style={{ color: "var(--color-text-muted)" }}>{item.systems.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          ※ インフラ層のシステム数。ベンダー一覧はアプリ層のため別指標。
        </p>
        <div className="mt-2 border-l-2 pl-3 py-1" style={{ borderColor: "#E2004B" }}>
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <span className="font-semibold">さくらのクラウド:</span>{" "}
            2026年3月27日、全技術要件達成・本番環境提供開始（国内クラウド初）
          </p>
        </div>
      </div>

      {/* クラウド別コスト比較 */}
      <div className="card p-5">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>クラウド別コスト比較</h2>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>ガバクラ標準システム規模での比較</span>
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
          デジタル庁・Oracle公式調査より。割引・転送料等を含む総合TCO指標（参考値）。
        </p>

        {/* TCO指数バーチャート */}
        <div className="mb-5">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-secondary)" }}>総費用の目安（AWS=100基準）</p>
          <div className="space-y-2.5">
            {CLOUD_ORDER.map((cloudKey) => {
              const cfg = CLOUD_CONFIG[cloudKey];
              const idx = cfg.costIndex;
              const label = cloudKey === "Sakura" ? "さくら" : cloudKey;
              return (
                <div key={cloudKey} className="flex items-center gap-3">
                  <span className="text-xs w-14 flex-shrink-0 text-right font-semibold text-gray-600">{label}</span>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1 h-6 rounded overflow-hidden" style={{ backgroundColor: "var(--color-surface-container)" }}>
                      <div
                        className="h-full"
                        style={{ width: `${idx}%`, backgroundColor: cfg.color + "40" }}
                      />
                    </div>
                    <span className="text-xs font-bold w-8 text-right tabular-nums flex-shrink-0" style={{ color: cfg.color }}>{idx}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 料金計算ツールリンク */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { id: "AWS", url: "https://calculator.aws/pricing/2/metaindex" },
            { id: "Azure", url: "https://azure.microsoft.com/ja-jp/pricing/calculator/" },
            { id: "GCP", url: "https://cloud.google.com/products/calculator?hl=ja" },
            { id: "OCI", url: "https://www.oracle.com/jp/cloud/costestimator.html" },
          ].map(({ id, url }) => (
            <a key={id} href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs px-2.5 py-1.5 rounded-lg no-underline hover:opacity-80 text-center border"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-container-low)" }}>
              {id} 料金計算ツール ↗
            </a>
          ))}
        </div>

        {/* 割引モデル比較 */}
        <div className="border-t pt-5" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>割引モデル比較</p>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>自治体調達で使いやすい割引プランの比較（2026年3月時点・公式情報ベース）</p>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm" style={{ minWidth: 560 }}>
              <thead>
                <tr className="border-b-2" style={{ borderColor: "var(--color-border)" }}>
                  <th className="text-left py-2 px-2 text-xs font-medium w-28" style={{ color: "var(--color-text-muted)" }}>比較項目</th>
                  {CLOUD_ORDER.map((id) => (
                    <th key={id} className="text-center py-2 px-2 text-xs font-bold whitespace-nowrap" style={{ color: CLOUD_CONFIG[id].color }}>
                      {id === "Sakura" ? "さくら" : id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    item: "総費用目安（割引込）",
                    vals: ["100", "55", "95", "90", "70"],
                    highlight: ["55"],
                  },
                  {
                    item: "1年割引目安",
                    vals: ["約40〜55%", "非公開", "約40〜60%", "約20〜30%", "約10〜20%"],
                  },
                  {
                    item: "コミット対象",
                    vals: ["リソース単位", "全サービス共通", "リソース単位", "リソース単位", "リソース単位"],
                    highlight: ["全サービス共通"],
                  },
                  {
                    item: "課金通貨",
                    vals: ["ドル", "円", "ドル", "ドル", "円"],
                    highlight: ["円"],
                  },
                  {
                    item: "自治体向け評価",
                    vals: ["▲", "○", "▲", "▲", "○"],
                    highlight: ["○"],
                  },
                ].map((row) => (
                  <tr key={row.item} className="border-b" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-2 px-2 text-xs font-medium whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>{row.item}</td>
                    {row.vals.map((val, i) => {
                      const isHighlight = row.highlight?.includes(val);
                      return (
                        <td key={i} className="py-2 px-2 text-center text-xs" style={{
                          color: isHighlight ? "#15803d" : "var(--color-text-secondary)",
                          fontWeight: isHighlight ? 600 : 400,
                        }}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs mt-1 sm:hidden" style={{ color: "var(--color-text-muted)" }}>← 横スクロールで全CSPを表示</p>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            ※ 割引率は最大値。実際の適用条件は各CSP契約内容・調達方式により異なります。
          </p>
        </div>

        {/* ガバメントクラウド調達の仕組み */}
        <div className="mt-5 border-t pt-5" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>ガバメントクラウド調達の仕組み</p>
          <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>自治体はCSPと直接契約しない。デジタル庁が一括調達し、自治体はクラウド利用料を負担</p>
          <div className="flex flex-col items-center gap-0 text-xs">
            <div className="grid grid-cols-5 gap-1 w-full">
              {["AWS", "OCI", "Azure", "GCP", "さくら"].map((c) => (
                <div key={c} className="rounded-lg px-1 py-1.5 font-bold border text-xs text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "var(--color-surface-container-low)" }}>{c}</div>
              ))}
            </div>
            <div className="flex flex-col items-center my-1" style={{ color: "var(--color-text-muted)" }}>
              <span className="text-xs">一括調達契約</span>
              <ArrowDown size={16} aria-hidden="true" />
            </div>
            <div className="rounded-xl px-6 py-2 font-bold text-sm text-white" style={{ backgroundColor: "var(--color-gov-primary)" }}>デジタル庁</div>
            <div className="flex flex-col items-center my-1" style={{ color: "var(--color-text-muted)" }}>
              <ArrowDown size={16} aria-hidden="true" />
              <span className="text-xs">利用権付与・運用管理委託</span>
            </div>
            <div className="rounded-xl px-6 py-2 font-bold text-sm" style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)" }}>自治体（1,741団体）</div>
            <p className="mt-3 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
              ※ クラウド利用料は自治体負担。ドル建てCSPは円安時にコスト増となり自治体負担が増加。円建て（OCI・さくら）は予算が安定しやすい。
            </p>
          </div>
        </div>

        {/* コミットの仕組みの違い */}
        <div className="mt-5 border-t pt-5 space-y-3" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>コミットの仕組みの違い</p>

          <div className="border-l-2 pl-3 py-1" style={{ borderColor: "#7FB8E6" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>OCI（財布型）</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              年間総額をコミットするが、<strong>Compute・DB・Storageなど全サービスに自由配分</strong>できる。サービス間でリソースを移動・最適化しやすくFinOpsとの相性はよい。総額は年度内固定のため、<span className="font-semibold px-1 rounded" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>⚠ 初期見積もりが過剰だと未使用失効リスクがある</span>。
            </p>
          </div>

          <div className="border-l-2 pl-3 py-1" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>AWS / Azure / GCP / さくら（予約型）</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              EC2・VMタイプ・vCPUなど<strong>リソース単位で事前指定</strong>してコミット。FinOpsで<span className="font-semibold px-1 rounded" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>⚠ 該当リソースを削減すると余ったコミット分が無駄になる</span>。サービスをまたいだ最適化はできない。
            </p>
          </div>
        </div>
      </div>

      {/* データ主権リスク */}
      <div className="card p-5">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>データ主権リスク</h2>
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
          外資CSPは米国法の域外適用を受ける。自治体データが日本国外に開示されるリスクがある。
        </p>

        <div className="space-y-3">
          {/* 外資 vs さくら比較テーブル */}
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--color-text-secondary)", minWidth: 160 }}>評価項目</th>
                  <th className="text-center py-2 px-4 font-bold whitespace-nowrap" style={{ color: "var(--color-text-secondary)" }}>外資CSP<br/><span className="font-normal text-xs">（AWS / Azure / GCP / OCI）</span></th>
                  <th className="text-center py-2 px-4 font-bold whitespace-nowrap" style={{ color: "#E2004B", backgroundColor: "#fff0f4" }}>さくら<br/><span className="font-normal text-xs">（国産）</span></th>
                </tr>
              </thead>
              <tbody>
                {([
                  ["米国法の域外適用（FISA 702 / EO12333）", "あり", "対象外"],
                  ["米国政府のデータ開示要求",               "拒否不可", "対象外"],
                  ["ガグオーダー（自治体への通知禁止）",     "あり", "適用なし"],
                  ["運営主体・データセンター",               "外国法人", "日本法人・国内DC"],
                  ["データの国外転送リスク",                 "あり", "転送されない構造"],
                ] as const).map(([axis, ng, ok]) => (
                  <tr key={axis} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-2 px-3 font-medium" style={{ color: "var(--color-text-primary)" }}>{axis}</td>
                    <td className="text-center py-2 px-4" style={{ color: "var(--color-text-secondary)" }}>
                      <span className="text-red-500 mr-1">✗</span>{ng}
                    </td>
                    <td className="text-center py-2 px-4" style={{ backgroundColor: "#fff8f9" }}>
                      <span style={{ color: "#4A90E2" }} className="mr-1">✓</span><strong style={{ color: "#E2004B" }}>{ok}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs px-3 py-2 leading-relaxed" style={{ borderTop: "1px solid var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "#fff8f9" }}>
              住民基本台帳・医療・税務など機微データを扱う自治体にとって、<strong style={{ color: "#E2004B" }}>データ主権の観点で唯一の選択肢</strong>。IT専任担当者が少ない小規模自治体にも適合しやすい。
            </p>
          </div>

          {/* 法律根拠コメント */}
          <div className="space-y-1.5 pt-1">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>根拠法・事例</p>
            {([
              { label: "FISA 702条", desc: "米国企業に裁判所命令なしのデータ提供命令が可能。ガグオーダーで自治体への通知も不可。", href: "https://www.justice.gov/nsd/surveillance-collection-foreign-intelligence-information", linkText: "DOJ公式" },
              { label: "EO 12333", desc: "NSAが令状なしに海外経由データをバルク収集できる根拠法。スノーデン事件（2013年）で露見。", href: "https://www.pclob.gov/library/702-Report.pdf", linkText: "PCLOB報告書" },
              { label: "MS 仏上院証言（2025年6月）", desc: "「米国法の要求があればデータアクセスを保証できない」と公式証言。GDPR準拠でもCLOUD法は拒否不可。", href: "https://www.senat.fr/rap/r24-510/r24-510.html", linkText: "仏上院公式" },
            ]).map(({ label, desc, href, linkText }) => (
              <div key={label} className="flex gap-2 pl-2 border-l" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold mr-1.5" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</span>
                </div>
                <a href={href} target="_blank" rel="noopener noreferrer"
                  className="text-xs no-underline shrink-0 self-start"
                  style={{ color: "var(--color-text-muted)" }}>
                  {linkText} ↗
                </a>
              </div>
            ))}
          </div>

          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ※ 現状のガバメントクラウドは外資CSPが大多数。データ主権リスクを許容した上で調達しているとも言える。住民基本台帳等の機微データを扱う場合は特に要考慮。
          </p>
        </div>
      </div>


      {/* 対応ベンダー・パッケージへの導線 */}
      <div className="rounded-xl border px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            対応ベンダー・パッケージの詳細
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            ベンダー別の採用団体数・コスト因子・業務別パッケージ一覧
          </p>
        </div>
        <Link
          href="/packages"
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--color-brand-primary)", color: "#ffffff", textDecoration: "none" }}
        >
          パッケージ・ベンダー一覧 →
        </Link>
      </div>

      {/* 免責事項 */}
      <div className="rounded-lg border px-5 py-3" style={{ borderColor: "var(--color-border)", borderLeftWidth: 3, borderLeftColor: "#d97706" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          <span className="font-semibold">免責事項:</span>{" "}
          公開情報ベースの整理です。最新条件は各社公式サイトで確認してください。
        </p>
      </div>

      <div
        className="rounded-xl border px-5 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div>
          <p className="text-xs font-semibold" style={{ color: "#4A90E2" }}>
            関連導線
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            コスト削減の考え方と無料レポートをあわせて確認
          </p>
          <p className="mt-1 text-xs leading-6" style={{ color: "var(--color-text-muted)" }}>
            基盤比較だけでなく、移行済み最適化と未移行見直しの整理、全体レポートへの導線も用意しています。
          </p>
        </div>
        <Link
          href="/finops"
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "#0f766e", color: "#ffffff", textDecoration: "none" }}
        >
          FinOps コスト最適化ハブ →
        </Link>
      </div>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.cloud} pageId="cloud" />

      <PageNavCards exclude="/cloud" />
      <RelatedArticles cluster={CLUSTERS.tech} />
    </div>
    </>
  );
}
