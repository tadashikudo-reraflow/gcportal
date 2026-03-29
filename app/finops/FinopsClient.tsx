"use client";

import { useState } from "react";
import Link from "next/link";
import { COST_CONSTANTS } from "@/lib/constants";
import type { ArticleMeta } from "@/lib/articles";

// ============================================================
// ベンダー別コストレンジ
// 出典: デジタル庁先行事業TCO検証・中核市市長会調査（参考値）
// ============================================================
const FINOPS_COST_TABLE: {
  popLabel: string;
  vendors: { name: string; afterMin: number; afterMax: number }[];
}[] = [
  { popLabel: "1万人未満", vendors: [
    { name: "TKC",   afterMin: 3300,  afterMax: 4800 },
    { name: "RKKCS", afterMin: 3000,  afterMax: 4500 },
    { name: "富士通", afterMin: 6000,  afterMax: 12000 },
    { name: "NEC",   afterMin: 4550,  afterMax: 8750 },
  ]},
  { popLabel: "1〜5万人", vendors: [
    { name: "TKC",   afterMin: 8800,  afterMax: 12800 },
    { name: "RKKCS", afterMin: 8000,  afterMax: 12000 },
    { name: "富士通", afterMin: 15000, afterMax: 30000 },
    { name: "NEC",   afterMin: 11700, afterMax: 22500 },
  ]},
  { popLabel: "5〜10万人", vendors: [
    { name: "TKC",   afterMin: 16500, afterMax: 24000 },
    { name: "RKKCS", afterMin: 15000, afterMax: 22500 },
    { name: "富士通", afterMin: 30000, afterMax: 60000 },
    { name: "NEC",   afterMin: 23400, afterMax: 45000 },
  ]},
  { popLabel: "10〜30万人", vendors: [
    { name: "TKC",   afterMin: 33000, afterMax: 48000 },
    { name: "RKKCS", afterMin: 30000, afterMax: 45000 },
    { name: "富士通", afterMin: 60000, afterMax: 120000 },
    { name: "NEC",   afterMin: 45500, afterMax: 87500 },
  ]},
  { popLabel: "30万人以上", vendors: [
    { name: "TKC",   afterMin: 66000,  afterMax: 96000 },
    { name: "RKKCS", afterMin: 60000,  afterMax: 90000 },
    { name: "富士通", afterMin: 120000, afterMax: 240000 },
    { name: "NEC",   afterMin: 91000,  afterMax: 175000 },
  ]},
];

