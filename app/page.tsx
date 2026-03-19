import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import Link from "next/link";

type StandardMunicipality = {
  prefecture: string;
  city: string;
  overall_rate: number;
  business_rates: Record<string, number>;
};

// 5段階ステータス（完了・順調・要注意・危機・特定移行）
function getStatus(rate: number, isTokutei: boolean): "tokutei" | "complete" | "ontrack" | "atrisk" | "critical" {
  if (isTokutei) return "tokutei";
  if (rate >= 1.0) return "complete";
  if (rate >= 0.75) return "ontrack";
  if (rate >= 0.5) return "atrisk";
  return "critical";
}

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#FA6414";
  return "#b91c1c";
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

function calcRemainingDays(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline + "T23:59:59+09:00");
  const diff = deadlineDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const { summary, prefectures, businesses, risk_municipalities } = data;
  const allMunis = (data as { municipalities: StandardMunicipality[] }).municipalities;

  // 特定移行認定Set（prefecture/city キー）
  const tokuteiSet = new Set<string>(
    (tokuteiData.municipalities as { prefecture: string; city: string }[]).map(
      (m) => `${m.prefecture}/${m.city}`
    )
  );
  const TOKUTEI_COUNT = tokuteiData.total_count as number;
  const TOTAL = summary.total; // 1741

  // 全自治体を5段階で分類
  let completeCount = 0;
  let ontrackCount = 0;
  let atriskCount = 0;
  let criticalCount = 0;

  for (const m of allMunis) {
    const isTokutei = tokuteiSet.has(`${m.prefecture}/${m.city}`);
    if (isTokutei) continue;
    const s = getStatus(m.overall_rate, false);
    if (s === "complete") completeCount++;
    else if (s === "ontrack") ontrackCount++;
    else if (s === "atrisk") atriskCount++;
    else criticalCount++;
  }

  // 遅延リスク（特定移行を除外した危機自治体）
  const riskMunis = risk_municipalities.filter(
    (m) => !tokuteiSet.has(`${m.prefecture}/${m.city}`)
  );
  const top20Risk = riskMunis.slice(0, 20);

  const remainingDays = calcRemainingDays(summary.deadline);
  const completionPct = (summary.avg_rate * 100).toFixed(1);
  const completedPct = ((completeCount / TOTAL) * 100).toFixed(1);

  // 業務別: 完了率降順
  const sortedBusinesses = [...businesses].sort((a, b) => b.avg_rate - a.avg_rate);

  // 都道府県別: 完了率降順
  const sortedPrefectures = [...prefectures].sort((a, b) => b.avg_rate - a.avg_rate);
  const topPrefectures = sortedPrefectures.slice(0, 10);
  const bottomPrefectures = sortedPrefectures.slice(-5).reverse();

  return (
    <div className="space-y-6">
      {/* ① 緊急アラートバナー */}
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
            全国 {TOTAL.toLocaleString()} 自治体のうち完了は{" "}
            {completeCount} 自治体（{completedPct}%）、
            特定移行認定 {TOKUTEI_COUNT.toLocaleString()} 自治体を含む
          </p>
        </div>
        <p className="text-xs flex-shrink-0" style={{ color: "#991b1b" }}>
          基準: {summary.data_month}
        </p>
      </div>

      {/* ② 5段階ステータスKPIカード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* 完了 */}
        <div className="card p-4 text-center" style={{ borderTop: "3px solid #378445" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#378445" }}>
            {completeCount}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: "#378445" }}>完了</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            ({((completeCount / TOTAL) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>100%完了</p>
        </div>

        {/* 順調 */}
        <div className="card p-4 text-center" style={{ borderTop: "3px solid #1D4ED8" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#1D4ED8" }}>
            {ontrackCount}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: "#1D4ED8" }}>順調</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            ({((ontrackCount / TOTAL) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>75%以上</p>
        </div>

        {/* 要注意 */}
        <div className="card p-4 text-center" style={{ borderTop: "3px solid var(--color-status-warn)" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--color-status-warn)" }}>
            {atriskCount}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: "var(--color-status-warn)" }}>要注意</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            ({((atriskCount / TOTAL) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>50〜75%</p>
        </div>

        {/* 危機 */}
        <div className="card p-4 text-center" style={{ borderTop: "3px solid #b91c1c" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#b91c1c" }}>
            {criticalCount}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: "#b91c1c" }}>危機</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            ({((criticalCount / TOTAL) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>50%未満</p>
        </div>

        {/* 特定移行 */}
        <Link href="/tokutei" className="card p-4 text-center hover:shadow-md transition-shadow block" style={{ borderTop: "3px solid #7c3aed" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#7c3aed" }}>
            {TOKUTEI_COUNT.toLocaleString()}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: "#7c3aed" }}>特定移行</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            ({((TOKUTEI_COUNT / TOTAL) * 100).toFixed(1)}%)
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>認定団体 →</p>
        </Link>
      </div>

      {/* ステータス凡例バー */}
      <div className="card px-5 py-3">
        <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
          全 {TOTAL.toLocaleString()} 自治体のステータス分布
        </p>
        <div className="flex rounded-full overflow-hidden h-6">
          <div style={{ width: `${(completeCount / TOTAL) * 100}%`, backgroundColor: "#378445" }} title={`完了: ${completeCount}`} />
          <div style={{ width: `${(ontrackCount / TOTAL) * 100}%`, backgroundColor: "#1D4ED8" }} title={`順調: ${ontrackCount}`} />
          <div style={{ width: `${(atriskCount / TOTAL) * 100}%`, backgroundColor: "#FA6414" }} title={`要注意: ${atriskCount}`} />
          <div style={{ width: `${(criticalCount / TOTAL) * 100}%`, backgroundColor: "#b91c1c" }} title={`危機: ${criticalCount}`} />
          <div style={{ width: `${(TOKUTEI_COUNT / TOTAL) * 100}%`, backgroundColor: "#7c3aed" }} title={`特定移行: ${TOKUTEI_COUNT}`} />
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {[
            { label: "完了", color: "#378445", count: completeCount },
            { label: "順調", color: "#1D4ED8", count: ontrackCount },
            { label: "要注意", color: "#FA6414", count: atriskCount },
            { label: "危機", color: "#b91c1c", count: criticalCount },
            { label: "特定移行", color: "#7c3aed", count: TOKUTEI_COUNT },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: s.color }} />
              {s.label}: {s.count.toLocaleString()}
            </span>
          ))}
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
          全国 {TOTAL.toLocaleString()} 自治体（特定移行含む）の業務ごとの<strong>平均</strong>完了率。
        </p>
        <div className="space-y-1.5">
          {sortedBusinesses.map((biz) => {
            const pct = biz.avg_rate * 100;
            const barColor = getRateColor(biz.avg_rate);
            return (
              <div key={biz.business} className="flex items-center gap-3">
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
                      <span className="font-bold" style={{ color: getRateColor(pref.avg_rate) }}>
                        {formatRate(pref.avg_rate)}
                      </span>
                    </td>
                    <td className="py-2 text-right" style={{ color: "#007a3d" }}>{pref.completed}</td>
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
                      <span className="font-bold" style={{ color: getRateColor(pref.avg_rate) }}>
                        {formatRate(pref.avg_rate)}
                      </span>
                    </td>
                    <td className="py-2 text-right" style={{ color: "#007a3d" }}>{pref.completed}</td>
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
            「特定移行」ってなに？
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            デジタル庁が認定した<strong>特定移行支援システム</strong>の対象自治体（{TOKUTEI_COUNT.toLocaleString()}団体）は、
            2026年3月末の期限が適用されない別途スケジュールが設定されます。
            「遅延」や「危機」とは異なる扱いです。
          </p>
          <Link href="/tokutei" className="text-xs font-medium underline mt-1.5 inline-block" style={{ color: "var(--color-gov-primary)" }}>
            特定移行認定団体を見る →
          </Link>
        </div>
      </div>

      {/* ⑤ 遅延リスク自治体TOP20テーブル（特定移行除外） */}
      <div className="card p-6">
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block" style={{ backgroundColor: "#c8102e" }} />
          遅延リスク自治体 TOP20
          <span className="ml-1 text-xs text-gray-400 font-normal">※特定移行認定団体を除く</span>
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          完了率50%未満かつ特定移行認定を受けていない自治体（全{riskMunis.length}件中TOP20）
        </p>
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
                const rate = muni.overall_rate ?? 0;
                return (
                  <tr
                    key={`${muni.prefecture}-${muni.city}`}
                    className="border-b border-gray-50 hover:bg-red-50 transition-colors"
                  >
                    <td className="py-2.5 px-2 text-xs text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-2 text-gray-600 text-xs">{muni.prefecture}</td>
                    <td className="py-2.5 px-2 font-medium text-gray-800">{muni.city}</td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="font-bold text-sm" style={{ color: getRateColor(rate) }}>
                        {formatRate(rate)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        危機
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
            全 {riskMunis.length} 件中 TOP20 を表示
          </p>
          <Link
            href="/risks"
            className="text-xs font-medium hover:underline"
            style={{ color: "#003087" }}
          >
            全件表示 →
          </Link>
        </div>
      </div>
    </div>
  );
}
