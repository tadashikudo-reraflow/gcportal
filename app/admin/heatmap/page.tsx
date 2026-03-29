"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// service_role キーが必要（admin専用）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGES = [
  { label: "トップ（/）", value: "/" },
  { label: "コスト分析（/costs）", value: "/costs" },
  { label: "リスクマップ（/risks）", value: "/risks" },
  { label: "パッケージ（/packages）", value: "/packages" },
  { label: "タイムライン（/timeline）", value: "/timeline" },
  { label: "ベンチマーク（/benchmark）", value: "/benchmark" },
  { label: "特定移行認定（/tokutei）", value: "/tokutei" },
  { label: "レポート申込（/report）", value: "/report" },
];

const PERIODS = [
  { label: "直近7日", days: 7 },
  { label: "直近30日", days: 30 },
  { label: "直近90日", days: 90 },
];

type Stats = {
  total_clicks: number;
  total_sessions: number;
  avg_scroll_depth: number;
  avg_dwell_ms: number;
  mobile_ratio: number;
};

type ClickPoint = {
  x: number; // x_ratio * containerWidth
  y: number; // y_ratio * containerHeight
  value: number;
};

export default function HeatmapPage() {
  const [selectedPage, setSelectedPage] = useState("/");
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const heatmapInstanceRef = useRef<any>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage, selectedPeriod]);

  async function fetchData() {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - selectedPeriod);

    const { data, error } = await supabaseAdmin
      .from("ux_events")
      .select("event_type, x_ratio, y_ratio, scroll_depth, dwell_ms, is_mobile, session_id")
      .eq("page", selectedPage)
      .gte("created_at", since.toISOString());

    if (error || !data) {
      setLoading(false);
      return;
    }

    // 統計計算
    const clicks = data.filter((r) => r.event_type === "click");
    const leaves = data.filter((r) => r.event_type === "leave");
    const sessions = new Set(data.map((r) => r.session_id)).size;
    const avgScroll =
      leaves.length > 0
        ? leaves.reduce((s, r) => s + (r.scroll_depth ?? 0), 0) / leaves.length
        : 0;
    const avgDwell =
      leaves.length > 0
        ? leaves.reduce((s, r) => s + (r.dwell_ms ?? 0), 0) / leaves.length
        : 0;
    const mobileCount = data.filter((r) => r.is_mobile).length;

    setStats({
      total_clicks: clicks.length,
      total_sessions: sessions,
      avg_scroll_depth: avgScroll,
      avg_dwell_ms: avgDwell,
      mobile_ratio: data.length > 0 ? mobileCount / data.length : 0,
    });

    // heatmap描画
    await drawHeatmap(clicks);
    setLoading(false);
  }

  async function drawHeatmap(clicks: Array<{ x_ratio: number | null; y_ratio: number | null }>) {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.offsetWidth;
    const h = container.offsetHeight;

    const points: ClickPoint[] = clicks
      .filter((c) => c.x_ratio !== null && c.y_ratio !== null)
      .map((c) => ({
        x: Math.round((c.x_ratio ?? 0) * w),
        y: Math.round((c.y_ratio ?? 0) * h),
        value: 1,
      }));

    if (points.length === 0) return;

    // heatmap.jsを動的import（SSR回避）
    const h337 = (await import("heatmap.js")).default;

    if (!heatmapInstanceRef.current) {
      heatmapInstanceRef.current = h337.create({
        container,
        radius: 30,
        maxOpacity: 0.7,
        minOpacity: 0.1,
        blur: 0.85,
      });
    }

    heatmapInstanceRef.current.setData({
      max: 5,
      data: points,
    });
  }

  function formatMs(ms: number) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}秒`;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "#00338D" }}>
          UXヒートマップ
        </h1>
        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
          Beta
        </span>
      </div>

      {/* フィルタ */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          {PAGES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setSelectedPeriod(p.days)}
              className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                selectedPeriod === p.days
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIカード */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "クリック数", value: stats.total_clicks.toLocaleString() },
            { label: "セッション数", value: stats.total_sessions.toLocaleString() },
            {
              label: "平均スクロール",
              value: `${Math.round(stats.avg_scroll_depth * 100)}%`,
            },
            { label: "平均滞在時間", value: formatMs(stats.avg_dwell_ms) },
            { label: "モバイル比率", value: `${Math.round(stats.mobile_ratio * 100)}%` },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-500">{kpi.label}</p>
              <p className="text-xl font-bold mt-1" style={{ color: "#00338D" }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ヒートマップ本体 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            クリックヒートマップ — {selectedPage}
          </span>
          {loading && (
            <span className="text-xs text-gray-400 animate-pulse">読み込み中...</span>
          )}
        </div>
        {/* コンテナ: サイトのビューポート比率に合わせた固定高 */}
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ height: 600, background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}
        >
          {!loading && stats?.total_clicks === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400 text-sm">
                この期間のクリックデータがありません
              </p>
            </div>
          )}
          {/* 参考: ページのセクション境界線 */}
          <div className="absolute inset-0 pointer-events-none">
            {[25, 50, 75].map((pct) => (
              <div
                key={pct}
                className="absolute w-full border-t border-dashed border-gray-200"
                style={{ top: `${pct}%` }}
              >
                <span className="absolute right-2 -top-4 text-xs text-gray-300">
                  {pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* スクロール深度バー */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">平均スクロール到達率</p>
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round(stats.avg_scroll_depth * 100)}%`,
                background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>ページトップ</span>
            <span className="font-medium text-blue-600">
              {Math.round(stats.avg_scroll_depth * 100)}%
            </span>
            <span>ページ最下部</span>
          </div>
        </div>
      )}

      {/* Agent改善提案プレースホルダー */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">🤖 ux-optimizer Agent</p>
        <p className="text-xs text-blue-600">
          「このページのUX改善して」と指示するとAgentがSupabaseデータを分析して改善案を実装します。
        </p>
      </div>
    </div>
  );
}
