import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import { Municipality } from "@/lib/types";
import RiskFilter from "./RiskFilter";

export const metadata: Metadata = {
  title: "遅延リスク 自治体一覧 | 自治体標準化ダッシュボード",
};

export default function RisksPage() {
  const riskMunicipalities: Municipality[] =
    data.risk_municipalities as Municipality[];

  // 各自治体の「最も遅れている業務」を算出
  const rows = riskMunicipalities.map((muni, i) => {
    const rates = muni.business_rates;
    const entries = Object.entries(rates).filter(
      ([, v]) => v !== null && v !== undefined
    ) as [string, number][];

    let worstBusiness = "—";
    let worstRate = 0;

    if (entries.length > 0) {
      const [name, rate] = entries.reduce((prev, curr) =>
        curr[1] < prev[1] ? curr : prev
      );
      worstBusiness = name;
      worstRate = rate;
    }

    return {
      rank: i + 1,
      prefecture: muni.prefecture,
      city: muni.city,
      overall_rate: muni.overall_rate ?? 0,
      worst_business: worstBusiness,
      worst_rate: worstRate,
    };
  });

  // 都道府県一覧（重複排除・五十音順）
  const prefectures = [...new Set(riskMunicipalities.map((m) => m.prefecture))].sort();

  // 全自治体数・危機率
  const TOTAL_MUNICIPALITIES = 1741;
  const riskRatio = (riskMunicipalities.length / TOTAL_MUNICIPALITIES) * 100;

  // 完了率分布
  const dist = {
    critical: rows.filter((r) => r.overall_rate < 10).length,   // 10%未満
    danger:   rows.filter((r) => r.overall_rate >= 10 && r.overall_rate < 25).length, // 10-25%
    warning:  rows.filter((r) => r.overall_rate >= 25 && r.overall_rate < 50).length, // 25-50%
  };

  // 平均完了率
  const avgRate = rows.length > 0
    ? rows.reduce((s, r) => s + r.overall_rate, 0) / rows.length
    : 0;

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="pb-2">
        <h1 className="page-title">遅延リスク 自治体一覧</h1>
        <p className="page-subtitle">
          2026年3月31日の移行期限に向け、完了率50%未満の自治体一覧
        </p>
      </div>

      {/* 全体サマリー */}
      <div className="card p-5">
        {/* メインKPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#b91c1c" }}>
              {riskRatio.toFixed(1)}%
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>全自治体の危機率</p>
            <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
              {riskMunicipalities.length} / {TOTAL_MUNICIPALITIES.toLocaleString()}自治体
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#d97706" }}>
              {avgRate.toFixed(1)}%
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>危機自治体の平均完了率</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--color-brand-secondary)" }}>
              {prefectures.length}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>対象都道府県</p>
          </div>
          <div className="text-center">
            <p className="text-base font-extrabold" style={{ color: "#b91c1c" }}>
              2026/3/31
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>移行期限まで</p>
            <p className="text-xs tabular-nums font-semibold" style={{ color: "#b91c1c" }}>
              {Math.max(0, Math.ceil((new Date("2026-03-31").getTime() - Date.now()) / 86400000))}日
            </p>
          </div>
        </div>

        {/* 危機レベル分布 */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
            危機レベル分布（完了率別）
          </p>
          <div className="flex rounded-lg overflow-hidden h-7 text-xs font-bold">
            {dist.critical > 0 && (
              <div
                className="flex items-center justify-center text-white"
                style={{ width: `${(dist.critical / rows.length) * 100}%`, backgroundColor: "#b91c1c" }}
                title={`危険: ${dist.critical}件`}
              >
                {dist.critical}件
              </div>
            )}
            {dist.danger > 0 && (
              <div
                className="flex items-center justify-center text-white"
                style={{ width: `${(dist.danger / rows.length) * 100}%`, backgroundColor: "#d97706" }}
                title={`警戒: ${dist.danger}件`}
              >
                {dist.danger}件
              </div>
            )}
            {dist.warning > 0 && (
              <div
                className="flex items-center justify-center"
                style={{ width: `${(dist.warning / rows.length) * 100}%`, backgroundColor: "#fef3c7", color: "#92400e" }}
                title={`注意: ${dist.warning}件`}
              >
                {dist.warning}件
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#b91c1c" }} />危険 &lt;10%</span>
            <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#d97706" }} />警戒 10-25%</span>
            <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ backgroundColor: "#fef3c7", border: "1px solid #d97706" }} />注意 25-50%</span>
          </div>
        </div>
      </div>

      {/* テーブル（フィルター付き Client Component） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <RiskFilter rows={rows} prefectures={prefectures} />
      </div>
    </div>
  );
}
