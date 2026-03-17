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

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          遅延リスク 自治体一覧
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          2026年3月31日の移行期限に向け、完了率50%未満の自治体一覧
        </p>
      </div>

      {/* サマリーバッジ */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          <span className="text-xs text-red-600 font-medium">表示件数</span>
          <p className="text-xl font-bold text-red-700">
            {riskMunicipalities.length}
            <span className="text-sm font-normal text-red-500 ml-1">件</span>
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
          <span className="text-xs text-gray-500 font-medium">対象都道府県</span>
          <p className="text-xl font-bold text-gray-700">
            {prefectures.length}
            <span className="text-sm font-normal text-gray-400 ml-1">都道府県</span>
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
          <span className="text-xs text-orange-600 font-medium">移行期限</span>
          <p className="text-base font-bold text-orange-700">
            2026年3月31日
          </p>
        </div>
      </div>

      {/* テーブル（フィルター付き Client Component） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <RiskFilter rows={rows} prefectures={prefectures} />
      </div>
    </div>
  );
}
