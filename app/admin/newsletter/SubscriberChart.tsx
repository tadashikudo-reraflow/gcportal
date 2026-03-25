"use client";

import { useEffect, useRef, useState } from "react";

interface StatsData {
  dates: string[];
  counts: number[];
  cumulative: number[];
}

export default function SubscriberChart() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetch("/api/newsletter/subscribers/stats")
      .then((r) => r.json())
      .then((d: StatsData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p style={{ fontSize: 13, color: "#9ca3af", padding: "16px 0" }}>読み込み中...</p>
    );
  }

  if (!data || data.dates.length === 0) return null;

  const W = 600;
  const H = 160;
  const PAD = { top: 12, right: 16, bottom: 28, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.cumulative, 1);
  const steps = 5;

  const xScale = (i: number) => PAD.left + (i / (data.dates.length - 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  // 折れ線パス
  const pathD = data.cumulative
    .map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`)
    .join(" ");

  // X軸ラベル: 最初・7日目・14日目・21日目・最終
  const xLabelIndices = [0, 7, 14, 21, data.dates.length - 1];

  // Y軸目盛り
  const yTicks = Array.from({ length: steps + 1 }, (_, i) => Math.round((i / steps) * maxVal));

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: H, display: "block" }}
        onMouseMove={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const relX = svgX - PAD.left;
          const idx = Math.round((relX / chartW) * (data.dates.length - 1));
          if (idx >= 0 && idx < data.dates.length) {
            setTooltip({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top - 36,
              text: `${data.dates[idx]}: ${data.cumulative[idx]}人`,
            });
          }
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* グリッド水平線 */}
        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={PAD.left}
            y1={yScale(tick)}
            x2={PAD.left + chartW}
            y2={yScale(tick)}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}

        {/* Y軸ラベル */}
        {yTicks.map((tick) => (
          <text
            key={tick}
            x={PAD.left - 6}
            y={yScale(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={10}
            fill="#9ca3af"
          >
            {tick}
          </text>
        ))}

        {/* X軸ラベル */}
        {xLabelIndices.map((idx) => (
          <text
            key={idx}
            x={xScale(idx)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#9ca3af"
          >
            {data.dates[idx].slice(5)} {/* MM-DD */}
          </text>
        ))}

        {/* 折れ線 */}
        <path d={pathD} fill="none" stroke="#111111" strokeWidth={2} strokeLinejoin="round" />

        {/* データポイント */}
        {data.cumulative.map((v, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(v)} r={3} fill="#111111">
            <title>{`${data.dates[i]}: ${v}人`}</title>
          </circle>
        ))}
      </svg>

      {/* マウスホバーtooltip */}
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translateX(-50%)",
            background: "#111",
            color: "#fff",
            fontSize: 12,
            padding: "4px 8px",
            borderRadius: 4,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
