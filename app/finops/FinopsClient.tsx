"use client";

import { useState } from "react";
import Link from "next/link";
import { COST_CONSTANTS } from "@/lib/constants";

// ------------------------------------------------------------
// ベンダー別コストレンジ（CostSimulator の COST_TABLE から抜粋）
// Client Component の依存を増やさないよう独立した定数として定義
// 出典: デジタル庁先行事業TCO検証・中核市市長会調査・総務省地方財政調査（参考値）
// ------------------------------------------------------------
const FINOPS_COST_TABLE: {
  popKey: string;
  popLabel: string;
  vendors: { name: string; afterMin: number; afterMax: number }[];
}[] = [
  {
    popKey: "under1",
    popLabel: "1万人未満",
    vendors: [
      { name: "TKC",   afterMin: 3300,  afterMax: 4800 },
      { name: "RKKCS", afterMin: 3000,  afterMax: 4500 },
      { name: "富士通", afterMin: 6000,  afterMax: 12000 },
      { name: "NEC",   afterMin: 4550,  afterMax: 8750 },
    ],
  },
  {
    popKey: "1to5",
    popLabel: "1〜5万人",
    vendors: [
      { name: "TKC",   afterMin: 8800,  afterMax: 12800 },
      { name: "RKKCS", afterMin: 8000,  afterMax: 12000 },
      { name: "富士通", afterMin: 15000, afterMax: 30000 },
      { name: "NEC",   afterMin: 11700, afterMax: 22500 },
    ],
  },
  {
    popKey: "5to10",
    popLabel: "5〜10万人",
    vendors: [
      { name: "TKC",   afterMin: 16500, afterMax: 24000 },
      { name: "RKKCS", afterMin: 15000, afterMax: 22500 },
      { name: "富士通", afterMin: 30000, afterMax: 60000 },
      { name: "NEC",   afterMin: 23400, afterMax: 45000 },
    ],
  },
  {
    popKey: "10to30",
    popLabel: "10〜30万人",
    vendors: [
      { name: "TKC",   afterMin: 33000, afterMax: 48000 },
      { name: "RKKCS", afterMin: 30000, afterMax: 45000 },
      { name: "富士通", afterMin: 60000, afterMax: 120000 },
      { name: "NEC",   afterMin: 45500, afterMax: 87500 },
    ],
  },
  {
    popKey: "over30",
    popLabel: "30万人以上",
    vendors: [
      { name: "TKC",   afterMin: 66000,  afterMax: 96000 },
      { name: "RKKCS", afterMin: 60000,  afterMax: 90000 },
      { name: "富士通", afterMin: 120000, afterMax: 240000 },
      { name: "NEC",   afterMin: 91000,  afterMax: 175000 },
    ],
  },
];

