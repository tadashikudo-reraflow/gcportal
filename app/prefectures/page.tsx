import Link from "next/link";
import data from "@/public/data/standardization.json";
import { PrefectureSummary } from "@/lib/types";

function getRateColor(rate: number): string {
  if (rate >= 1.0) return "text-green-600";
  if (rate >= 0.8) return "text-blue-600";
  if (rate >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

function getRateBarColor(rate: number): string {
  if (rate >= 1.0) return "bg-green-500";
  if (rate >= 0.8) return "bg-blue-400";
  if (rate >= 0.5) return "bg-yellow-400";
  return "bg-red-500";
}

function getStatusLabel(rate: number): string {
  if (rate >= 1.0) return "完了";
  if (rate >= 0.8) return "順調";
  if (rate >= 0.5) return "要注意";
  return "危機";
}

function getStatusBadgeClass(rate: number): string {
  if (rate >= 1.0) return "bg-green-100 text-green-700";
  if (rate >= 0.8) return "bg-blue-100 text-blue-700";
  if (rate >= 0.5) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
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
        <h1 className="text-2xl font-bold text-gray-900">
          都道府県別 標準化進捗
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          完了率の低い順に表示（データ基準: {data.summary.data_month}）
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-medium w-14">
                  順位
                </th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium">
                  都道府県
                </th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium min-w-[180px]">
                  平均完了率
                </th>
                <th className="text-right py-3 px-3 text-xs text-gray-500 font-medium">
                  自治体数
                </th>
                <th className="text-right py-3 px-3 text-xs text-gray-500 font-medium">
                  完了数
                </th>
                <th className="text-right py-3 px-3 text-xs text-gray-500 font-medium">
                  危機数
                </th>
                <th className="text-center py-3 px-3 text-xs text-gray-500 font-medium">
                  ステータス
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPrefectures.map((pref, i) => {
                const rank = i + 1;
                const pct = pref.avg_rate * 100;
                const textColor = getRateColor(pref.avg_rate);
                const barColor = getRateBarColor(pref.avg_rate);
                const badgeClass = getStatusBadgeClass(pref.avg_rate);
                const statusLabel = getStatusLabel(pref.avg_rate);
                // URLエンコードした都道府県名でリンク先を生成
                const href = `/prefectures/${encodeURIComponent(pref.prefecture)}`;

                return (
                  <tr
                    key={pref.prefecture}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-3 text-center text-xs text-gray-400 font-medium">
                      {rank}
                    </td>
                    <td className="py-3 px-3">
                      <Link
                        href={href}
                        className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                      >
                        {pref.prefecture}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden min-w-[100px]">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold w-12 flex-shrink-0 ${textColor}`}>
                          {formatRate(pref.avg_rate)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      {pref.count}
                    </td>
                    <td className="py-3 px-3 text-right text-green-600 font-medium">
                      {pref.completed}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={
                          pref.critical > 0
                            ? "text-red-600 font-bold"
                            : "text-gray-400"
                        }
                      >
                        {pref.critical}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}
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