function formatManYen(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}億円`;
  return `${v.toLocaleString()}万円`;
}

const CLOUD_SUMMARY = [
  {
    cloud: "AWS",
    share: "97%",
    costIndex: 100,
    color: "#FF9900",
    points: ["国内最大シェア・実績豊富", "ドル建て課金（円安リスクあり）", "データ転送料が別途発生"],
  },
  {
    cloud: "OCI",
    share: "<1%",
    costIndex: 55,
    color: "#F80000",
    points: ["コストインデックス最安（AWS比55%）", "月10TBまでデータ転送料無料", "円建て課金で為替リスク低減"],
  },
];

// ============================================================

export default function FinopsClient({ articles }: { articles: ArticleMeta[] }) {
  const [email, setEmail] = useState("");

  function handleCtaSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ from: "finops" });
    if (email) params.set("email", email);
    window.location.href = `/report?${params.toString()}`;
  }

  const increasePct = `+${COST_CONSTANTS.initialIncreaseRate}%`;
  const averageIncrease = `${(1 + COST_CONSTANTS.initialIncreaseRate / 100).toFixed(1)}倍相当`;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ===== Hero (LP) ===== */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-block text-xs font-semibold tracking-widest uppercase bg-blue-600/50 px-3 py-1 rounded-full mb-2">
            FinOps — ガバクラコスト最適化ハブ
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            ガバクラコスト、<br className="hidden md:block" />
            あなたの自治体は適正か？
          </h1>
          <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto">
            平均{COST_CONSTANTS.avgCostIncrease}倍のコスト増加が続く中、同規模自治体との比較と
            移行済み→運用最適化・未移行→基盤再選定の打ち手を無料レポートで提供します。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href="/report?from=finops_hero"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-800 font-semibold px-7 py-3.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              📄 無料PDFを受け取る
            </a>
            <a
              href="#cost-table"
              className="inline-flex items-center justify-center gap-2 border border-white/50 text-white font-semibold px-7 py-3.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              コスト試算を見る
            </a>
          </div>
          <p className="text-xs text-blue-200">入力はメールアドレスとご所属のみ・スパムなし</p>
        </div>
      </section>

      {/* ===== FinOps とは ===== */}
      <section className="py-14 px-4 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start gap-8">
            <div className="md:w-1/3 space-y-2">
              <div className="text-xs font-semibold text-teal-700 uppercase tracking-widest">FinOps とは</div>
              <h2 className="text-xl font-bold text-gray-900">クラウド支出を<br />「見える化→最適化」する手法</h2>
            </div>
            <div className="md:w-2/3 space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>FinOps（Financial Operations）</strong>は、クラウドの利用コストを継続的に可視化・分析・最適化するプラクティスです。
                デジタル庁も2024年に「FinOpsガイド 1.0版」を策定し、ガバメントクラウドの運用標準として位置付けています。
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: "1. 見える化", body: "タグ整備・コストダッシュボードでリソース別の支出を把握する" },
                  { step: "2. 最適化", body: "サイズ見直し・停止ルール・ストレージ階層化など運用改善を実施する" },
                  { step: "3. 継続改善", body: "月次レビューで効果を測定し、予算策定・次年度契約に反映する" },
                ].map((item) => (
                  <div key={item.step} className="bg-teal-50 border border-teal-100 rounded-lg p-4 space-y-1">
                    <div className="text-xs font-bold text-teal-700">{item.step}</div>
                    <p className="text-xs text-gray-700 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                ただし FinOps は<strong>移行後の運用最適化</strong>に効く手法です。
                移行前の基盤選定ミスや回線費・競争不足による構造問題は、FinOps だけでは解決できません。
                このページでは両方の打ち手を整理しています。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== コストの実態 ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-2">
            ガバメントクラウド移行コストの実態
          </h2>
          <p className="text-sm text-gray-500 text-center mb-10">出典: {COST_CONSTANTS.source}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-red-600">{COST_CONSTANTS.avgCostIncrease}倍</div>
              <div className="text-sm font-semibold text-gray-700">平均増加倍率</div>
              <div className="text-xs text-gray-500">移行前と比較した移行後の平均コスト増加</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-orange-600">{COST_CONSTANTS.maxCostIncrease}倍</div>
              <div className="text-sm font-semibold text-gray-700">最大増加倍率</div>
              <div className="text-xs text-gray-500">一部自治体では最大5.7倍のコスト増加も</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-yellow-700">935団体</div>
              <div className="text-sm font-semibold text-gray-700">遅延延長認定</div>
              <div className="text-xs text-gray-500">特定移行認定（2026年3月末期限延長）</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2択の打ち手（cost-reduction 統合） ===== */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-block text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">
              コスト削減の現実解
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              残りのシステムを同じ思想で移す前に
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              移行コストが平均{averageIncrease}まで膨張した事例を踏まえ、
              移行済み→運用最適化・未移行→基盤再選定の順で打ち手を整理します。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
              <div className="text-xs font-semibold text-blue-700">移行済みシステム</div>
              <h3 className="text-lg font-bold text-blue-900">運用最適化を先に進める</h3>
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                <li>サイズ見直し、停止ルール、タグ整備</li>
                <li>ストレージ階層化や保存期間ポリシー</li>
                <li>通信経路の整理と転送量の見える化</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-4">
              <div className="text-xs font-semibold text-green-700">未移行システム</div>
              <h3 className="text-lg font-bold text-green-900">移行前に基盤を見直す</h3>
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                <li>ベンダーと基盤再選定を協議する</li>
                <li>回線設計と外部連携の前提を見直す</li>
                <li>人口規模に応じて要件が過剰でないか確認する</li>
              </ul>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">なぜ見直しが必要か</h3>
            <p className="text-sm text-gray-600">
              FinOpsだけでは不十分な理由——回線費・二重負担・競争不足が重なると運用最適化では追いつきません。
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                "FinOpsは移行後の運用最適化には効くが、移行前提そのものは変えない",
                "通信費や回線費は、庁内完結から東京集約へ変わるほど効きやすい",
                "競争不足や一律要件が残ると、残存システムでも高コストが再生産されやすい",
              ].map((item) => (
                <div key={item} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PDF リード獲得（メイン） ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto rounded-2xl border border-blue-200 bg-blue-50 p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-lg">
              <p className="text-xs font-semibold text-blue-700">無料レポート（PDF）</p>
              <h2 className="text-xl font-bold text-gray-900">
                コスト削減の論点をPDFでまとめて共有
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                全国1,741自治体の進捗、コスト、遅延構造を1本に整理したPDFです。
                庁内説明や事業者との協議材料づくりに使えます。
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {["全国進捗サマリー", "コスト増の構造", "打ち手チェックリスト", "社内共有OK"].map((t) => (
                  <span key={t} className="bg-white border border-blue-200 text-blue-800 rounded-full px-3 py-1 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:min-w-[220px]">
              <a
                href="/report?from=finops_pdf"
                className="inline-flex items-center justify-center bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors text-sm"
              >
                無料でPDFを受け取る
              </a>
              <p className="text-xs text-center text-gray-500">メール＋所属のみ・スパムなし</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ベンダー別コストレンジ ===== */}
      <section id="cost-table" className="py-16 px-4 bg-gray-50">
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
                    <th key={v} className="text-center px-4 py-3 font-semibold text-gray-700">{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FINOPS_COST_TABLE.map((row, i) => (
                  <tr key={row.popLabel} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">{row.popLabel}</td>
                    {row.vendors.map((v) => (
                      <td key={v.name} className="px-4 py-3 text-center text-gray-700 whitespace-nowrap">
                        {formatManYen(v.afterMin)}〜{formatManYen(v.afterMax)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/costs" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              詳細コスト分析はこちら →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== クラウド基盤別コスト構造 ===== */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">クラウド基盤別コスト構造</h2>
          <p className="text-xs text-gray-500 mb-8">出典: デジタル庁先行事業調査 令和6年9月・各クラウドベンダー公式</p>
          <div className="grid md:grid-cols-2 gap-6">
            {CLOUD_SUMMARY.map((c) => (
              <div key={c.cloud} className="border border-gray-200 rounded-xl p-6 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-extrabold" style={{ color: c.color }}>{c.cloud}</span>
                    <span className="ml-2 text-sm text-gray-500">シェア {c.share} / コスト指数 {c.costIndex}</span>
                  </div>
                </div>
                <ul className="space-y-1">
                  {c.points.map((p) => (
                    <li key={p} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-0.5 text-gray-400">•</span>{p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/cloud" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              クラウド基盤の詳細比較はこちら →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FinOps 関連記事 ===== */}
      {articles.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">FinOps 関連記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 hover:shadow-md transition-shadow block"
                >
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{article.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{article.description}</p>
                  <p className="text-xs text-gray-400">{article.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== メール CTA（LP 末尾） ===== */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-800 to-blue-900 text-white">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">あなたの自治体のコスト診断（無料）</h2>
          <p className="text-blue-100 text-sm md:text-base">
            メールアドレスを入力すると、同規模自治体との比較レポートを無料でお届けします。
          </p>
          <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
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
          <p className="text-xs text-blue-200">スパムはしません。いつでも配信解除できます。</p>
        </div>
      </section>
    </main>
  );
}