function formatManYen(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}億円`;
  return `${v.toLocaleString()}万円`;
}

// ------------------------------------------------------------
// クラウド基盤コスト比較（cloud/page.tsx の CLOUD_CONFIG から参照）
// ------------------------------------------------------------
const CLOUD_SUMMARY = [
  {
    cloud: "AWS",
    share: "97%",
    costIndex: 100,
    color: "#FF9900",
    bgColor: "#fffbf0",
    borderColor: "#FF9900",
    points: [
      "国内最大シェア・実績豊富",
      "ドル建て課金（円安リスクあり）",
      "データ転送料が別途発生",
    ],
  },
  {
    cloud: "OCI",
    share: "<1%",
    costIndex: 55,
    color: "#F80000",
    bgColor: "#fff8f8",
    borderColor: "#F80000",
    points: [
      "コストインデックス最安（AWS比55%）",
      "月10TBまでデータ転送料無料",
      "円建て課金で為替リスク低減",
    ],
  },
];

export default function FinopsClient() {
  const [email, setEmail] = useState("");

  function handleCtaSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ from: "finops" });
    if (email) params.set("email", email);
    window.location.href = `/report?${params.toString()}`;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ===== Hero ===== */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-block text-xs font-semibold tracking-widest uppercase bg-blue-600/50 px-3 py-1 rounded-full mb-2">
            FinOps — コスト最適化ハブ
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            ガバクラコスト、<br className="hidden md:block" />
            あなたの自治体は適正か？
          </h1>
          <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto">
            平均2.3倍のコスト増加が続く中、同規模自治体との比較で
            適正水準を確認できます。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/report?from=finops"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-800 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              コスト診断を受ける（無料）
            </Link>
            <Link
              href="/report?from=finops"
              className="inline-flex items-center justify-center gap-2 border border-white/50 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              無料レポートを受け取る
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Section 1: コストの実態 ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-2">
            ガバメントクラウド移行コストの実態
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10">
            出典: {COST_CONSTANTS.source}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-red-600">
                {COST_CONSTANTS.avgCostIncrease}倍
              </div>
              <div className="text-sm font-semibold text-gray-700">平均増加倍率</div>
              <div className="text-xs text-gray-500">
                移行前と比較した移行後の平均コスト増加
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-orange-600">
                {COST_CONSTANTS.maxCostIncrease}倍
              </div>
              <div className="text-sm font-semibold text-gray-700">最大増加倍率</div>
              <div className="text-xs text-gray-500">
                一部自治体では最大5.7倍のコスト増加も
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-yellow-700">935団体</div>
              <div className="text-sm font-semibold text-gray-700">遅延延長認定</div>
              <div className="text-xs text-gray-500">
                特定移行認定（2026年3月末期限延長）
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Section 2: ベンダー別コストレンジ ===== */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            人口帯 × ベンダー別 推定コストレンジ
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            ※ 年額・万円単位。先行事業TCO検証・中核市市長会調査から概算（参考値）。実際の契約条件により異なります。主要4ベンダーを表示。
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-28">人口帯</th>
                  {["TKC", "RKKCS", "富士通", "NEC"].map((v) => (
                    <th key={v} className="text-center px-4 py-3 font-semibold text-gray-700">
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINOPS_COST_TABLE.map((row, i) => (
                  <tr
                    key={row.popKey}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {row.popLabel}
                    </td>
                    {row.vendors.map((v) => (
                      <td key={v.name} className="px-4 py-3 text-center text-gray-700">
                        {formatManYen(v.afterMin)}
                        <span className="text-gray-400 mx-1">〜</span>
                        {formatManYen(v.afterMax)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              href="/costs"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              詳細コスト分析はこちら →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Section 3: クラウド基盤別コスト構造 ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            クラウド基盤別コスト構造
          </h2>
          <p className="text-xs text-gray-500 mb-8">
            出典: デジタル庁先行事業調査 令和6年9月・各クラウドベンダー公式
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CLOUD_SUMMARY.map((c) => (
              <div
                key={c.cloud}
                className="rounded-xl border p-6 space-y-4"
                style={{ borderColor: c.borderColor, backgroundColor: c.bgColor }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xl font-bold"
                    style={{ color: c.color }}
                  >
                    {c.cloud}
                  </span>
                  <span className="text-xs text-gray-500">
                    シェア {c.share} / コスト指数 {c.costIndex}
                  </span>
                </div>
                <ul className="space-y-1">
                  {c.points.map((p) => (
                    <li key={p} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-0.5 text-gray-400">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link
              href="/cloud"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              クラウド基盤の詳細比較はこちら →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Section 4: 関連記事（プレースホルダー）===== */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">
            FinOps 関連記事
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 border border-gray-200 rounded-xl p-6 space-y-3"
              >
                <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
                <div className="h-5 w-full bg-gray-300 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <p className="text-xs text-gray-400 pt-2">記事準備中</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Section 5: CTA バナー ===== */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-800 to-blue-900 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            あなたの自治体のコスト診断（無料）
          </h2>
          <p className="text-blue-100 text-sm md:text-base">
            メールアドレスを入力すると、同規模自治体との比較レポートを
            無料でお届けします。
          </p>
          <form
            onSubmit={handleCtaSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.jp"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="submit"
              className="bg-white text-blue-800 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              無料で受け取る
            </button>
          </form>
          <p className="text-xs text-blue-200">
            スパムはしません。いつでも配信解除できます。
          </p>
        </div>
      </section>
    </main>
  );
}
