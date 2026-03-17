import type { Metadata } from "next";
import { Vendor, Package } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "パッケージ一覧 | 自治体標準化ダッシュボード",
};

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

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">パッケージ・ベンダー一覧</h1>
        <p className="text-sm text-gray-500 mt-1">
          標準化対応パッケージを提供するベンダーと業務別パッケージの一覧。
        </p>
      </div>

      {/* ベンダーカード */}
      <div className="card p-6">
        <h2
          className="text-sm font-bold mb-4 flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="w-1 h-5 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: "var(--color-gov-primary)" }}
          />
          ベンダー一覧（{vendors.length}社）
        </h2>
        {vendors.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>データがありません。</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {vendors.map((vendor) => {
              const badgeStyle = getCloudBadgeStyle(vendor.cloud_platform, vendor.cloud_confirmed);
              return (
                <div
                  key={vendor.id}
                  className="card p-4 flex flex-col gap-2 hover:shadow transition-shadow"
                >
                  {/* ベンダー名 */}
                  <div>
                    <p
                      className="font-semibold text-sm leading-tight"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {vendor.short_name ?? vendor.name}
                    </p>
                    {vendor.short_name && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {vendor.name}
                      </p>
                    )}
                  </div>

                  {/* バッジ群 — cloud_platformがnullの場合はバッジなし */}
                  <div className="flex flex-wrap gap-1">
                    {badgeStyle && (
                      <span
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                      >
                        {vendor.cloud_platform}
                        {!vendor.cloud_confirmed && (
                          <span className="opacity-80 text-xs ml-0.5">未確認</span>
                        )}
                      </span>
                    )}
                    {vendor.multitenancy && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                        共同利用
                      </span>
                    )}
                  </div>

                  {/* 採用自治体数 */}
                  {vendor.municipality_count != null && (
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      採用{" "}
                      <span
                        className="font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {vendor.municipality_count.toLocaleString()}
                      </span>{" "}
                      団体
                    </p>
                  )}
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
                    <table className="w-full text-sm">
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
