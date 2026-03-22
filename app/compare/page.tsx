import type { Metadata } from "next";
import data from "@/public/data/standardization.json";
import { Municipality, StandardizationData } from "@/lib/types";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title:
    "自治体比較｜複数団体のサイドバイサイド比較 | ガバメントクラウド移行状況ダッシュボード",
  description:
    "最大4つの自治体を選択し、進捗率・業務別完了状況・基本情報を一覧比較。レーダーチャートで多角的な分析が可能。",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  const typedData = data as StandardizationData;
  const municipalities = typedData.municipalities as Municipality[];
  const dataMonth = typedData.summary.data_month;

  // Build a list of { prefecture, city } for autocomplete
  const muniList = municipalities.map((m) => ({
    prefecture: m.prefecture,
    city: m.city,
    overall_rate: m.overall_rate ?? 0,
    business_rates: m.business_rates,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">自治体比較</h1>
        <p className="page-subtitle">
          最大4つの自治体を選択して進捗を比較（データ基準: {dataMonth}）
        </p>
      </div>

      <CompareClient municipalities={muniList} dataMonth={dataMonth} />
    </div>
  );
}
