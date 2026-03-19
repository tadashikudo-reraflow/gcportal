import type { Metadata } from "next";
import { Vendor, Package } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "パッケージ一覧 | 自治体標準化ダッシュボード",
};

// ベンダー名からトップボーダーカラーを返す（主要ベンダーのみ対応）
function getVendorBorderColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("tkc") || n.includes("ティーケーシー")) return "#1D4ED8";   // TKC = ブルー
  if (n.includes("アイネス") || n.includes("ines"))        return "#00b4ff";  // アイネス = 水色
  if (n.includes("fujitsu") || n.includes("富士通"))       return "#c00000";  // 富士通 = 赤
  if (n.includes("nec") || n.includes("日本電気"))         return "#0066cc";  // NEC = ネイビーブルー
  if (n.includes("hitachi") || n.includes("日立"))         return "#e00000";  // 日立 = 赤
  if (n.includes("ntt") || n.includes("エヌ・ティ"))       return "#0032a0";  // NTT = 濃いブルー
  if (n.includes("oss") || n.includes("オープン"))         return "#378445";  // OSS系 = グリーン
  return "var(--color-gov-primary)";                                           // デフォルト
}

// クラウドバッジの色設定
// platform が null/不明の場合は null を返し、呼び出し側で非表示にする
function getCloudBadgeStyle(
  platform: string | null,
  confirmed: boolean
): { bg: string; text: string } | null {
  const base: Record<string, { bg: string; text: string }> = {
    AWS:    { bg: "#ff9900", text: "#fff" },
    GCP:    { bg: "#1a73e8", text: "#fff" },
    Azure:  { bg: "#00b4ff", text: "#fff" },
    OCI:    { bg: "#b91c1c", text: "#fff" },   /* red-700 — 白地でコントラスト改善 */
    Sakura: { bg: "#be185d", text: "#fff" },   /* pink-700 */
  };
  if (!platform || !base[platform]) return null;   // 不明は null → 非表示
  const style = base[platform];
  // 未確認の場合は色を薄くしてラベルに「(未確認)」を付与（呼び出し側で対応）
  if (!confirmed) return { bg: style.bg + "99", text: "#fff" };
  return style;
}

