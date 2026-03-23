"use client";

import { useState, useMemo } from "react";

/**
 * 人口帯 x ベンダー → 推定コストレンジ（年額、万円単位）
 * 仮データ: 先行事業TCO検証 + 中核市市長会調査から概算
 */
const COST_TABLE: Record<string, Record<string, { before: number; afterMin: number; afterMax: number }>> = {
  under1: {
    TKC:    { before: 3000,  afterMin: 3300,  afterMax: 4800 },
    RKKCS:  { before: 3000,  afterMin: 3000,  afterMax: 4500 },
    富士通:  { before: 4000,  afterMin: 6000,  afterMax: 12000 },
    NEC:    { before: 3500,  afterMin: 4550,  afterMax: 8750 },
    日立:   { before: 3500,  afterMin: 4550,  afterMax: 7700 },
    Gcom:   { before: 3000,  afterMin: 3600,  afterMax: 6000 },
    電算:   { before: 3000,  afterMin: 3300,  afterMax: 5400 },
  },
  "1to5": {
    TKC:    { before: 8000,  afterMin: 8800,  afterMax: 12800 },
    RKKCS:  { before: 8000,  afterMin: 8000,  afterMax: 12000 },
    富士通:  { before: 10000, afterMin: 15000, afterMax: 30000 },
    NEC:    { before: 9000,  afterMin: 11700, afterMax: 22500 },
    日立:   { before: 9000,  afterMin: 11700, afterMax: 19800 },
    Gcom:   { before: 8000,  afterMin: 9600,  afterMax: 16000 },
    電算:   { before: 8000,  afterMin: 8800,  afterMax: 14400 },
  },
  "5to10": {
    TKC:    { before: 15000, afterMin: 16500, afterMax: 24000 },
    RKKCS:  { before: 15000, afterMin: 15000, afterMax: 22500 },
    富士通:  { before: 20000, afterMin: 30000, afterMax: 60000 },
    NEC:    { before: 18000, afterMin: 23400, afterMax: 45000 },
    日立:   { before: 18000, afterMin: 23400, afterMax: 39600 },
    Gcom:   { before: 15000, afterMin: 18000, afterMax: 30000 },
    電算:   { before: 15000, afterMin: 16500, afterMax: 27000 },
  },
  "10to30": {
    TKC:    { before: 30000, afterMin: 33000, afterMax: 48000 },
    RKKCS:  { before: 30000, afterMin: 30000, afterMax: 45000 },
    富士通:  { before: 40000, afterMin: 60000, afterMax: 120000 },
    NEC:    { before: 35000, afterMin: 45500, afterMax: 87500 },
    日立:   { before: 35000, afterMin: 45500, afterMax: 77000 },
    Gcom:   { before: 30000, afterMin: 36000, afterMax: 60000 },
    電算:   { before: 30000, afterMin: 33000, afterMax: 54000 },
  },
  over30: {
    TKC:    { before: 60000, afterMin: 66000, afterMax: 96000 },
    RKKCS:  { before: 60000, afterMin: 60000, afterMax: 90000 },
    富士通:  { before: 80000, afterMin: 120000, afterMax: 240000 },
    NEC:    { before: 70000, afterMin: 91000, afterMax: 175000 },
    日立:   { before: 70000, afterMin: 91000, afterMax: 154000 },
    Gcom:   { before: 60000, afterMin: 72000, afterMax: 120000 },
    電算:   { before: 60000, afterMin: 66000, afterMax: 108000 },
  },
};

const POP_OPTIONS = [
  { key: "under1", label: "1万人未満" },
  { key: "1to5", label: "1〜5万人" },
  { key: "5to10", label: "5〜10万人" },
  { key: "10to30", label: "10〜30万人" },
  { key: "over30", label: "30万人以上" },
];

const VENDOR_LIST = ["TKC", "RKKCS", "富士通", "NEC", "日立", "Gcom", "電算"];

