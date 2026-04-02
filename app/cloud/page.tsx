import type { Metadata } from "next";
import Link from "next/link";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import Breadcrumb from "@/components/Breadcrumb";

// ISR: インフラシェアデータは静的だが念のため1日キャッシュ
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "ガバクラ比較（AWS/Azure/GCP/OCI/さくら）| ガバメントクラウド移行状況ダッシュボード",
  description: "AWS 97%寡占の実態。認定5クラウド（AWS/Azure/GCP/OCI/さくら）のシェア・コスト・対応ベンダーを徹底比較。",
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
  Sakura: { color: "#E2004B", label: "さくらインターネット",         certYear: 2024, infraPct: "<1%",  costIndex: 70  },
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
                  <div className="flex-1 h-6 rounded overflow-hidden" style={{ backgroundColor: "var(--color-surface-container)" }}>
                    <div
                      className="h-full flex items-center justify-end pr-2"
                      style={{ width: `${idx}%`, backgroundColor: cfg.color + "40" }}
                    >
                      <span className="text-xs font-bold" style={{ color: cfg.color }}>{idx}</span>
                    </div>
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
              <svg width="16" height="20" viewBox="0 0 16 20"><line x1="8" y1="0" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5"/><polyline points="3,10 8,18 13,10" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
            </div>
            <div className="rounded-xl px-6 py-2 font-bold text-sm text-white" style={{ backgroundColor: "#4A90E2" }}>デジタル庁</div>
            <div className="flex flex-col items-center my-1" style={{ color: "var(--color-text-muted)" }}>
              <svg width="16" height="20" viewBox="0 0 16 20"><line x1="8" y1="0" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5"/><polyline points="3,10 8,18 13,10" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
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
              年間総額をコミットするが、<strong>Compute・DB・Storageなど全サービスに自由配分</strong>できる。サービス間でリソースを移動・最適化しやすくFinOpsとの相性はよい。総額は年度内固定のため、初期見積もりが過剰だと未使用失効リスクがある。
            </p>
          </div>

          <div className="border-l-2 pl-3 py-1" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>AWS / Azure / GCP / さくら（予約型）</p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              EC2・VMタイプ・vCPUなど<strong>リソース単位で事前指定</strong>してコミット。FinOpsで該当リソースを削減すると余ったコミット分が無駄になる。サービスをまたいだ最適化はできない。
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
          {/* FISA 702 */}
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--color-border)", borderLeftWidth: 3, borderLeftColor: "#d97706" }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>FISA 702条（外国情報監視法）</p>
              <a href="https://www.justice.gov/nsd/surveillance-collection-foreign-intelligence-information" target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded no-underline shrink-0 border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                DOJ公式 ↗
              </a>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              米国政府がAWS等の米国企業に<strong>裁判所命令なしにデータ提供を命令できる</strong>。ガグオーダー（非開示命令）により自治体への通知も不可。
            </p>
          </div>

          {/* EO 12333 */}
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--color-border)", borderLeftWidth: 3, borderLeftColor: "#d97706" }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>大統領令12333号（EO 12333）</p>
              <a href="https://www.pclob.gov/library/702-Report.pdf" target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded no-underline shrink-0 border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                PCLOB報告書 ↗
              </a>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              NSAが<strong>令状なしに海外経由データをバルク収集</strong>できる根拠法。スノーデン事件（2013年）で露見し欧日で問題視されている。
            </p>
          </div>

          {/* MS仏上院証言 */}
          <div className="rounded-lg p-3 border" style={{ borderColor: "var(--color-border)", borderLeftWidth: 3, borderLeftColor: "#4A90E2" }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>Microsoft 仏上院証言（2025年6月）</p>
              <a href="https://www.senat.fr/rap/r24-510/r24-510.html" target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-0.5 rounded no-underline shrink-0 border"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                仏上院公式 ↗
              </a>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Microsoft代表が<strong>「米国法の要求があればデータアクセスを保証できない」</strong>と公式証言。GDPR準拠でも米国CLOUD法は拒否不可。
            </p>
          </div>

          {/* 外資 vs さくら対比 */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg p-3 border" style={{ borderColor: "var(--color-border)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>外資CSP（AWS / Azure / GCP / OCI）</p>
              <ul className="space-y-1.5">
                {["米国FISA 702条・EO12333の域外適用あり", "米国政府からのデータ開示要求を拒否できない", "ガグオーダーで自治体への通知も不可"].map(r => (
                  <li key={r} className="text-xs flex gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="text-red-500 shrink-0 mt-0.5">✗</span>{r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: "#7FB8E6", backgroundColor: "#f0f7ff" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>さくらのクラウド（国産）</p>
              <ul className="space-y-1.5">
                {["日本法人・国内DCのみで運営", "米国域外適用法の対象外", "データが国外に転送されない構造"].map(r => (
                  <li key={r} className="text-xs flex gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    <span style={{ color: "#4A90E2" }} className="shrink-0 mt-0.5">✓</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ※ 現状のガバメントクラウドは外資CSPが大多数。データ主権リスクを許容した上で調達しているとも言える。住民基本台帳等の機微データを扱う場合は特に要考慮。
          </p>
        </div>
      </div>

      {/* 自治体向け CSP 採用ポイント */}
      <div className="card p-5">
        <div className="flex items-baseline gap-2 mb-1">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>自治体向け CSP 採用ポイント</h2>
        </div>
        <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>コスト・運用・調達の観点から、各CSPの特徴と向いているケースをまとめました</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              name: "AWS", color: "#FF9900",
              points: ["パッケージベンダー対応数が最多・実績豊富", "コミュニティ・事例・ドキュメントが最も充実", "設定・予測管理が複雑。専任担当者が必要"],
              fit: "IT体制が整った中〜大規模自治体",
            },
            {
              name: "OCI", color: "#F80000",
              points: ["財布型でサービス横断の最適化を進めやすい", "円建て・転送料無料でコスト予測が立てやすい"],
              fit: "単年予算・管理負担を最小にしたい自治体",
            },
            {
              name: "Azure", color: "#0078D4",
              points: ["Microsoft 365・AD・Teamsとの統合が強み", "庁内系システムとの連携で本領発揮"],
              fit: "Microsoft製品を庁内で広く使っている自治体",
            },
            {
              name: "GCP", color: "#4285F4",
              points: ["Vertex AI / Gemini でAI活用が最も容易", "Google Workspace との深い統合", "ガバクラ採用実績は少数（国内シェア0.7%）"],
              fit: "AI活用を積極的に推進したい自治体",
            },
            {
              name: "さくら", color: "#E2004B",
              points: ["国産クラウド・国内DC・ガバメントクラウド正式採択（国産初）", "データ主権・運用主権を国内で完結できる", "データ転送無料・円建て・シンプルな契約体系"],
              fit: "データ主権・国内法準拠・運用のシンプルさを重視する自治体",
            },
          ].map(({ name, color, points, fit }) => (
            <div key={name} className="rounded-xl p-4 border" style={{ borderColor: "var(--color-border)", borderTopWidth: 3, borderTopColor: color }}>
              <p className="text-sm font-bold mb-2" style={{ color }}>{name}</p>
              <ul className="space-y-1.5 mb-3">
                {points.map((p) => (
                  <li key={p} className="text-xs flex gap-1.5" style={{ color: "var(--color-text-secondary)" }}>
                    <span className="mt-0.5 shrink-0" style={{ color: "var(--color-text-muted)" }}>•</span>{p}
                  </li>
                ))}
              </ul>
              <p className="text-xs px-2 py-1.5 rounded font-medium" style={{ backgroundColor: "var(--color-surface-container-low)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }}>
                向き先: {fit}
              </p>
            </div>
          ))}
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
  );
}