export default async function PackagesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let vendors: Vendor[] = [];
  let packages: (Package & { vendors?: Vendor })[] = [];

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

    const [vendorRes, packageRes] = await Promise.all([
      supabase.from("vendors").select("*").order("name"),
      supabase
        .from("packages")
        .select("*, vendors(name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count)")
        .order("business"),
    ]);

    vendors = vendorRes.data ?? [];
    packages = packageRes.data ?? [];
  } catch {
    vendors = [];
    packages = [];
  }

  // 業務でグループ化
  const businessGroups: Record<string, (Package & { vendors?: Vendor })[]> = {};
  for (const pkg of packages) {
    const biz = pkg.business ?? "不明";
    if (!businessGroups[biz]) businessGroups[biz] = [];
    businessGroups[biz].push(pkg);
  }
  const sortedBusinesses = Object.keys(businessGroups).sort();

  // ベンダーを採用団体数順にソート
  const rankedVendors = [...vendors].sort(
    (a, b) => (b.municipality_count ?? 0) - (a.municipality_count ?? 0)
  );
  const maxCount = rankedVendors[0]?.municipality_count ?? 1;

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="pb-4">
        <h1 className="page-title">パッケージ・ベンダー一覧</h1>
        <p className="page-subtitle">
          標準化対応パッケージを提供するベンダーと業務別パッケージの一覧。
        </p>
      </div>

      {/* ベンダー採用団体ランキング */}
      <div className="card p-5">
        <h2
          className="text-sm font-bold mb-4 flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="w-1 h-5 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: "var(--color-gov-primary)" }}
          />
          ベンダー 採用団体ランキング
          <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
            {vendors.length}社
          </span>
        </h2>
        {rankedVendors.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>データがありません。</p>
        ) : (
          <div className="space-y-2">
            {rankedVendors.map((vendor, idx) => {
              const rank = idx + 1;
              const badgeStyle = getCloudBadgeStyle(vendor.cloud_platform, vendor.cloud_confirmed);
              const borderColor = getVendorBorderColor(vendor.name);
              const count = vendor.municipality_count ?? 0;
              const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const isTop3 = rank <= 3;
              return (
                <div
                  key={vendor.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                  style={{
                    backgroundColor: isTop3 ? borderColor + "08" : "transparent",
                    border: isTop3 ? `1px solid ${borderColor}25` : "1px solid transparent",
                  }}
                >
                  {/* 順位 */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold"
                    style={{
                      backgroundColor: isTop3 ? borderColor : "#e5e7eb",
                      color: isTop3 ? "white" : "#6b7280",
                    }}
                  >
                    {rank}
                  </div>

                  {/* ベンダー名＋バッジ */}
                  <div className="w-28 sm:w-36 flex-shrink-0">
                    <p className="font-semibold text-sm leading-tight truncate" style={{ color: "var(--color-text-primary)" }}>
                      {vendor.short_name ?? vendor.name}
                    </p>
                    <div className="flex gap-1 mt-0.5 flex-wrap">
                      {badgeStyle && (
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                        >
                          {vendor.cloud_platform}
                        </span>
                      )}
                      {vendor.multitenancy && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: "#d1fae5", color: "#166534" }}>共同利用</span>
                      )}
                    </div>
                  </div>

                  {/* バー */}
                  <div className="flex-1 min-w-0">
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${barPct}%`, backgroundColor: borderColor }}
                      />
                    </div>
                  </div>

                  {/* 採用数 */}
                  <div className="flex-shrink-0 text-right w-20">
                    {count > 0 ? (
                      <>
                        <span className="text-base font-extrabold tabular-nums" style={{ color: borderColor }}>
                          {count.toLocaleString()}
                        </span>
                        <span className="text-xs ml-0.5" style={{ color: "var(--color-text-muted)" }}>団体</span>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 業務別パッケージ一覧 */}
      <div className="card p-6">
        <h2
          className="text-sm font-bold mb-4 flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="w-1 h-5 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: "var(--color-gov-primary)" }}
          />
          業務別パッケージ一覧
          <span className="text-xs font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
            （{sortedBusinesses.length}業務 / 計{packages.length}件）
          </span>
        </h2>

        {sortedBusinesses.length === 0 ? (
          <p className="text-sm text-gray-400">データがありません。</p>
        ) : (
          <div className="space-y-4">
            {sortedBusinesses.map((biz) => {
              const pkgs = businessGroups[biz];
              return (
                <details key={biz} className="group" open>
                  <summary className="flex items-center justify-between cursor-pointer py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors select-none">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 text-sm">{biz}</span>
                      <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                        {pkgs.length}件
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm table-fixed">
                      <colgroup>
                        <col style={{ width: "auto" }} />
                        <col style={{ width: "7rem" }} />
                        <col style={{ width: "6rem" }} />
                        <col style={{ width: "7rem" }} />
                      </colgroup>
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">パッケージ名</th>
                          <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">ベンダー</th>
                          <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">クラウド</th>
                          <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">確認日</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pkgs.map((pkg) => {
                          const vendor = pkg.vendors;
                          const platform = vendor?.cloud_platform ?? null;
                          const confirmed = vendor?.cloud_confirmed ?? false;
                          const badgeStyle = getCloudBadgeStyle(platform, confirmed);
                          return (
                            <tr
                              key={pkg.id}
                              className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                            >
                              <td className="py-2 px-3 font-medium text-gray-800">
                                {pkg.package_name}
                              </td>
                              <td className="py-2 px-3 text-gray-600">
                                {vendor?.short_name ?? vendor?.name ?? "—"}
                              </td>
                              <td className="py-2 px-3">
                                {badgeStyle ? (
                                  <span
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold"
                                    style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                                  >
                                    {platform}
                                    {!confirmed && (
                                      <span className="opacity-80 text-xs ml-0.5">未確認</span>
                                    )}
                                  </span>
                                ) : (
                                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-xs text-gray-500">
                                {pkg.confirmed_date ?? "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
