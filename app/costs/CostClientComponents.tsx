"use client";

import { useState } from "react";

// --- 展開可能な自治体コスト詳細行 ---
type MuniDetailProps = {
  index: number;
  city: string;
  prefecture: string;
  primaryVendor: string;
  cloud: string;
  ratioTypical: number;
  ratioMin: number;
  ratioMax: number;
  mark: string;
  markColor: string;
  vendorNote: string;
};

function toPercent(ratio: number): string {
  if (ratio < 1.0) return `−${((1 - ratio) * 100).toFixed(0)}%`;
  return `+${((ratio - 1) * 100).toFixed(0)}%`;
}

export function ExpandableMuniRow({
  index,
  city,
  prefecture,
  primaryVendor,
  cloud,
  ratioTypical,
  ratioMin,
  ratioMax,
  mark,
  markColor,
  vendorNote,
}: MuniDetailProps) {
  const [open, setOpen] = useState(false);
  const isHigh = ratioTypical >= 1.8;
  const cloudColor =
    cloud === "AWS"
      ? "#FF9900"
      : cloud === "OCI"
        ? "#F80000"
        : cloud === "Azure"
          ? "#0078D4"
          : cloud === "GCP"
            ? "#4285F4"
            : "#6b7280";

  return (
    <>
      <tr
        className={`border-b border-gray-50 hover:bg-orange-50 transition-colors cursor-pointer ${isHigh ? "bg-orange-50/40" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <td className="py-2 px-2 text-xs text-gray-400">{index}</td>
        <td className="py-2 px-2 text-xs text-gray-500">{prefecture}</td>
        <td className="py-2 px-2 font-medium text-gray-800">{city}</td>
        <td className="py-2 px-2 text-xs text-gray-600">{primaryVendor}</td>
        <td className="py-2 px-2">
          <span className="text-xs font-medium" style={{ color: cloudColor }}>
            {cloud}
          </span>
        </td>
        <td className="py-2 px-2 text-right">
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
            style={{
              backgroundColor: isHigh ? "#fee2e2" : "#fef3c7",
              color: isHigh ? "#b91c1c" : "#d97706",
            }}
          >
            {toPercent(ratioTypical)}
          </span>
        </td>
        <td className="py-2 px-2 text-xs text-gray-400 tabular-nums">
          {toPercent(ratioMin)}〜{toPercent(ratioMax)}
        </td>
        <td className="py-2 px-2 text-center">
          <span className="font-bold" style={{ color: markColor }}>
            {mark}
          </span>
        </td>
        <td className="py-2 px-2 text-center text-gray-400 text-xs">
          {open ? "▲" : "▼"}
        </td>
      </tr>
      {open && (
        <tr className="bg-gray-50/70">
          <td colSpan={9} className="px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-semibold text-gray-600 mb-1">コスト内訳（典型構成比）</p>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-1 text-gray-500">クラウド利用料</td>
                      <td className="py-1 text-right font-medium text-gray-700">約25〜35%</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1 text-gray-500">ソフトウェア利用料</td>
                      <td className="py-1 text-right font-medium text-gray-700">約30〜40%</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1 text-gray-500">回線費（閉域網・VPN）</td>
                      <td className="py-1 text-right font-medium text-gray-700">約10〜15%</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1 text-gray-500">移行・構築費（初年度）</td>
                      <td className="py-1 text-right font-medium text-gray-700">約10〜20%</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-gray-500">保守・運用支援費</td>
                      <td className="py-1 text-right font-medium text-gray-700">約10〜15%</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-gray-400 mt-1" style={{ fontSize: "9px" }}>
                  出典: デジタル庁先行事業TCO検証・中核市市長会調査より典型構成
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-600 mb-1">ベンダー情報</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">主ベンダー</span>
                    <span className="font-medium text-gray-700">{primaryVendor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">主なクラウド</span>
                    <span className="font-medium" style={{ color: cloudColor }}>{cloud}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">コスト増加率（推定）</span>
                    <span className="font-medium text-gray-700">{toPercent(ratioMin)}〜{toPercent(ratioMax)}</span>
                  </div>
                </div>
                {vendorNote && (
                  <p className="mt-2 text-gray-500 leading-relaxed">{vendorNote}</p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// --- ベンダーグループ展開 ---
type VendorGroupProps = {
  vendorName: string;
  cloud: string;
  mark: string;
  markColor: string;
  note: string;
  children: React.ReactNode;
  count: number;
};

export function VendorGroup({ vendorName, cloud, mark, markColor, note, children, count }: VendorGroupProps) {
  const [open, setOpen] = useState(false);
  const cloudColor =
    cloud === "AWS"
      ? "#FF9900"
      : cloud === "OCI"
        ? "#F80000"
        : cloud === "Azure"
          ? "#0078D4"
          : cloud === "GCP"
            ? "#4285F4"
            : "#6b7280";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold" style={{ color: markColor }}>{mark}</span>
          <div>
            <span className="font-semibold text-gray-800">{vendorName}</span>
            <span className="text-xs text-gray-400 ml-2">（{count}自治体）</span>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: cloudColor, backgroundColor: cloudColor + "15" }}>
            {cloud}
          </span>
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲ 閉じる" : "▼ 展開"}</span>
      </button>
      {note && (
        <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500">{note}</p>
        </div>
      )}
      {open && (
        <div className="border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}

// --- 静的ベンダーカード（展開なし） ---
type CostFactor = {
  label: string;  // 項目名
  value: string;  // 表示値
  highlight?: boolean; // trueで青テキスト（有利な事実）
  caution?: boolean;   // trueでオレンジテキスト（注意事実）
};

type VendorCardProps = {
  vendorName: string;
  cloud: string;
  mark: string;
  markColor: string;
  label: string;
  detail: string;
  costTags?: string[];
  costFactors?: CostFactor[]; // コスト因子ミニグリッド
};

export function VendorCard({ vendorName, cloud, detail, costFactors }: VendorCardProps) {
  const cloudColor =
    cloud === "AWS" ? "#FF9900"
    : cloud === "OCI" ? "#F80000"
    : cloud === "Azure" ? "#0078D4"
    : cloud === "GCP" ? "#4285F4"
    : "#6b7280";

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="px-4 py-3 space-y-2">
        {/* ヘッダー行 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-800">{vendorName}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: cloudColor, backgroundColor: cloudColor + "15" }}>
            {cloud}
          </span>
        </div>

        {/* コスト因子グリッド */}
        {costFactors && costFactors.length > 0 && (
          <div className="grid gap-px rounded overflow-hidden border border-gray-100" style={{ gridTemplateColumns: `repeat(${costFactors.length}, 1fr)` }}>
            {costFactors.map((f) => (
              <div key={f.label} className="bg-gray-50 px-2 py-1.5 text-center">
                <p className="text-[10px] text-gray-400 leading-none mb-0.5">{f.label}</p>
                <p
                  className="text-xs font-semibold leading-tight"
                  style={{
                    color: f.highlight ? "#0369a1" : f.caution ? "#c2410c" : "#374151",
                  }}
                >
                  {f.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* 補足テキスト */}
        {detail && <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>}
      </div>
    </div>
  );
}

// --- 静的コスト変化行（展開なし） ---
type CostCardProps = {
  scope: string;
  changeRatio: number;
  vendorName: string;
  notes: string | null;
  sourceUrl: string | null;
  reportedYear: number | null;
  barWidth: number;
  barColor: string;
  label: string;
  isReduction: boolean;
  pctChange: number;
};

export function ExpandableCostCard({
  scope,
  vendorName,
  notes,
  sourceUrl,
  reportedYear,
  barWidth,
  barColor,
  label,
  isReduction,
}: CostCardProps) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors align-top">
      <td className="py-3 px-3 whitespace-nowrap pt-3.5">
        {isReduction ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-100 text-green-700">
            ✓ 削減
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: barColor + "18", color: barColor }}>
            ▲ 増加
          </span>
        )}
      </td>
      <td className="py-3 px-3 text-xs text-gray-700">
        <p className="font-medium leading-tight">{scope}</p>
        {notes && <p className="text-gray-500 text-[11px] mt-0.5 leading-snug">{notes}</p>}
        {vendorName !== "—" && <p className="text-gray-400 text-[11px] mt-0.5">{vendorName}</p>}
        {(sourceUrl || reportedYear) && (
          <p className="text-[10px] text-gray-400 mt-1">
            出典:{" "}
            {sourceUrl ? (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500">
                {reportedYear ?? "公式資料"}
              </a>
            ) : (
              reportedYear
            )}
          </p>
        )}
      </td>
      <td className="py-3 px-3 text-right whitespace-nowrap pt-3.5">
        <span className="text-base font-extrabold tabular-nums" style={{ color: barColor }}>{label}</span>
      </td>
      <td className="py-3 px-3 w-32 hidden sm:table-cell pt-3.5">
        <div className="relative h-3 rounded-full overflow-hidden bg-gray-200">
          <div className="absolute top-0 bottom-0 w-px bg-gray-400 z-10" style={{ left: "16.7%" }} />
          <div className="h-full rounded-full" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
        </div>
      </td>
    </tr>
  );
}

