import type { Metadata } from "next";
import { CostReport, Vendor } from "@/lib/supabase";

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
    note: "OCI基盤。Oracle DB親和性でライセンスコスト削減可能。比較的低コスト。",
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
    mark: "◎", markColor: "#007a3d", cloud: "GCP",
    note: "Google Cloud Partner Top Engineer受賞。長野県系自治体DXはGCP中心（木曽町等）。",
  },
  日立: {
    ratioMin: 1.3, ratioMax: 2.2, ratioTypical: 1.6,
    mark: "○", markColor: "#1d6fa4", cloud: "AWS",
    note: "ADWORLD全20業務AWS対応。大規模自治体向け。",
  },
};

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
  return `+${((ratio - 1) * 100).toFixed(0)}%増加`;
}

function toPercent(ratio: number): string {
  if (ratio < 1.0) return `-${((1 - ratio) * 100).toFixed(0)}%`;
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
    label: "コスト低○",
    detail: "OCI採用。Oracle DB親和性でライセンスコスト削減可能（RKKCS公式）",
    mark: "○", markColor: "#1d6fa4", cloud: "OCI", confirmed: true,
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
    label: "GCP特化◎",
    detail: "Google Cloud Partner Top Engineer受賞複数。長野県系自治体DXはGCP中心（木曽町校務DX等）",
    mark: "◎", markColor: "#007a3d", cloud: "GCP", confirmed: true,
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
    // 最も多く採用しているベンダーを主ベンダーとする
    const primaryVendor = Object.entries(info.vendorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "不明";
    const est = VENDOR_COST_ESTIMATE[primaryVendor];
    return {
      municipality_id: mid,
      city: info.city,
      prefecture: info.prefecture,
      primaryVendor,
      cloud: est?.cloud ?? "不明",
      ratioTypical: est?.ratioTypical ?? 1.5,
      ratioMin: est?.ratioMin ?? 1.0,
      ratioMax: est?.ratioMax ?? 2.5,
      mark: est?.mark ?? "—",
      markColor: est?.markColor ?? "#9ca3af",
    };
  }).sort((a, b) => b.ratioTypical - a.ratioTypical);

  const estimateTop30 = muniEstimates.slice(0, 30);

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
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {/* 目標（緑） */}
          <div className="bg-green-700 p-6 text-white">
            <p className="text-green-200 text-xs font-semibold uppercase tracking-wider mb-1">当初目標</p>
            <p className="text-5xl font-extrabold leading-none tabular-nums">−30%</p>
            <p className="text-green-200 text-sm mt-2">標準化・共同利用でコスト削減</p>
          </div>
          {/* 現実 平均（赤） */}
          <div className="bg-red-600 p-6 text-white">
            <p className="text-red-200 text-xs font-semibold uppercase tracking-wider mb-1">実態 平均（判明分）</p>
            <p className="text-5xl font-extrabold leading-none tabular-nums">
              {avgRatio != null ? toPercent(avgRatio) : "+60〜130%"}
            </p>
            <p className="text-red-200 text-sm mt-2">
              {minRatio != null && maxRatio != null
                ? `範囲: ${toPercent(minRatio)} 〜 ${toPercent(maxRatio)}`
                : "自治体規模・ベンダーにより差異"}
            </p>
          </div>
          {/* 最悪事例（深紅） */}
          <div className="p-6 text-white" style={{ backgroundColor: "#7f1d1d" }}>
            <p className="text-red-300 text-xs font-semibold uppercase tracking-wider mb-1">最悪事例（中核市）</p>
            <p className="text-5xl font-extrabold leading-none tabular-nums">
              {maxRatio != null ? toPercent(maxRatio) : "+470%"}
            </p>
            <p className="text-red-300 text-sm mt-2">目標比で約{maxRatio != null ? Math.round((maxRatio - 0.7) / 0.7 * 100) : 800}%乖離</p>
          </div>
        </div>
        <div className="bg-amber-50 px-6 py-3 border-t border-amber-200 flex items-center gap-2">
          <span className="text-amber-600 text-sm">⚠️</span>
          <p className="text-xs text-amber-700 font-medium">
            目標は「−30%」だったが、実態は大半の自治体で<strong>コスト増加</strong>。特に中小自治体・大規模カスタマイズ先で顕著。
          </p>
        </div>
      </div>

      {/* コスト変化ランキング */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          コスト変化実績
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          移行前コストを0%基準として、増減率で表示。出典: デジタル庁先行事業TCO検証・中核市市長会調査（2025）
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
              const isHighlight = cost.change_ratio <= 0.95;

              return (
                <div
                  key={cost.id}
                  className="rounded-lg border p-4"
                  style={{
                    borderColor: isReduction ? "#bbf7d0" : "#fecaca",
                    backgroundColor: isReduction ? "#f0fdf4" : cost.change_ratio >= 3 ? "#fff1f2" : "#fff5f5",
                  }}
                >
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {isHighlight ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-600 text-white flex-shrink-0">
                          ✓ 削減事例
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: barColor + "20", color: barColor }}>
                          ▲ コスト増
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex-shrink-0">{cost.scope}</span>
                      {vendorName !== "—" && <span className="text-xs text-gray-400">{vendorName}</span>}
                    </div>
                    <span className="text-2xl font-extrabold flex-shrink-0 tabular-nums" style={{ color: barColor }}>
                      {label}
                    </span>
                  </div>
                  {/* バー */}
                  <div className="relative h-5 rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
                    <div className="absolute top-0 bottom-0 w-0.5 z-10" style={{ left: "16.7%", backgroundColor: "#9ca3af" }} />
                    <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
                    <span className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-bold text-white tabular-nums" style={{ mixBlendMode: "difference" }}>
                      {pctChange.toFixed(0)}%{isReduction ? "↓" : "↑"}
                    </span>
                  </div>
                  {cost.notes && (
                    <p className="text-xs mt-2 font-medium" style={{ color: "var(--color-text-secondary)" }}>{cost.notes}</p>
                  )}
                </div>
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
                          color: evalData.cloud === "AWS" ? "#FF9900" : evalData.cloud === "OCI" ? "#F80000" : evalData.cloud === "Azure" ? "#0078D4" : "#6b7280"
                        }}>
                          {evalData.cloud}
                          {evalData.confirmed && <span className="ml-1 text-green-600">✓</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300">調査中</span>
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

      {/* 自治体別コスト影響推定 */}
      {muniEstimates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#d97706" }} />
            自治体別コスト影響推定
            <span className="text-xs font-normal text-gray-400 ml-1">（上位30件 / 全{muniEstimates.length}件）</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            municipality_packages × vendors × コスト調査レポートを紐付けた推定値。実際の請求額ではありません。
            主ベンダー（最多採用パッケージ）のコスト変化レンジを適用。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">#</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">都道府県</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">市区町村</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">主ベンダー</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">クラウド</th>
                  <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">推定増加率</th>
                  <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">増加レンジ</th>
                  <th className="text-center py-2 px-2 text-xs text-gray-500 font-medium">評価</th>
                </tr>
              </thead>
              <tbody>
                {estimateTop30.map((item, i) => {
                  const isHigh = item.ratioTypical >= 1.8;
                  const cloudColor = item.cloud === "AWS" ? "#FF9900" : item.cloud === "OCI" ? "#F80000" : item.cloud === "Azure" ? "#0078D4" : "#6b7280";
                  return (
                    <tr
                      key={item.municipality_id}
                      className={`border-b border-gray-50 hover:bg-orange-50 transition-colors ${isHigh ? "bg-orange-50/40" : ""}`}
                    >
                      <td className="py-2 px-2 text-xs text-gray-400">{i + 1}</td>
                      <td className="py-2 px-2 text-xs text-gray-500">{item.prefecture}</td>
                      <td className="py-2 px-2 font-medium text-gray-800">{item.city}</td>
                      <td className="py-2 px-2 text-xs text-gray-600">{item.primaryVendor}</td>
                      <td className="py-2 px-2">
                        <span className="text-xs font-medium" style={{ color: cloudColor }}>{item.cloud}</span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
                          style={{
                            backgroundColor: isHigh ? "#fee2e2" : "#fef3c7",
                            color: isHigh ? "#b91c1c" : "#d97706",
                          }}
                        >
                          {toPercent(item.ratioTypical)}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs text-gray-400 tabular-nums">
                        {toPercent(item.ratioMin)}〜{toPercent(item.ratioMax)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="font-bold" style={{ color: item.markColor }}>{item.mark}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              ⚠️ 推定値（参考）: ベンダー種別ごとのコスト変化レンジを自治体に紐付けた推計。
              実際のコストは契約・規模・移行状況により大きく異なります。
              出典: デジタル庁TCO検証・中核市市長会調査・総務省地方財政調査を基に推定。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
