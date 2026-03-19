import data from "@/public/data/standardization.json";

// 完了率に応じた色を返す（指定カラートークン準拠）
function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445"; // FinOps Green: 90%以上
  if (rate >= 0.7) return "#1D4ED8"; // Primary Blue: 70-89%
  if (rate >= 0.5) return "#FA6414"; // Accent Orange: 50-69%
  return "#b91c1c";                  // Red: 50%未満
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
      {/* ① 緊急アラートバナー — controlled urgency（フルレッド背景を廃止） */}
      <div className="alert-banner">
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0" style={{ color: "var(--color-status-critical)" }}
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {summary.deadline} 移行期限まであと{" "}
            <strong style={{ color: "var(--color-status-critical)", fontSize: "1rem" }}>
              {remainingDays}日
            </strong>
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#991b1b" }}>
            全国 {summary.total.toLocaleString()} 自治体のうち完了は{" "}
            {summary.completed_count} 自治体（{completedPct}%）
          </p>
        </div>
        <p className="text-xs flex-shrink-0" style={{ color: "#991b1b" }}>
          基準: {summary.data_month}
        </p>
      </div>

      {/* ② KPIカード 4つ — 統一 card クラス + トップアクセントボーダーでステータス区別 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 全体完了率 */}
        <div
          className="card p-5"
          style={{ borderTop: "3px solid var(--color-status-ok)" }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
            全体完了率
          </p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: "var(--color-status-ok)" }}
          >
            {completionPct}%
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
            全 {summary.total.toLocaleString()} 自治体平均
          </p>
        </div>

        {/* 100%完了 */}
        <div
          className="card p-5"
          style={{ borderTop: "3px solid var(--color-status-complete)" }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
            100%完了
          </p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: "var(--color-status-complete)" }}
          >
            {summary.completed_count}
            <span className="text-base font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
              自治体
            </span>
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
            全体の {completedPct}%
          </p>
        </div>

        {/* 危機 — border-top をオレンジに変更（赤より目を引く） */}
        <div
          className="card p-5"
          style={{ borderTop: "3px solid var(--color-accent-cta)" }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-accent-cta)" }}>
            危機（50%未満）
          </p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: "var(--color-accent-cta)" }}
          >
            {summary.critical_count}
            <span className="text-base font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
              自治体
            </span>
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
            全体の {((summary.critical_count / summary.total) * 100).toFixed(1)}%
          </p>
        </div>

        {/* 要注意 */}
        <div
          className="card p-5"
          style={{ borderTop: "3px solid var(--color-status-warn)" }}
        >
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-status-warn)" }}>
            要注意（50〜80%）
          </p>
          <p
            className="text-4xl font-extrabold leading-none"
            style={{ color: "var(--color-status-warn)" }}
          >
            {summary.at_risk_count}
            <span className="text-base font-normal ml-1" style={{ color: "var(--color-text-muted)" }}>
              自治体
            </span>
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
            全体の {((summary.at_risk_count / summary.total) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* ③ 業務別完了率バーチャート */}
      <div className="card p-6">
        <h2
          className="text-sm font-bold mb-4 flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <span
            className="w-1 h-5 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: "var(--color-gov-primary)" }}
          />
          業務別完了率（20業務）
        </h2>
        <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          全国 1,741 自治体の業務ごとの<strong>平均</strong>完了率。平均が高くても個別自治体では遅延が発生しているケースがあります（↓下のリスク表を参照）。
        </p>
        <div className="space-y-1.5">
          {sortedBusinesses.map((biz) => {
            const pct = biz.avg_rate * 100;
            const barColor = getRateColor(biz.avg_rate);
            return (
              <div key={biz.business} className="flex items-center gap-3">
                {/* w-36 → min-w-fit に変えて長い業務名でも折れないようにする */}
                <span
                  className="text-sm w-36 flex-shrink-0 text-right truncate"
                  style={{ color: "var(--color-text-secondary)" }}
                  title={biz.business}
                >
                  {biz.business}
                </span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
                <span
                  className="text-sm font-bold w-14 flex-shrink-0 text-right tabular-nums"
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
            { label: "完了(90%+)", color: "#378445" },
            { label: "順調(70-89%)", color: "#1D4ED8" },
            { label: "要注意(50-69%)", color: "#FA6414" },
            { label: "危機(<50%)", color: "#b91c1c" },
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
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
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

      {/* 📘 初見者向け読み方ガイド */}
      <div className="rounded-lg border-l-4 px-5 py-4 flex gap-4" style={{ borderLeftColor: "var(--color-gov-primary)", backgroundColor: "#f0f5ff" }}>
        <div className="text-2xl leading-none flex-shrink-0 mt-0.5">💡</div>
        <div>
          <p className="text-sm font-bold mb-1.5" style={{ color: "var(--color-gov-primary)" }}>
            「業務グラフは青いのに、なぜリスク自治体が多いの？」
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            上の<strong>業務別グラフ</strong>は全国平均のため、大多数の順調な自治体に引っ張られて高く表示されます。
            一方、下の<strong>遅延リスク表</strong>は個別の自治体単位で見ており、平均の陰に隠れた「全業務で大幅遅延している自治体」を抽出しています。
          </p>
          <p className="text-xs mt-2 flex gap-4 flex-wrap" style={{ color: "var(--color-text-muted)" }}>
            <span>📊 業務グラフ ＝ 全自治体の平均（マクロ視点）</span>
            <span>🚨 リスク表 ＝ 個別自治体の実態（ミクロ視点）</span>
          </p>
        </div>
      </div>

      {/* ⑤ 遅延リスク自治体TOP20テーブル */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
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
