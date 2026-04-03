"use client";

import { useEffect, useState } from "react";

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? "w3eqw79y26";

type ClarityMetrics = {
  totalSessions?: number;
  totalPageViews?: number;
  avgScrollDepth?: number;
  avgEngagementTime?: number;
  bounceRate?: number;
  deadClicks?: number;
  rageclicks?: number;
  [key: string]: unknown;
};

function MetricCard({
  label,
  value,
  sub,
  color = "#00338D",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold mt-1" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<ClarityMetrics | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics?days=3")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setRaw(json.data);
          // Clarityレスポンスから主要指標を抽出
          const d = json.data ?? {};
          setData({
            totalSessions: d.totalSessions ?? d.sessions ?? d.TotalSessions,
            totalPageViews: d.totalPageViews ?? d.pageViews ?? d.TotalPageViews,
            avgScrollDepth: d.avgScrollDepth ?? d.scrollDepth ?? d.AvgScrollDepth,
            avgEngagementTime: d.avgEngagementTime ?? d.engagementTime ?? d.AvgEngagementTime,
            bounceRate: d.bounceRate ?? d.BounceRate,
            deadClicks: d.deadClicks ?? d.DeadClicks,
            rageclicks: d.rageclicks ?? d.Rageclicks ?? d.rageClicks,
          });
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number | undefined, unit = "", decimals = 0) =>
    n != null ? `${n.toFixed(decimals)}${unit}` : "—";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#00338D" }}>
          アナリティクス
        </h1>
        <span className="text-xs text-gray-400">直近3日 · Clarity Export API</span>
      </div>

      {/* KPIカード */}
      {loading && (
        <div className="text-sm text-gray-400 animate-pulse">Clarityデータを取得中...</div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">データ取得エラー</p>
          <p className="font-mono text-xs">{error}</p>
          {error.includes("CLARITY_API_KEY") && (
            <p className="mt-2 text-xs">
              .env.local に <code className="bg-red-100 px-1 rounded">CLARITY_API_KEY</code> を追加してください。
            </p>
          )}
        </div>
      )}
      {data && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="セッション" value={fmt(data.totalSessions)} />
          <MetricCard label="ページビュー" value={fmt(data.totalPageViews)} />
          <MetricCard
            label="平均スクロール深度"
            value={fmt(data.avgScrollDepth, "%", 1)}
          />
          <MetricCard
            label="平均エンゲージメント"
            value={
              data.avgEngagementTime != null
                ? data.avgEngagementTime >= 60
                  ? `${(data.avgEngagementTime / 60).toFixed(1)}分`
                  : `${Math.round(data.avgEngagementTime)}秒`
                : "—"
            }
          />
          {data.bounceRate != null && (
            <MetricCard
              label="直帰率"
              value={fmt(data.bounceRate, "%", 1)}
              color={data.bounceRate > 60 ? "#dc2626" : "#00338D"}
            />
          )}
          {data.deadClicks != null && (
            <MetricCard
              label="デッドクリック"
              value={fmt(data.deadClicks)}
              sub="反応のないクリック"
              color="#d97706"
            />
          )}
          {data.rageclicks != null && (
            <MetricCard
              label="激怒クリック"
              value={fmt(data.rageclicks)}
              sub="連続クリック"
              color="#dc2626"
            />
          )}
        </div>
      )}

      {/* Clarityダッシュボードリンク */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: "#0078D4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-800">Microsoft Clarity</p>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          ヒートマップ・セッション録画・クリック分析はClarityで確認できます。
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT_ID}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
            style={{ backgroundColor: "#0078D4" }}
          >
            ダッシュボード
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <a
            href={`https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT_ID}/heatmaps`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:border-blue-300"
          >
            ヒートマップ
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <a
            href={`https://clarity.microsoft.com/projects/view/${CLARITY_PROJECT_ID}/recordings`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:border-blue-300"
          >
            セッション録画
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {/* デバッグ: 生レスポンス */}
      {raw && process.env.NODE_ENV === "development" && (
        <details className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <summary className="text-xs text-gray-500 cursor-pointer">Clarity API 生レスポンス（開発用）</summary>
          <pre className="text-xs mt-2 overflow-auto max-h-60 text-gray-600">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
