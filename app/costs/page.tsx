import type { Metadata } from "next";
import { CostReport, Vendor } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "コスト効果分析 | 自治体標準化ダッシュボード",
};

// change_ratioに応じたバー幅（基準1.0 = 50%、最大3.0 = 100%）
function getBarWidth(ratio: number): number {
  if (ratio <= 0) return 0;
  // 削減側: 0〜1.0 → 0〜50%、増加側: 1.0〜3.0以上 → 50〜100%
  const pct = (ratio / 3.0) * 100;
  return Math.min(pct, 100);
}

function getRatioLabel(ratio: number): string {
  if (ratio < 1.0) return `${((1 - ratio) * 100).toFixed(0)}%削減`;
  return `${ratio.toFixed(2)}倍`;
}

// ベンダー別評価
const vendorEvaluations: Record<string, { label: string; detail: string; mark: string; markColor: string }> = {
  TKC: {
    label: "コスト効率",
    detail: "マルチテナント共同利用 → 規模の経済によるコスト低減",
    mark: "◎",
    markColor: "#007a3d",
  },
  NEC: {
    label: "コスト管理",
    detail: "透明化ツール装備 → TCO把握・比較が容易",
    mark: "○",
    markColor: "#1d6fa4",
  },
  富士通: {
    label: "コスト増リスク",
    detail: "移行遅延が続く自治体で追加費用発生リスクあり",
    mark: "△",
    markColor: "#d97706",
  },
};

export default async function CostsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let costs: (CostReport & { vendors?: Vendor })[] = [];
  let vendors: Vendor[] = [];

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

    const [costRes, vendorRes] = await Promise.all([
      supabase
        .from("cost_reports")
        .select("*, vendors(name, short_name, cloud_platform)")
        .order("change_ratio"),
      supabase.from("vendors").select("*").order("name"),
    ]);

    costs = costRes.data ?? [];
    vendors = vendorRes.data ?? [];
  } catch {
    costs = [];
    vendors = [];
  }

  // 最小・最大・平均
  const ratios = costs.map((c) => c.change_ratio).filter((r) => r != null);
  const avgRatio = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : null;
  const minRatio = ratios.length > 0 ? Math.min(...ratios) : null;
  const maxRatio = ratios.length > 0 ? Math.max(...ratios) : null;

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">コスト効果分析</h1>
        <p className="page-subtitle">
          標準化移行によるコスト変化の実態。TCO比較・ベンダー別評価。
        </p>
      </div>

      {/* サマリーバナー */}
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {/* 目標（緑） */}
          <div className="bg-green-600 p-6 text-white">
            <p className="text-green-100 text-xs font-semibold uppercase tracking-wider mb-1">当初目標</p>
            <p className="text-4xl font-extrabold leading-none">30%削減</p>
            <p className="text-green-100 text-sm mt-2">
              標準化・共同利用によるクラウドコスト低減
            </p>
          </div>
          {/* 現実（赤） */}
          <div className="bg-red-600 p-6 text-white">
            <p className="text-red-100 text-xs font-semibold uppercase tracking-wider mb-1">実態（判明分）</p>
            <p className="text-4xl font-extrabold leading-none">
              {avgRatio != null ? `平均 ${avgRatio.toFixed(1)}倍増` : "1.6〜2.3倍増"}
            </p>
            <p className="text-red-100 text-sm mt-2">
              {minRatio != null && maxRatio != null
                ? `最小 ${minRatio.toFixed(2)}倍 〜 最大 ${maxRatio.toFixed(2)}倍`
                : "自治体規模・ベンダーにより差異"}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            目標と現実の乖離が拡大。特に中小規模自治体でコスト増が顕著。
          </p>
        </div>
      </div>

      {/* コスト変化ランキング */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#003087" }} />
          コスト変化ランキング
          <span className="text-xs font-normal text-gray-400 ml-1">（change_ratio 昇順）</span>
        </h2>

        {costs.length === 0 ? (
          <p className="text-sm text-gray-400">データがありません。</p>
        ) : (
          <div className="space-y-3">
            {costs.map((cost) => {
              const isReduction = cost.change_ratio < 1.0;
              const barColor = isReduction ? "#007a3d" : "#c8102e";
              const barWidth = getBarWidth(cost.change_ratio);
              const label = getRatioLabel(cost.change_ratio);
              const vendorName = cost.vendors?.short_name ?? cost.vendors?.name ?? `#${cost.vendor_id ?? "?"}`;
              const isHighlight = cost.change_ratio <= 0.95; // 盛岡市など削減事例

              return (
                <div
                  key={cost.id}
                  className={`rounded-lg p-3 ${isHighlight ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {vendorName}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{cost.scope}</span>
                      {isHighlight && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-600 text-white flex-shrink-0">
                          削減事例
                        </span>
                      )}
                    </div>
                    <span
                      className="text-sm font-bold flex-shrink-0"
                      style={{ color: barColor }}
                    >
                      {label}
                    </span>
                  </div>
                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                    {/* 基準線（1.0 = 33%位置） */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-gray-400 z-10"
                      style={{ left: "33%" }}
                    />
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>
                  {cost.notes && (
                    <p className="text-xs text-gray-500 mt-1">{cost.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block bg-green-600" />
            削減（1.0未満）
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block bg-red-600" />
            増加（1.0以上）
          </div>
          <span className="text-gray-400">縦線 = コスト変化なし（基準）</span>
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
                    <td className="py-3 px-3 text-xs text-gray-600">
                      {vendor.cloud_platform ?? "—"}
                      {!vendor.cloud_confirmed && vendor.cloud_platform && (
                        <span className="text-gray-400">?</span>
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
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-600">
                      {evalData?.label ?? "—"}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500">
                      {evalData?.detail ?? "データ収集中"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 注記 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-500">
          <span className="font-semibold text-gray-600">データソース:</span>{" "}
          デジタル庁先行事業TCO検証・中核市市長会調査（2025）
        </p>
        <p className="text-xs text-gray-400 mt-1">
          ※ change_ratio は移行前コストを1.0とした比率。1.0未満 = コスト削減、1.0以上 = コスト増。
          判明分のみ集計のため、実態との乖離がある場合があります。
        </p>
      </div>
    </div>
  );
}
