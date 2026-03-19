import Link from "next/link";
import data from "@/public/data/standardization.json";
import { PrefectureSummary } from "@/lib/types";

// ダッシュボードと統一した色分けロジック（指定カラートークン準拠）
function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445"; // FinOps Green
  if (rate >= 0.7) return "#1D4ED8"; // Primary Blue
  if (rate >= 0.5) return "#FA6414"; // Accent Orange
  return "#b91c1c";                  // Red
}

function getStatusLabel(rate: number): string {
  if (rate >= 1.0) return "完了";
  if (rate >= 0.8) return "順調";
  if (rate >= 0.5) return "要注意";
  return "危機";
}

function getStatusBadgeStyle(rate: number): { bg: string; text: string } {
  if (rate >= 0.9) return { bg: "#d1fae5", text: "#166534" }; // Green
  if (rate >= 0.7) return { bg: "#dbeafe", text: "#1e40af" }; // Blue
  if (rate >= 0.5) return { bg: "#fff7ed", text: "#c2410c" }; // Orange
  return { bg: "#fee2e2", text: "#991b1b" };                  // Red
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

export default function PrefecturesPage() {
  // 完了率の低い順に並べる（昇順）
  const sortedPrefectures: PrefectureSummary[] = [...data.prefectures].sort(
    (a, b) => a.avg_rate - b.avg_rate
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">都道府県別 標準化進捗</h1>
        <p className="page-subtitle">
          完了率の低い順に表示（データ基準: {data.summary.data_month}）
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--color-gov-primary)" }}>
                <th className="text-center py-3 px-3 text-xs font-medium w-14" style={{ color: "#ffffff" }}>
                  順位
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium" style={{ color: "#ffffff" }}>
                  都道府県
                </th>
                <th className="text-left py-3 px-3 text-xs font-medium min-w-[180px]" style={{ color: "#ffffff" }}>
                  平均完了率
                </th>
                <th className="text-right py-3 px-3 text-xs font-medium" style={{ color: "#ffffff" }}>
                  自治体数
                </th>
                <th className="text-right py-3 px-3 text-xs font-medium" style={{ color: "#ffffff" }}>
                  完了数
                </th>
                <th className="text-right py-3 px-3 text-xs font-medium" style={{ color: "#ffffff" }}>
                  危機数
                </th>
                <th className="text-center py-3 px-3 text-xs font-medium" style={{ color: "#ffffff" }}>
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPrefectures.map((pref, i) => {
                const rank = i + 1;
                const pct = pref.avg_rate * 100;
                const color = getRateColor(pref.avg_rate);
                const badgeStyle = getStatusBadgeStyle(pref.avg_rate);
                const statusLabel = getStatusLabel(pref.avg_rate);
                // URLエンコードした都道府県名でリンク先を生成
                const href = `/prefectures/${encodeURIComponent(pref.prefecture)}`;

                return (
                  <tr
                    key={pref.prefecture}
                    className="table-row-hover border-b border-gray-100 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-xs text-gray-400 font-medium">
                      {rank}
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={href}
                        className="font-medium hover:underline transition-colors"
                      >
                        {pref.prefecture}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden min-w-[100px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold w-12 flex-shrink-0"
                          style={{ color }}
                        >
                          {formatRate(pref.avg_rate)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      {pref.count}
                    </td>
                    <td className="py-3 px-3 text-right font-medium" style={{ color: "#378445" }}>
                      {pref.completed}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        style={{
                          color: pref.critical > 0 ? "#b91c1c" : "#9ca3af",
                          fontWeight: pref.critical > 0 ? 700 : 400,
                        }}
                      >
                        {pref.critical}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                      >
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
