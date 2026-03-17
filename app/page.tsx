import data from "@/public/data/standardization.json";

// 完了率に応じた色クラスを返す
function getRateColor(rate: number): string {
  if (rate >= 1.0) return "#007a3d";
  if (rate >= 0.8) return "#1d6fa4";
  if (rate >= 0.5) return "#d97706";
  return "#c8102e";
}

function getRateBgClass(rate: number): string {
  if (rate >= 1.0) return "bg-green-100 text-green-800";
  if (rate >= 0.8) return "bg-blue-100 text-blue-800";
  if (rate >= 0.5) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function getStatusLabel(rate: number): string {
  if (rate >= 1.0) return "完了";
  if (rate >= 0.8) return "順調";
  if (rate >= 0.5) return "要注意";
  return "危機";
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

// 残り日数計算（ビルド時点）
function calcRemainingDays(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline + "T23:59:59+09:00");
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const { summary, prefectures, businesses, risk_municipalities } = data;

  const remainingDays = calcRemainingDays(summary.deadline);
  const completionPct = (summary.avg_rate * 100).toFixed(1);
  const completedPct = ((summary.completed_count / summary.total) * 100).toFixed(1);

  // 業務別: 完了率降順
  const sortedBusinesses = [...businesses].sort((a, b) => b.avg_rate - a.avg_rate);

  // 都道府県別: 完了率降順
  const sortedPrefectures = [...prefectures].sort((a, b) => b.avg_rate - a.avg_rate);
  const topPrefectures = sortedPrefectures.slice(0, 10);
  const bottomPrefectures = sortedPrefectures.slice(-5).reverse();

  // 遅延リスクTOP20
  const top20Risk = risk_municipalities.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* ① 緊急アラートバナー */}
      <div
        className="rounded-lg p-4 text-white"
        style={{ backgroundColor: "#c8102e" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-lg">
                {summary.deadline} 移行期限まであと{" "}
                <span className="text-3xl font-extrabold">{remainingDays}</span>{" "}
                日
              </p>
              <p className="text-red-100 text-sm mt-0.5">
                全国 {summary.total.toLocaleString()} 自治体のうち完了は{" "}
                <strong>{summary.completed_count}</strong> 自治体（{completedPct}%）
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-red-100 text-xs">データ基準: {summary.data_month}</p>
          </div>
        </div>
      </div>

      {/* ② KPIカード 4つ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 全体完了率 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            全体完了率
          </p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: "#1d6fa4" }}
          >
            {completionPct}%
          </p>
          <p className="text-xs text-gray-400 mt-2">
            全 {summary.total.toLocaleString()} 自治体平均
          </p>
        </div>

        {/* 100%完了 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">
            100%完了
          </p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: "#007a3d" }}
          >
            {summary.completed_count}
            <span className="text-base font-normal text-gray-400 ml-1">自治体</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            全体の {completedPct}%
          </p>
        </div>

        {/* 危機 */}
        <div className="bg-white rounded-lg border-2 p-5 shadow-sm" style={{ borderColor: "#c8102e" }}>
          <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "#c8102e" }}>
            危機（50%未満）
          </p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: "#c8102e" }}
          >
            {summary.critical_count}
            <span className="text-base font-normal text-gray-400 ml-1">自治体</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            全体の {((summary.critical_count / summary.total) * 100).toFixed(1)}%
          </p>
        </div>

        {/* 要注意 */}
        <div className="bg-white rounded-lg border border-yellow-300 p-5 shadow-sm">
          <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide mb-1">
            要注意（50-80%）
          </p>
          <p className="text-4xl font-extrabold leading-none text-yellow-600">
            {summary.at_risk_count}
            <span className="text-base font-normal text-gray-400 ml-1">自治体</span>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            全体の {((summary.at_risk_count / summary.total) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* ③ 業務別完了率バーチャート */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span
            className="w-1 h-5 rounded-full inline-block"
            style={{ backgroundColor: "#003087" }}
          />
          業務別完了率（20業務）
        </h2>
        <div className="space-y-2">
          {sortedBusinesses.map((biz) => {
            const pct = biz.avg_rate * 100;
            const barColor = getRateColor(biz.avg_rate);
            return (
              <div key={biz.business} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-32 flex-shrink-0 text-right">
                  {biz.business}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
                <span
                  className="text-xs font-bold w-12 flex-shrink-0"
                  style={{ color: barColor }}
                >
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-500">凡例:</span>
          {[
            { label: "完了(100%)", color: "#007a3d" },
            { label: "順調(80%+)", color: "#1d6fa4" },
            { label: "要注意(50-80%)", color: "#d97706" },
            { label: "危機(<50%)", color: "#c8102e" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ④ 都道府県別ランキングテーブル */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span
            className="w-1 h-5 rounded-full inline-block"
            style={{ backgroundColor: "#003087" }}
          />
          都道府県別ランキング
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 上位10 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">上位 10 都道府県</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">順位</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">都道府県</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">完了率</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">自治体数</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">完了</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">危機</th>
                </tr>
              </thead>
              <tbody>
                {topPrefectures.map((pref, i) => (
                  <tr key={pref.prefecture} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-xs text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-800">{pref.prefecture}</td>
                    <td className="py-2 text-right">
                      <span
                        className="font-bold"
                        style={{ color: getRateColor(pref.avg_rate) }}
                      >
                        {formatRate(pref.avg_rate)}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-600">{pref.count}</td>
                    <td className="py-2 text-right" style={{ color: "#007a3d" }}>
                      {pref.completed}
                    </td>
                    <td className="py-2 text-right" style={{ color: pref.critical > 0 ? "#c8102e" : "#9ca3af" }}>
                      {pref.critical}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 下位5 */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              下位 5 都道府県{" "}
              <span className="text-red-400 font-normal">（要重点対応）</span>
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">順位</th>
                  <th className="text-left py-2 text-xs text-gray-500 font-medium">都道府県</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">完了率</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">自治体数</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">完了</th>
                  <th className="text-right py-2 text-xs text-gray-500 font-medium">危機</th>
                </tr>
              </thead>
              <tbody>
                {bottomPrefectures.map((pref, i) => (
                  <tr key={pref.prefecture} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-xs text-gray-400">{47 - i}</td>
                    <td className="py-2 font-medium text-gray-800">{pref.prefecture}</td>
                    <td className="py-2 text-right">
                      <span
                        className="font-bold"
                        style={{ color: getRateColor(pref.avg_rate) }}
                      >
                        {formatRate(pref.avg_rate)}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-600">{pref.count}</td>
                    <td className="py-2 text-right" style={{ color: "#007a3d" }}>
                      {pref.completed}
                    </td>
                    <td className="py-2 text-right" style={{ color: pref.critical > 0 ? "#c8102e" : "#9ca3af" }}>
                      {pref.critical}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ⑤ 遅延リスク自治体TOP20テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#c8102e" }} />
          遅延リスク自治体 TOP20
          <span className="ml-1 text-xs text-gray-400 font-normal">（完了率下位100件より抜粋）</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">順位</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">都道府県</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">市区町村</th>
                <th className="text-right py-2 px-2 text-xs text-gray-500 font-medium">完了率</th>
                <th className="text-left py-2 px-2 text-xs text-gray-500 font-medium">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {top20Risk.map((muni, i) => {
                const rate = muni.overall_rate;
                const statusLabel = getStatusLabel(rate);
                const badgeClass = getRateBgClass(rate);
                return (
                  <tr
                    key={`${muni.prefecture}-${muni.city}`}
                    className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-xs text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-2 text-gray-600 text-xs">{muni.prefecture}</td>
                    <td className="py-2.5 px-2 font-medium text-gray-800">{muni.city}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className="font-bold text-sm"
                        style={{ color: getRateColor(rate) }}
                      >
                        {formatRate(rate)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
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
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            全 {data.risk_municipalities.length} 件中 TOP20 を表示
          </p>
          <a
            href="/risks"
            className="text-xs font-medium hover:underline"
            style={{ color: "#003087" }}
          >
            全件表示 →
          </a>
        </div>
      </div>
    </div>
  );
}
