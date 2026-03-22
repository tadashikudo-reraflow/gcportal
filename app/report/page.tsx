import type { Metadata } from "next";
import ReportClient from "./ReportClient";

export const metadata: Metadata = {
  title: "無料レポート - ガバメントクラウド移行 最終結果レポート 2026 | GCInsight",
  description:
    "全国1,741自治体のガバメントクラウド移行最終結果を完全網羅。都道府県別進捗率・コスト分析・推奨事項を無料PDFでダウンロード。",
  alternates: { canonical: "/report" },
};

export default function ReportPage() {
  return <ReportClient />;
}
