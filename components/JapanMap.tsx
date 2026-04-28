"use client";

import { useState, useCallback } from "react";
import { Map as MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";

// --- Types ---

type PrefectureData = {
  prefecture: string;
  avg_rate: number;
  count: number;
  completed: number;
  critical: number;
};

type JapanMapProps = {
  prefectures: PrefectureData[];
  /** 指定した場合 router.push の代わりに呼ばれる（進捗ページ内ドリルダウン用） */
  onPrefClick?: (name: string) => void;
};

// --- Color scale ---

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#166534";
  if (rate >= 0.8) return "#10B981";
  if (rate >= 0.7) return "#F5B500";
  if (rate >= 0.6) return "#FA6414";
  return "#FF6B6B";
}

function getRateTextColor(rate: number): string {
  if (rate >= 0.8) return "#fff";
  if (rate >= 0.7) return "#422006";
  return "#fff";
}

// --- Grid cartogram layout (col, row) ---

// Grid layout: 北海道をrow0、東北をrow1始まりに詰めてコンパクト化
const PREFECTURE_GRID: { name: string; col: number; row: number }[] = [
  { name: "北海道", col: 8, row: 0 },
  { name: "青森県", col: 8, row: 1 },
  { name: "岩手県", col: 9, row: 1 },
  { name: "秋田県", col: 8, row: 2 },
  { name: "宮城県", col: 9, row: 2 },
  { name: "山形県", col: 8, row: 3 },
  { name: "福島県", col: 9, row: 3 },
  { name: "新潟県", col: 7, row: 3 },
  { name: "群馬県", col: 8, row: 4 },
  { name: "栃木県", col: 9, row: 4 },
  { name: "長野県", col: 7, row: 4 },
  { name: "埼玉県", col: 8, row: 5 },
  { name: "茨城県", col: 9, row: 5 },
  { name: "山梨県", col: 7, row: 5 },
  { name: "東京都", col: 8, row: 6 },
  { name: "千葉県", col: 9, row: 6 },
  { name: "神奈川県", col: 8, row: 7 },
  { name: "富山県", col: 6, row: 4 },
  { name: "石川県", col: 5, row: 4 },
  { name: "福井県", col: 4, row: 4 },
  { name: "岐阜県", col: 6, row: 5 },
  { name: "静岡県", col: 7, row: 6 },
  { name: "愛知県", col: 6, row: 6 },
  { name: "三重県", col: 5, row: 6 },
  { name: "滋賀県", col: 5, row: 5 },
  { name: "京都府", col: 4, row: 5 },
  { name: "大阪府", col: 4, row: 6 },
  { name: "兵庫県", col: 3, row: 6 },
  { name: "奈良県", col: 5, row: 7 },
  { name: "和歌山県", col: 4, row: 7 },
  { name: "鳥取県", col: 2, row: 5 },
  { name: "島根県", col: 1, row: 5 },
  { name: "岡山県", col: 2, row: 6 },
  { name: "広島県", col: 1, row: 6 },
  { name: "山口県", col: 0, row: 6 },
  { name: "徳島県", col: 3, row: 7 },
  { name: "香川県", col: 3, row: 8 },
  { name: "愛媛県", col: 2, row: 8 },
  { name: "高知県", col: 2, row: 7 },
  { name: "福岡県", col: 0, row: 7 },
  { name: "佐賀県", col: 0, row: 8 },
  { name: "長崎県", col: 0, row: 9 },
  { name: "熊本県", col: 1, row: 8 },
  { name: "大分県", col: 1, row: 7 },
  { name: "宮崎県", col: 1, row: 9 },
  { name: "鹿児島県", col: 0, row: 10 },
  { name: "沖縄県", col: 0, row: 11 },
];

// --- Constants ---

const CELL_SIZE = 68;
const GAP = 3;
const STEP = CELL_SIZE + GAP;
const PADDING = 8;
const COLS = 10;
const ROWS = 12;
const SVG_WIDTH = PADDING * 2 + COLS * STEP - GAP;
const SVG_HEIGHT = PADDING * 2 + ROWS * STEP - GAP;
const CORNER_RADIUS = 6;

const LEGEND_ITEMS = [
  { label: "90%+", color: "#166534" },
  { label: "80-90%", color: "#10B981" },
  { label: "70-80%", color: "#F5B500" },
  { label: "60-70%", color: "#FA6414" },
  { label: "60%未満", color: "#FF6B6B" },
  { label: "データなし", color: "#E5E7EB" },
];

// --- Component ---

