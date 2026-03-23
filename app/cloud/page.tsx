import type { Metadata } from "next";
import RelatedArticles from "@/components/RelatedArticles";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";

export const metadata: Metadata = {
  title: "ガバメントクラウド基盤分析（AWS/Azure/GCP/OCI）| ガバメントクラウド移行状況ダッシュボード",
  description: "ガバメントクラウドのインフラシェア（AWS 97%・Azure・GCP・OCI）とコスト指標を分析。自治体が選ぶべきクラウド基盤と認定状況を可視化。",
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
  color: string; bgColor: string; borderColor: string;
  label: string; certYear: number; infraPct: string; costIndex: number;
}> = {
  AWS:    { color: "#FF9900", bgColor: "#fffbf0", borderColor: "#FF9900",
            label: "Amazon Web Services", certYear: 2021, infraPct: "97%", costIndex: 100 },
  OCI:    { color: "#F80000", bgColor: "#fff8f8", borderColor: "#F80000",
            label: "Oracle Cloud Infrastructure", certYear: 2022, infraPct: "<1%", costIndex: 55 },
  Azure:  { color: "#0078D4", bgColor: "#f0f7ff", borderColor: "#0078D4",
            label: "Microsoft Azure", certYear: 2021, infraPct: "2%", costIndex: 95 },
  GCP:    { color: "#4285F4", bgColor: "#f0f4ff", borderColor: "#4285F4",
            label: "Google Cloud Platform", certYear: 2021, infraPct: "<1%", costIndex: 90 },
  Sakura: { color: "#E2004B", bgColor: "#fff0f5", borderColor: "#E2004B",
            label: "さくらインターネット", certYear: 2024, infraPct: "<1%", costIndex: 70 },
};
const CLOUD_ORDER = ["AWS", "OCI", "Azure", "GCP", "Sakura"];

// ベンダー公式サイト（vendor.id → URL）
const VENDOR_WEBSITES: Record<string, string> = {
  "1":  "https://www.tkc.jp/",
  "2":  "https://jpn.nec.com/",
  "3":  "https://www.fujitsu.com/jp/group/fjj/",
  "4":  "https://www.hitachi-systems.com/",
  "5":  "https://www.gyosei-system.co.jp/",
  "7":  "https://www.ines.co.jp/",
  "8":  "https://www.gcom.co.jp/",
  "9":  "https://www.rkkcs.co.jp/",
  "10": "https://www.den-san.co.jp/",
  "11": "https://www.gcc.co.jp/",
  "12": "https://www.jip.co.jp/",
  "13": "https://www.k-js.co.jp/",
  "14": "https://www.nttdata.com/jp/",
  "15": "https://www.dsknet.co.jp/",
  "16": "https://www.iacnet.co.jp/",
  "17": "https://www.e-sannet.co.jp/",
  "18": "https://www.ryomo.co.jp/",
  "19": "https://www.ics.co.jp/",
  "20": "https://www.intec.co.jp/",
  "21": "https://www.ryobi.co.jp/",
  "22": "https://www.sbs-infosys.co.jp/",
  "23": "https://www.oec.co.jp/",
  "24": "https://www.n-computer.co.jp/",
};

// クラウド別コスト比較
const COST_COMPARE = [
  {
    item: "コンピュート（4vCPU / 16GB）",
    unit: "USD/月",
    aws: 180, azure: 170, gcp: 160, oci: 56, sakura: null,
    note: "OCI E4.Flex vs AWS m6i.xlarge 相当",
  },
  {
    item: "オブジェクトストレージ（1TB）",
    unit: "USD/月",
    aws: 23, azure: 18, gcp: 20, oci: 3, sakura: 8,
    note: "OCI Standard vs AWS S3 Standard",
  },
  {
    item: "データ転送・アウトバウンド（1TB）",
    unit: "USD",
    aws: 90, azure: 87, gcp: 80, oci: 0, sakura: 0,
    note: "OCI: 月10TBまで無料",
  },
  {
    item: "TCO 総合推定比",
    unit: "AWS=100",
    aws: 100, azure: 95, gcp: 90, oci: 55, sakura: 70,
    note: "Oracle TCO白書・ガバクラTCO検証。参考値。",
  },
];

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

