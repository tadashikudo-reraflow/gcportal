import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "導入実績マップ | 自治体標準化ダッシュボード",
};

type MunicipalityPackageRow = {
  id: number;
  municipality_id: number;
  package_id: number;
  business: string | null;
  adoption_year: number | null;
  source: string | null;
  confidence: string;
  municipalities: {
    prefecture: string;
    city: string;
    overall_rate: number | null;
  } | null;
  packages: {
    package_name: string;
    vendors: {
      name: string;
      short_name: string | null;
      cloud_platform: string | null;
      cloud_confirmed: boolean;
    } | null;
  } | null;
};

type VendorRow = {
  id: number;
  name: string;
  short_name: string | null;
  cloud_platform: string | null;
  cloud_confirmed: boolean;
  multitenancy: boolean;
  municipality_count: number | null;
};

const CLOUD_COLORS: Record<string, { bg: string; text: string }> = {
  AWS:    { bg: "#ff9900", text: "#fff" },
  GCP:    { bg: "#1a73e8", text: "#fff" },
  Azure:  { bg: "#00b4ff", text: "#fff" },
  OCI:    { bg: "#c8102e", text: "#fff" },
  Sakura: { bg: "#e91e8c", text: "#fff" },
};

function cloudBadge(platform: string | null, confirmed: boolean) {
  if (!platform) return { bg: "#9ca3af", text: "#fff" };
  const c = CLOUD_COLORS[platform] ?? { bg: "#9ca3af", text: "#fff" };
  return confirmed ? c : { bg: c.bg + "88", text: "#fff" };
}

function confidenceBadge(conf: string) {
  if (conf === "confirmed") return "bg-green-100 text-green-700";
  if (conf === "likely") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-500";
}

function confidenceLabel(conf: string) {
  if (conf === "confirmed") return "確認済み";
  if (conf === "likely") return "推定";
  return "不明";
}

export default async function AdoptionPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let rows: MunicipalityPackageRow[] = [];
  let vendors: VendorRow[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const [mpRes, vRes] = await Promise.all([
        supabase
          .from("municipality_packages")
          .select(`
            id, municipality_id, package_id, business, adoption_year, source, confidence,
            municipalities(prefecture, city, overall_rate),
            packages(package_name, vendors(name, short_name, cloud_platform, cloud_confirmed))
          `)
          .order("municipality_id"),
        supabase.from("vendors").select("*").order("name"),
      ]);

      rows = (mpRes.data ?? []) as unknown as MunicipalityPackageRow[];
      vendors = (vRes.data ?? []) as VendorRow[];
    } catch {
      rows = [];
      vendors = [];
    }
  }

  // ベンダー別にグループ化
  const vendorGroups: Record<string, MunicipalityPackageRow[]> = {};
  for (const row of rows) {
    const vendorName = row.packages?.vendors?.short_name ?? row.packages?.vendors?.name ?? "不明";
    if (!vendorGroups[vendorName]) vendorGroups[vendorName] = [];
    vendorGroups[vendorName].push(row);
  }

  // 都道府県別集計
  const prefMap: Record<string, number> = {};
  for (const row of rows) {
    const pref = row.municipalities?.prefecture ?? "不明";
    prefMap[pref] = (prefMap[pref] ?? 0) + 1;
  }
  const topPrefs = Object.entries(prefMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">パッケージ導入実績マップ</h1>
        <p className="text-sm text-gray-500 mt-1">
          自治体ごとに導入しているパッケージとガバメントクラウド基盤の調査データ。
          <span className="text-xs text-gray-400 ml-1">※独自調査・公開情報に基づく。順次拡充予定。</span>
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold" style={{ color: "#003087" }}>{rows.length}</p>
          <p className="text-xs text-gray-500 mt-1">調査済み自治体</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">
            {rows.filter((r) => r.confidence === "confirmed").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">確認済み</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-800">{Object.keys(vendorGroups).length}</p>
          <p className="text-xs text-gray-500 mt-1">対応ベンダー</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-800">{Object.keys(prefMap).length}</p>
          <p className="text-xs text-gray-500 mt-1">都道府県</p>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-700 font-medium">データ収集中です</p>
          <p className="text-yellow-600 text-sm mt-1">順次追加されます。</p>
        </div>
      )}

      {/* ベンダー別テーブル */}
      {Object.entries(vendorGroups).map(([vendorName, vendorRows]) => {
        const sample = vendorRows[0];
        const cloud = sample?.packages?.vendors?.cloud_platform ?? null;
        const cloudConf = sample?.packages?.vendors?.cloud_confirmed ?? false;
        const badge = cloudBadge(cloud, cloudConf);

        return (
          <div key={vendorName} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* ベンダーヘッダー */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-gray-800">{vendorName}</h2>
                <span
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ backgroundColor: badge.bg, color: badge.text }}
                >
                  {cloud ?? "クラウド不明"}
                  {cloud && !cloudConf && <span className="opacity-75">?</span>}
                </span>
              </div>
              <span className="text-sm text-gray-500">{vendorRows.length} 自治体</span>
            </div>

            {/* 自治体テーブル */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">都道府県</th>
                    <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">自治体名</th>
                    <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">パッケージ</th>
                    <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">移行率</th>
                    <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">採用年度</th>
                    <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">確信度</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorRows.map((row) => {
                    const rate = row.municipalities?.overall_rate;
                    const rateColor =
                      rate == null ? "text-gray-400"
                      : rate >= 0.9 ? "text-green-600"
                      : rate >= 0.7 ? "text-yellow-600"
                      : "text-red-600";
                    return (
                      <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-4 text-gray-500 text-xs">
                          {row.municipalities?.prefecture ?? "—"}
                        </td>
                        <td className="py-2 px-4 font-medium text-gray-800">
                          {row.municipalities?.city ?? `ID:${row.municipality_id}`}
                        </td>
                        <td className="py-2 px-4 text-gray-600 text-xs">
                          {row.packages?.package_name ?? "—"}
                          {row.business && (
                            <span className="ml-1 text-gray-400">({row.business})</span>
                          )}
                        </td>
                        <td className={`py-2 px-4 font-bold text-sm ${rateColor}`}>
                          {rate != null ? `${(rate * 100).toFixed(1)}%` : "—"}
                        </td>
                        <td className="py-2 px-4 text-gray-500 text-xs">
                          {row.adoption_year ? `${row.adoption_year}年度` : "—"}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${confidenceBadge(row.confidence)}`}>
                            {confidenceLabel(row.confidence)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* 都道府県別分布 */}
      {topPrefs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#003087" }} />
            都道府県別 調査済み自治体数（上位10）
          </h2>
          <div className="space-y-2">
            {topPrefs.map(([pref, count]) => {
              const maxCount = topPrefs[0][1];
              const pct = (count / maxCount) * 100;
              return (
                <div key={pref} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-20 flex-shrink-0">{pref}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: "#003087" }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 注記 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-700">
          <strong>データについて：</strong>
          このページのデータは、各ベンダーのプレスリリース・各自治体の公開資料・議会議事録等を独自調査したものです。
          順次精度向上・件数拡充を行っています。情報の訂正・追加はGitHubのIssueでご報告ください。
        </p>
      </div>
    </div>
  );
}