export default function JapanMap({ prefectures, onPrefClick }: JapanMapProps) {
  const [tooltip, setTooltip] = useState<{
    data: PrefectureData;
    x: number;
    y: number;
  } | null>(null);
  const router = useRouter();

  const dataMap = new Map<string, PrefectureData>();
  for (const p of prefectures) {
    dataMap.set(p.prefecture, p);
  }

  const handleClick = useCallback(
    (name: string) => {
      if (onPrefClick) {
        onPrefClick(name);
      } else {
        router.push(`/progress?pref=${encodeURIComponent(name)}`);
      }
    },
    [router, onPrefClick]
  );

  const handleMouseEnter = useCallback(
    (name: string, cx: number, cy: number) => {
      const data = dataMap.get(name);
      if (data) {
        setTooltip({ data, x: cx, y: cy });
      }
    },
    // dataMap changes every render but content is stable; this is fine for hover perf
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prefectures]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className="card p-6">
      <h2
        className="text-sm lg:text-base font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <MapIcon size={16} aria-hidden="true" style={{ color: "var(--color-brand-primary)", flexShrink: 0 }} />
        日本地図（都道府県カルトグラム）
      </h2>
      <p className="text-xs lg:text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
        色は手続き進捗率を示します。クリックで都道府県詳細へ。
      </p>

      <div className="relative w-full mx-auto lg:max-w-none" style={{ maxWidth: 720 }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          height="auto"
          role="img"
          aria-label="日本地図 都道府県別手続き進捗率"
          style={{ display: "block" }}
        >
          {PREFECTURE_GRID.map(({ name, col, row }) => {
            const data = dataMap.get(name);
            const rate = data?.avg_rate ?? -1;
            const fill = rate >= 0 ? getRateColor(rate) : "#E5E7EB";
            const textColor = rate >= 0 ? getRateTextColor(rate) : "#9CA3AF";
            const x = PADDING + col * STEP;
            const y = PADDING + row * STEP;
            const cx = x + CELL_SIZE / 2;
            const cy = y + CELL_SIZE / 2;

            // Remove 県/府/都 suffix for display, keep 北海道 as-is
            const shortName = name === "北海道"
              ? "北海道"
              : name.replace(/[県府都]$/, "");

            return (
              <g
                key={name}
                onClick={() => handleClick(name)}
                onMouseEnter={() => handleMouseEnter(name, cx, cy)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                aria-label={`${name}: ${rate >= 0 ? `手続き進捗率 ${(rate * 100).toFixed(1)}%` : "データなし"}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick(name);
                  }
                }}
              >
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={CORNER_RADIUS}
                  ry={CORNER_RADIUS}
                  fill={fill}
                  stroke={tooltip?.data.prefecture === name ? "#1e293b" : "rgba(0,0,0,0.12)"}
                  strokeWidth={tooltip?.data.prefecture === name ? 3 : 1}
                  style={{
                    transition: "all 150ms ease",
                    filter: tooltip?.data.prefecture === name ? "brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))" : "none",
                  }}
                />
                {/* Prefecture name */}
                <text
                  x={cx}
                  y={cy - 7}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textColor}
                  fontSize={shortName.length > 3 ? 13 : shortName.length > 2 ? 14 : 15}
                  fontWeight={700}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {shortName}
                </text>
                {/* Rate */}
                {rate >= 0 && (
                  <text
                    x={cx}
                    y={cy + 18}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    fontSize={13}
                    fontWeight={700}
                    opacity={0.9}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {(rate * 100).toFixed(0)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* Tooltip rendered in SVG for proper layering */}
          {tooltip && (
            <g style={{ pointerEvents: "none" }}>
              <TooltipOverlay
                data={tooltip.data}
                anchorX={tooltip.x}
                anchorY={tooltip.y}
                svgWidth={SVG_WIDTH}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">手続き進捗率:</span>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-4 h-3 rounded-sm inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Tooltip sub-component (rendered as SVG foreignObject) ---

function TooltipOverlay({
  data,
  anchorX,
  anchorY,
  svgWidth,
}: {
  data: PrefectureData;
  anchorX: number;
  anchorY: number;
  svgWidth: number;
}) {
  const TIP_W = 180;
  const TIP_H = 100;
  const ARROW_SIZE = 6;

  // Position tooltip above the cell, centered horizontally, with 16px offset
  let tx = anchorX - TIP_W / 2;
  const ty = anchorY - CELL_SIZE / 2 - TIP_H - ARROW_SIZE - 16;

  // Clamp horizontal to stay within SVG
  if (tx < 4) tx = 4;
  if (tx + TIP_W > svgWidth - 4) tx = svgWidth - TIP_W - 4;

  // If tooltip would go above SVG, show below instead
  const showBelow = ty < 4;
  const finalY = showBelow
    ? anchorY + CELL_SIZE / 2 + ARROW_SIZE + 4
    : ty;

  return (
    <>
      {/* Arrow */}
      <polygon
        points={
          showBelow
            ? `${anchorX},${anchorY + CELL_SIZE / 2 + 2} ${anchorX - ARROW_SIZE},${finalY} ${anchorX + ARROW_SIZE},${finalY}`
            : `${anchorX},${anchorY - CELL_SIZE / 2 - 2} ${anchorX - ARROW_SIZE},${finalY + TIP_H} ${anchorX + ARROW_SIZE},${finalY + TIP_H}`
        }
        fill="#1e293b"
      />
      {/* Tooltip body via foreignObject for rich HTML */}
      <foreignObject x={tx} y={finalY} width={TIP_W} height={TIP_H}>
        <div
          style={{
            backgroundColor: "#1e293b",
            color: "#f1f5f9",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 11,
            lineHeight: 1.5,
            fontFamily: "inherit",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 12, margin: 0 }}>
            {data.prefecture}
          </p>
          <p style={{ margin: "2px 0 0" }}>
            手続き進捗率:{" "}
            <span style={{ fontWeight: 800 }}>
              {(data.avg_rate * 100).toFixed(1)}%
            </span>
          </p>
          <p style={{ margin: "1px 0 0" }}>
            自治体数: {data.count}
          </p>
          <p style={{ margin: "1px 0 0" }}>
            完了: {data.completed} / 危機:{" "}
            <span style={{ color: data.critical > 0 ? "#FF6B6B" : "inherit" }}>
              {data.critical}
            </span>
          </p>
        </div>
      </foreignObject>
    </>
  );
}