// notesテキスト内のURLをリンクに変換
function NotesWithLinks({ notes }: { notes: string }) {
  const urlRegex = /(https?:\/\/[^\s,、。）)]+)/g;
  const parts = notes.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
            style={{ color: "#2563eb" }}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

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

  // packages.cloud_platform 主軸でグループ化
  // cloudMap[cloud][vendor_id] = { vendor, packages }
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

  const totalVendors = new Set(
    Object.values(cloudVendors).flatMap((entries) => entries.map((e) => e.vendor.id))
  ).size;
  const totalPackages = Object.values(cloudVendors).reduce(
    (s, entries) => s + entries.reduce((ss, e) => ss + e.packages.length, 0), 0
  );

  return (
    <div className="space-y-8">
      {/* ページヘッダー */}
      <div className="pb-2">
        <h1 className="page-title">クラウド基盤分析</h1>
        <p className="page-subtitle">
          ガバクラ認定クラウド別の対応ベンダー・パッケージ一覧
        </p>
      </div>

      {/* サマリーバー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--color-brand-primary)" }}>
            {Object.keys(CLOUD_CONFIG).length}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>認定クラウド</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--color-brand-secondary)" }}>
            {totalVendors || "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>対応ベンダー</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--color-brand-secondary)" }}>
            {totalPackages || "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>パッケージ数</p>
        </div>
      </div>

      {/* ① クラウド別ベンダー・パッケージ一覧（メイン） */}
      <div>
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text-primary)" }}>
          クラウド別 対応ベンダー一覧
        </h2>

        <div className="space-y-5">
          {CLOUD_ORDER.map((cloudKey) => {
            const cfg = CLOUD_CONFIG[cloudKey];
            const entries = cloudVendors[cloudKey] ?? [];
            const pkgCount = entries.reduce((s, e) => s + e.packages.length, 0);

            return (
              <div
                key={cloudKey}
                className="rounded-xl overflow-hidden"
                style={{ border: `2px solid ${cfg.color}30` }}
              >
                {/* クラウドヘッダー */}
                <div
                  className="px-4 py-3 flex items-center justify-between"
                  style={{ backgroundColor: cfg.bgColor, borderBottom: `2px solid ${cfg.color}30` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-base font-extrabold"
                      style={{ color: cfg.color }}
                    >
                      {cloudKey}
                    </span>
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {cfg.label}
                    </span>
                    {cloudKey === "Sakura" && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: "#e2004b20", color: "#e2004b" }}>国産</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    <span>{cfg.certYear}年認定</span>
                    <span>インフラ {cfg.infraPct}</span>
                    {entries.length > 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
                      >
                        {entries.length}社 / {pkgCount}PKG
                      </span>
                    )}
                  </div>
                </div>

                {/* ベンダー一覧 */}
                {entries.length === 0 ? (
                  <div className="px-4 py-5 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                    登録済みデータなし
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {entries.map(({ vendor, packages: pkgs }) => {
                      const displayName = vendor.short_name ?? vendor.name;
                      return (
                        <details key={vendor.id} className="group">
                          <summary
                            className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none hover:bg-gray-50 list-none"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* ベンダー名 */}
                              <span className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                                {displayName}
                              </span>
                              {vendor.short_name && (
                                <span className="text-xs hidden sm:inline truncate" style={{ color: "var(--color-text-muted)" }}>
                                  {vendor.name}
                                </span>
                              )}
                              {/* マルチテナント */}
                              {vendor.multitenancy && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                                  style={{ backgroundColor: "#00703c20", color: "#00703c" }}>マルチ</span>
                              )}
                              {/* 移行予定 / 未確認バッジ */}
                              {!vendor.cloud_confirmed && vendor.cloud_platform && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                                  style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #d97706" }}>移行予定</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                              {/* 自治体数 */}
                              {vendor.municipality_count != null && (
                                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-brand-secondary)" }}>
                                  {vendor.municipality_count.toLocaleString()}自治体
                                </span>
                              )}
                              {/* PKG数バッジ */}
                              {pkgs.length > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                  style={{ backgroundColor: cfg.color + "15", color: cfg.color }}>
                                  {pkgs.length} PKG
                                </span>
                              )}
                              {/* 展開矢印 */}
                              <span className="text-gray-400 text-xs transition-transform group-open:rotate-90">▶</span>
                            </div>
                          </summary>

                          {/* パッケージ一覧 + notes（展開時） */}
                          <div
                            className="px-4 pb-4 pt-1"
                            style={{ backgroundColor: cfg.bgColor + "80" }}
                          >
                            {pkgs.length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                                {pkgs.map((pkg, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2 text-sm rounded-lg px-3 py-2"
                                    style={{ backgroundColor: "white", border: `1px solid ${cfg.color}20` }}
                                  >
                                    <span
                                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                                      style={{ backgroundColor: cfg.color }}
                                    />
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm leading-snug" style={{ color: "var(--color-text-primary)" }}>
                                        {pkg.package_name}
                                      </p>
                                      {pkg.business && (
                                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                                          {pkg.business}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* 公式サイト + notes / 出典 */}
                            <div className="flex flex-wrap items-start gap-3 mt-1">
                              {VENDOR_WEBSITES[vendor.id] && (
                                <a
                                  href={VENDOR_WEBSITES[vendor.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0"
                                  style={{ backgroundColor: cfg.color + "15", color: cfg.color, border: `1px solid ${cfg.color}40` }}
                                >
                                  公式サイト ↗
                                </a>
                              )}
                              {vendor.notes && (
                                <p className="text-xs leading-relaxed flex-1" style={{ color: "var(--color-text-muted)" }}>
                                  <NotesWithLinks notes={vendor.notes} />
                                </p>
                              )}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ② ガバクラ インフラシェア実態（コンパクト） */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          インフラシェア実態
          <span className="ml-1 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
            本番稼働システム数（2024年10月・デジタル庁調査）
          </span>
        </h2>

        <div className="space-y-2">
          {INFRA_SHARE.map((item) => {
            const pct = (item.systems / INFRA_TOTAL) * 100;
            return (
              <div key={item.cloud} className="flex items-center gap-2">
                <span className="text-xs w-24 flex-shrink-0 text-right font-semibold" style={{ color: item.color }}>{item.cloud}</span>
                <div className="bar-track flex-1">
                  <div className="bar-fill" style={{ width: `${Math.max(pct, 0.3)}%`, backgroundColor: item.color }} />
                </div>
                <span className="text-sm font-bold w-12 flex-shrink-0 text-right tabular-nums" style={{ color: item.color }}>{pct.toFixed(1)}%</span>
                <span className="text-xs w-16 flex-shrink-0 text-right tabular-nums" style={{ color: "var(--color-text-muted)" }}>{item.systems.toLocaleString()}システム</span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 px-3 py-2 rounded-lg text-xs leading-relaxed" style={{ backgroundColor: "#fff8ed", color: "#92400e" }}>
          ※ インフラ層（上記）はデジタル庁先行事業ベースのシステム数。上のベンダー一覧はSaaS/パッケージ層（アプリ層）でありインフラ層とは別指標。
        </div>
      </div>

      {/* ③ クラウド別コスト比較 */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          クラウド別コスト比較
          <span className="ml-1 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>ガバクラ典型ワークロード</span>
        </h2>
        <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
          出典: Oracle TCO白書・デジタル庁ガバクラ先行事業TCO検証・Gartner IaaS比較。
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
          公式料金表（2025年時点）より算出。実際の費用はワークロードにより異なります。
          各社の公式料金計算ツール:{" "}
          <a href="https://calculator.aws/pricing/2/metaindex" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#FF9900" }}>AWS 料金計算ツール</a>
          {" / "}
          <a href="https://azure.microsoft.com/ja-jp/pricing/calculator/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#0078D4" }}>Azure 料金計算ツール</a>
          {" / "}
          <a href="https://cloud.google.com/products/calculator?hl=ja" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#4285F4" }}>GCP 料金計算ツール</a>
          {" / "}
          <a href="https://www.oracle.com/jp/cloud/costestimator.html" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#F80000" }}>OCI コスト試算ツール</a>
        </p>

        <div className="rounded-lg px-4 py-3 mb-4 flex flex-col gap-2" style={{ backgroundColor: "#fff8f8", border: "1.5px solid #F8000040" }}>
          <div className="flex items-center gap-3">
            <span className="font-bold" style={{ color: "#F80000" }}>OCI は AWS の約55%のコスト</span>
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>— シンプルな料金体系（円建て課金対応）でコスト効率に優れる。Oracle DBとの高い互換性も強み</span>
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ※ costIndex値は各社公式料金表より標準化20業務想定ワークロードで算出。実際の費用はワークロードにより異なります。
          </p>
          <div className="rounded px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: "#fff0f0", color: "#7f1d1d", border: "1px solid #F8000030" }}>
            <span className="font-semibold">札幌市事例（2025年4月）:</span>{" "}
            札幌市がOCIを正式採用。住民情報系32業務をガバメントクラウドへ移行。円建て課金・Oracle DBとの高互換性・コスト効率が採用理由。
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">項目</th>
                {(["AWS", "Azure", "GCP", "OCI", "Sakura"] as const).map((id) => {
                  const cfg = CLOUD_CONFIG[id];
                  return (
                    <th key={id} className="text-right py-2 px-2 text-xs font-bold" style={{ color: cfg.color }}>
                      {id}
                    </th>
                  );
                })}
                <th className="text-left py-2 px-3 text-xs text-gray-400 font-normal hidden md:table-cell">備考</th>
              </tr>
            </thead>
            <tbody>
              {COST_COMPARE.map((row) => {
                const vals = [row.aws, row.azure, row.gcp, row.oci, row.sakura].filter((v): v is number => v !== null);
                const minVal = Math.min(...vals);
                return (
                  <tr key={row.item} className="border-b border-gray-100">
                    <td className="py-2.5 px-3 text-xs text-gray-600 leading-tight">
                      {row.item}
                      <br /><span className="text-gray-400">{row.unit}</span>
                    </td>
                    {[
                      { id: "AWS",    val: row.aws },
                      { id: "Azure",  val: row.azure },
                      { id: "GCP",    val: row.gcp },
                      { id: "OCI",    val: row.oci },
                      { id: "Sakura", val: row.sakura },
                    ].map(({ id, val }) => {
                      const cfg = CLOUD_CONFIG[id];
                      const isCheapest = val !== null && val === minVal;
                      return (
                        <td key={id} className="py-2.5 px-2 text-right tabular-nums">
                          {val === null ? (
                            <span className="text-gray-300 text-xs">—</span>
                          ) : (
                            <span
                              className={`font-bold text-sm ${isCheapest ? "px-1.5 py-0.5 rounded" : ""}`}
                              style={{
                                color: isCheapest ? cfg.color : "var(--color-text-secondary)",
                                backgroundColor: isCheapest ? cfg.color + "18" : "transparent",
                              }}
                            >
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-3 text-xs text-gray-400 max-w-xs leading-relaxed hidden md:table-cell">{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 免責事項 */}
      <div className="rounded-lg border border-amber-200 px-5 py-3" style={{ backgroundColor: "#fffbeb" }}>
        <p className="text-xs leading-relaxed" style={{ color: "#92400e" }}>
          <span className="font-semibold">免責事項:</span>{" "}
          本ページのクラウド基盤情報は、各社公式発表・プレスリリース・AWSパートナーディレクトリ等の公開情報をもとに調査・編集したものです。
          <span className="font-semibold">内容の正確性・完全性を保証するものではありません。</span>
          最新情報は各社公式サイトをご確認ください。
        </p>
      </div>

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.cloud} pageId="cloud" />

      <RelatedArticles cluster={CLUSTERS.tech} />
    </div>
  );
}
