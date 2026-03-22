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
                      <td className="py-1 text-gray-500">クラウド利用料（IaaS）</td>
                      <td className="py-1 text-right font-medium text-gray-700">約25〜35%</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-1 text-gray-500">ソフトウェア借料（SaaS/ライセンス）</td>
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
                    <span className="text-gray-500">利用クラウド</span>
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

// --- 展開可能なコスト変化カード ---
type CostCardProps = {
  scope: string;
  changeRatio: number;
  vendorName: string;
  notes: string | null;
  barWidth: number;
  barColor: string;
  label: string;
  isReduction: boolean;
  pctChange: number;
};

export function ExpandableCostCard({
  scope,
  changeRatio,
  vendorName,
  notes,
  barWidth,
  barColor,
  label,
  isReduction,
  pctChange,
}: CostCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-lg border p-4 cursor-pointer transition-all"
      style={{
        borderColor: isReduction ? "#bbf7d0" : "#fecaca",
        backgroundColor: isReduction ? "#f0fdf4" : changeRatio >= 3 ? "#fff1f2" : "#fff5f5",
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isReduction ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-600 text-white flex-shrink-0">
              ✓ 削減事例
            </span>
          ) : (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: barColor + "20", color: barColor }}
            >
              ▲ コスト増
            </span>
          )}
          <span className="text-xs text-gray-500 flex-shrink-0">{scope}</span>
          {vendorName !== "—" && <span className="text-xs text-gray-400">{vendorName}</span>}
          <span className="text-xs text-gray-300 ml-auto flex-shrink-0">{open ? "▲" : "▼"}</span>
        </div>
        <span className="text-2xl font-extrabold flex-shrink-0 tabular-nums" style={{ color: barColor }}>
          {label}
        </span>
      </div>
      {/* バー */}
      <div className="relative h-5 rounded-full overflow-hidden" style={{ backgroundColor: "#e5e7eb" }}>
        <div
          className="absolute top-0 bottom-0 w-0.5 z-10"
          style={{ left: "16.7%", backgroundColor: "#9ca3af" }}
        />
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${barWidth}%`, backgroundColor: barColor }}
        />
        <span
          className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-bold text-white tabular-nums"
          style={{ mixBlendMode: "difference" }}
        >
          {pctChange.toFixed(0)}%{isReduction ? "↓" : "↑"}
        </span>
      </div>
      {notes && (
        <p className="text-xs mt-2 font-medium" style={{ color: "var(--color-text-secondary)" }}>
          {notes}
        </p>
      )}
      {open && (
        <div className="mt-3 pt-3 border-t border-gray-200/60">
          <p className="text-xs font-semibold text-gray-600 mb-2">コスト構成（典型比率）</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="bg-white/80 rounded p-2 border border-gray-100">
              <p className="text-gray-400">クラウド利用料</p>
              <p className="font-medium text-gray-600">25〜35%</p>
            </div>
            <div className="bg-white/80 rounded p-2 border border-gray-100">
              <p className="text-gray-400">SW借料</p>
              <p className="font-medium text-gray-600">30〜40%</p>
            </div>
            <div className="bg-white/80 rounded p-2 border border-gray-100">
              <p className="text-gray-400">回線費</p>
              <p className="font-medium text-gray-600">10〜15%</p>
            </div>
            <div className="bg-white/80 rounded p-2 border border-gray-100">
              <p className="text-gray-400">移行・構築費</p>
              <p className="font-medium text-gray-600">10〜20%</p>
            </div>
            <div className="bg-white/80 rounded p-2 border border-gray-100">
              <p className="text-gray-400">保守・運用</p>
              <p className="font-medium text-gray-600">10〜15%</p>
            </div>
          </div>
          <p className="text-gray-400 mt-1" style={{ fontSize: "9px" }}>
            出典: デジタル庁先行事業TCO検証・中核市市長会調査より典型構成比
          </p>
        </div>
      )}
    </div>
  );
}
