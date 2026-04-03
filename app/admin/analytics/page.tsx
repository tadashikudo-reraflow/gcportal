"use client";

import { useEffect, useState } from "react";

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? "w3eqw79y26";

type MetricEntry = Record<string, unknown>;
type ClarityItem = { metricName: string; information: MetricEntry[] };

function get(data: ClarityItem[], name: string): MetricEntry | null {
  return data.find((d) => d.metricName === name)?.information?.[0] ?? null;
}

function KpiCard({
  label,
  value,
  sub,
  color = "#00338D",
  warn = false,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  warn?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${warn ? "border-amber-200" : "border-gray-100"}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color: warn ? "#d97706" : color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function BarList({
  title,
  items,
  total,
}: {
  title: string;
  items: { name: string; count: number }[];
  total: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-600 mb-3">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between text-xs text-gray-600 mb-0.5">
              <span className="truncate max-w-[70%]">{item.name}</span>
              <span className="font-medium">{item.count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((item.count / total) * 100)}%`,
                  backgroundColor: "#00338D",
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [items, setItems] = useState<ClarityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(3);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setItems(Array.isArray(json.data) ? json.data : []);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [days]);

  // 主要指標を抽出
  const traffic = get(items, "Traffic");
  const scroll = get(items, "ScrollDepth");
  const engagement = get(items, "EngagementTime");
  const deadClick = get(items, "DeadClickCount");
  const rageClick = get(items, "RageClickCount");
  const quickback = get(items, "QuickbackClick");

  const sessions = Number(traffic?.totalSessionCount ?? 0);
  const users = Number(traffic?.distinctUserCount ?? 0);
  const pagesPerSession = Number(traffic?.pagesPerSessionPercentage ?? 0).toFixed(1);
  const scrollDepth = Number(scroll?.averageScrollDepth ?? 0).toFixed(1);
  const activeTimeSec = Number(engagement?.activeTime ?? 0);
  const engagementStr =
    activeTimeSec >= 60
      ? `${(activeTimeSec / 60).toFixed(1)}分`
      : `${activeTimeSec}秒`;

  // デバイス
  const deviceItems =
    (items.find((d) => d.metricName === "Device")?.information ?? []).map(
      (d) => ({ name: String(d.name), count: Number(d.sessionsCount) })
    );

  // ブラウザ
  const browserItems =
    (items.find((d) => d.metricName === "Browser")?.information ?? []).map(
      (d) => ({ name: String(d.name), count: Number(d.sessionsCount) })
    );

  // 人気ページ
  const popularPages =
    (items.find((d) => d.metricName === "PopularPages")?.information ?? [])
      .slice(0, 8)
      .map((d) => ({
        name: String(d.url).replace("https://gcinsight.jp", "") || "/",
        count: Number(d.visitsCount),
      }));

  // 流入元
  const referrers =
    (items.find((d) => d.metricName === "ReferrerUrl")?.information ?? [])
      .filter((d) => d.name && !String(d.name).includes("localhost"))
      .slice(0, 5)
      .map((d) => ({
        name: String(d.name).replace("https://", "").replace(/\/$/, ""),
        count: Number(d.sessionsCount),
      }));

  const maxVisits = popularPages[0]?.count ?? 1;

  return (
    <div className="p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: "#00338D" }}>
          アナリティクス
        </h1>
        <div className="flex gap-1">
          {[3].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                days === d
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              直近{d}日
            </button>
          ))}
          <span className="text-xs text-gray-400 self-center ml-2">· Clarity Export API</span>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-gray-400 animate-pulse">Clarityデータを取得中...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold">取得エラー: {error}</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {/* KPIカード */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="セッション" value={sessions.toLocaleString()} />
            <KpiCard label="ユーザー" value={users.toLocaleString()} />
            <KpiCard label="ページ/セッション" value={pagesPerSession} />
            <KpiCard label="平均スクロール深度" value={`${scrollDepth}%`} sub="ページ最下部まで" />
            <KpiCard label="アクティブ時間" value={engagementStr} />
            <KpiCard
              label="デッドクリック"
              value={`${(deadClick?.sessionsWithMetricPercentage as number ?? 0).toFixed(0)}%`}
              sub={`のセッションで発生`}
              warn={(deadClick?.sessionsWithMetricPercentage as number ?? 0) > 20}
            />
          </div>

          {/* UX問題指標 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">UX問題シグナル</p>
              <div className="space-y-2">
                {[
                  {
                    label: "激怒クリック (Rage Click)",
                    pct: rageClick?.sessionsWithMetricPercentage as number ?? 0,
                    total: rageClick?.subTotal,
                  },
                  {
                    label: "直帰クリック (Quickback)",
                    pct: quickback?.sessionsWithMetricPercentage as number ?? 0,
                    total: quickback?.subTotal,
                  },
                  {
                    label: "デッドクリック",
                    pct: deadClick?.sessionsWithMetricPercentage as number ?? 0,
                    total: deadClick?.subTotal,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{item.label}</span>
                      <span className={item.pct > 10 ? "text-amber-600 font-semibold" : ""}>
                        {item.pct.toFixed(1)}%
                        {item.total != null ? ` (${item.total}件)` : ""}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(item.pct, 100)}%`,
                          backgroundColor: item.pct > 10 ? "#d97706" : "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <BarList title="デバイス" items={deviceItems} total={sessions} />
            <BarList title="ブラウザ" items={browserItems} total={sessions} />
          </div>

          {/* 人気ページ・流入元 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <BarList title="人気ページ" items={popularPages} total={maxVisits} />
            {referrers.length > 0 && (
              <BarList title="流入元" items={referrers} total={sessions} />
            )}
          </div>
        </>
      )}

      {/* Clarityへのリンク */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500 flex-1">ヒートマップ・セッション録画はClarityで確認</p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "ダッシュボード", path: "dashboard" },
            { label: "ヒートマップ", path: "heatmaps" },
            { label: "セッション録画", path: "recordings" },
          ].map((link) => (
            <a
              key={link.path}
              href={`https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT_ID}/${link.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