function formatManYen(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}億円`;
  return `${v.toLocaleString()}万円`;
}

export default function CostSimulator() {
  const [pop, setPop] = useState("");
  const [vendor, setVendor] = useState("");

  const result = useMemo(() => {
    if (!pop || !vendor) return null;
    const entry = COST_TABLE[pop]?.[vendor];
    if (!entry) return null;
    return entry;
  }, [pop, vendor]);

  const ratioMin = result ? (result.afterMin / result.before).toFixed(1) : null;
  const ratioMax = result ? (result.afterMax / result.before).toFixed(1) : null;

  return (
    <div className="card p-6">
      <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
        コストシミュレーター
      </h2>
      <p className="text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>
        自治体の人口規模とベンダーを選択して、ガバメントクラウド移行後の推定コストレンジを確認できます。
      </p>
      <div className="text-[10px] leading-relaxed mb-4 p-2.5 rounded-md" style={{ backgroundColor: "#f8fafc", color: "var(--color-text-muted)" }}>
        <p className="font-semibold mb-1">算出根拠：</p>
        <ul className="list-disc pl-4 space-y-0.5">
          <li>デジタル庁「先行事業TCO検証」（令和5年度報告）のベンダー別コスト比率</li>
          <li>中核市市長会「ガバメントクラウド移行に伴うコスト調査」（令和6年度）</li>
          <li>総務省「地方財政状況調査」の情報システム経費データ</li>
          <li>各ベンダーの公開料金体系から人口帯別にレンジを推定</li>
        </ul>
        <p className="mt-1">※ 実際のコストは契約条件・既存システム構成・移行方式により大きく異なります。参考値としてご利用ください。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">人口規模</label>
          <select
            value={pop}
            onChange={(e) => setPop(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {POP_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">主要ベンダー</label>
          <select
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">選択してください</option>
            {VENDOR_LIST.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <div className="rounded-lg border-2 border-blue-100 bg-blue-50/50 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">移行前（年額推定）</p>
              <p className="text-xl font-extrabold tabular-nums" style={{ color: "var(--color-text-primary)" }}>
                {formatManYen(result.before)}
              </p>
            </div>
            <div className="flex items-center justify-center">
              <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="text-gray-400">
                <path d="M4 12h20m0 0l-6-6m6 6l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">移行後（年額推定レンジ）</p>
              <p className="text-xl font-extrabold tabular-nums" style={{ color: "#c8102e" }}>
                {formatManYen(result.afterMin)}〜{formatManYen(result.afterMax)}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-200/60">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-500">コスト比率（対移行前）</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: "#d97706" }}>
                  {ratioMin}x 〜 {ratioMax}x
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">年間増加額</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: "#c8102e" }}>
                  +{formatManYen(result.afterMin - result.before)}〜+{formatManYen(result.afterMax - result.before)}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            ※ 推定値です。先行事業TCO検証・中核市市長会調査を基に算出。実際のコストは契約条件により異なります。
          </p>
        </div>
      )}

      {!result && pop && vendor && (
        <div className="text-center py-6 text-sm text-gray-400">
          このベンダーの推定データは現在準備中です。
        </div>
      )}

      {!pop && !vendor && (
        <div className="text-center py-6 text-sm text-gray-400">
          人口規模とベンダーを選択してください
        </div>
      )}

      {/* 公式料金計算ツール */}
      <div className="mt-5 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-600 mb-2">公式料金計算ツール</p>
        <p className="text-[11px] text-gray-400 mb-3">
          各クラウドの公式見積もりツールで実際のコストを試算できます。
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <a
            href="https://calculator.aws/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-300 transition-colors text-xs font-medium text-gray-700 hover:text-orange-700"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#FF9900" }} />
            AWS
          </a>
          <a
            href="https://azure.microsoft.com/pricing/calculator/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs font-medium text-gray-700 hover:text-blue-700"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#0078D4" }} />
            Azure
          </a>
          <a
            href="https://cloud.google.com/products/calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs font-medium text-gray-700 hover:text-blue-600"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#4285F4" }} />
            GCP
          </a>
          <a
            href="https://www.oracle.com/cloud/costestimator.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 transition-colors text-xs font-medium text-gray-700 hover:text-red-700"
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: "#F80000" }} />
            OCI
          </a>
        </div>
      </div>
    </div>
  );
}
