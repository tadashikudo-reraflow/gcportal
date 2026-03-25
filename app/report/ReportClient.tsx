"use client";

import { useState } from "react";

const ORG_OPTIONS = [
  { value: "municipality", label: "自治体職員" },
  { value: "it_vendor", label: "IT企業・SIer" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "politician", label: "議員・議員事務所" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
];

type PrefData = { prefecture: string; avg_rate: number };

type ReportData = {
  title: string;
  dataMonth: string;
  generatedAt: string;
  executive_summary: {
    total_municipalities: number;
    avg_rate: number;
    completed_count: number;
    critical_count: number;
    deadline: string;
  };
  prefecture_ranking: { top10: PrefData[]; bottom10: PrefData[] };
  cost: {
    avgCostIncrease: number;
    maxCostIncrease: number;
    source: string;
    costFactors: string[];
  };
  sections: { title: string; content: string }[];
};

function generatePrintHTML(report: ReportData): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    @page { margin: 15mm 20mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Hiragino Kaku Gothic Pro', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
      color: #111827; line-height: 1.7; font-size: 10pt; margin: 0;
    }
    h1 { font-size: 17pt; color: #002D72; border-bottom: 3px solid #002D72; padding-bottom: 8px; margin-bottom: 4px; }
    h2 { font-size: 12pt; color: #002D72; margin-top: 22px; margin-bottom: 8px; }
    .meta { color: #6b7280; font-size: 8pt; margin-bottom: 18px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; }
    .stat { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; text-align: center; background: #f9fafb; }
    .stat-num { font-size: 17pt; font-weight: 800; color: #002D72; }
    .stat-label { font-size: 7pt; color: #6b7280; margin-top: 2px; }
    .section { margin: 12px 0; page-break-inside: avoid; }
    .section-body { background: #eff6ff; border-left: 4px solid #002D72; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 9.5pt; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8.5pt; }
    th { background: #002D72; color: white; padding: 5px 8px; text-align: left; }
    td { border: 1px solid #e5e7eb; padding: 5px 8px; }
    tr:nth-child(even) td { background: #f9fafb; }
    .ranking-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .cost-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 12px 16px; margin: 10px 0; }
    .cost-num { font-size: 18pt; font-weight: 800; color: #c2410c; }
    .footer { margin-top: 28px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 7.5pt; color: #9ca3af; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>${report.title}</h1>
  <p class="meta">
    データ基準月: ${report.dataMonth} &nbsp;|&nbsp;
    生成: ${new Date(report.generatedAt).toLocaleString("ja-JP")} &nbsp;|&nbsp;
    移行目標時期: ${report.executive_summary.deadline} &nbsp;|&nbsp;
    © GCInsight (gcinsight.jp)
  </p>

  <div class="stats">
    <div class="stat">
      <div class="stat-num">${report.executive_summary.total_municipalities.toLocaleString()}</div>
      <div class="stat-label">対象自治体数</div>
    </div>
    <div class="stat">
      <div class="stat-num">${(report.executive_summary.avg_rate * 100).toFixed(1)}%</div>
      <div class="stat-label">平均移行率</div>
    </div>
    <div class="stat">
      <div class="stat-num">${report.executive_summary.completed_count}</div>
      <div class="stat-label">移行完了</div>
    </div>
    <div class="stat">
      <div class="stat-num">${report.executive_summary.critical_count}</div>
      <div class="stat-label">深刻な遅延</div>
    </div>
  </div>

  ${report.sections
    .map(
      (s) => `
  <div class="section">
    <h2>${s.title}</h2>
    <div class="section-body">${s.content}</div>
  </div>`
    )
    .join("")}

  <h2>コスト分析ハイライト</h2>
  <div class="cost-box">
    先行事業参加団体の移行後コストは平均 <span class="cost-num">${report.cost.avgCostIncrease}x</span>（最大 ${report.cost.maxCostIncrease}x）に増加。<br>
    主因: ${report.cost.costFactors.join(" / ")}<br>
    <small style="color:#9ca3af">出典: ${report.cost.source} ／ ※GCInsight編集部算出の推計値。先行事業参加の限られた団体群のデータに基づく。全国平均を示すものではない。</small>
  </div>

  <h2>都道府県別ランキング</h2>
  <div class="ranking-grid">
    <div>
      <p style="font-weight:600;margin-bottom:4px">▲ 上位10都道府県</p>
      <table>
        <tr><th>#</th><th>都道府県</th><th>移行率</th></tr>
        ${report.prefecture_ranking.top10
          .map(
            (p, i) =>
              `<tr><td>${i + 1}</td><td>${p.prefecture}</td><td>${(p.avg_rate * 100).toFixed(1)}%</td></tr>`
          )
          .join("")}
      </table>
    </div>
    <div>
      <p style="font-weight:600;margin-bottom:4px">▼ 下位10都道府県</p>
      <table>
        <tr><th>#</th><th>都道府県</th><th>移行率</th></tr>
        ${report.prefecture_ranking.bottom10
          .map(
            (p, i) =>
              `<tr><td>${report.prefecture_ranking.bottom10.length - i}</td><td>${p.prefecture}</td><td>${(p.avg_rate * 100).toFixed(1)}%</td></tr>`
          )
          .join("")}
      </table>
    </div>
  </div>

  <div class="footer">
    GCInsight — ガバメントクラウド移行データベース &nbsp;|&nbsp; gcinsight.jp &nbsp;|&nbsp;
    本レポートは公開情報を基にした参考資料です。正確な情報は各自治体・デジタル庁の公式資料をご確認ください。
  </div>
</body>
</html>`;
}

export default function ReportClient() {
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = email.includes("@") && orgType && agreed && !loading;

  async function handleDownload() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");

    try {
      // 1. リード保存
      const leadRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          organization_type: orgType,
          source: "report",
        }),
      });

      if (!leadRes.ok) {
        const err = await leadRes.json();
        setError(err.error || "登録に失敗しました");
        return;
      }

      // 2. Supabase Storage から signed URL を取得して直接DL
      const dlRes = await fetch("/api/report/download");
      if (dlRes.ok) {
        const { url } = await dlRes.json();
        const a = document.createElement("a");
        a.href = url;
        a.download = "gcinsight-report-2026.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // Storage 未設定時のフォールバック: 印刷ダイアログ
        const reportRes = await fetch("/api/report");
        if (!reportRes.ok) throw new Error("report fetch failed");
        const report: ReportData = await reportRes.json();
        const html = generatePrintHTML(report);
        const win = window.open("", "_blank", "width=900,height=700");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 700);
        }
      }

      setShowThanks(true);
    } catch {
      setError("処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* フォームセクション */}
      {!showThanks && (
        <div className="text-center">
          <div className="bg-gradient-to-br from-[#002D72] to-[#001440] text-white rounded-2xl p-8 md:p-12 mb-8">
            <p className="text-blue-300 text-sm font-medium tracking-widest mb-2 uppercase">
              2025年度末（2026-03-31）移行目標時期の全実態
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              1,741自治体の<br />リアルな進捗データ
            </h1>
            <p className="text-blue-200 text-lg mb-6">
              標準化対象34,592システムの進捗・コスト・遅延構造を完全解説。
              社内報告・議会答弁・ベンダー交渉にそのまま使える約20,000字の調査レポート。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">38.4%</div>
                <div className="text-sm text-blue-200">移行完了率</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">935団体</div>
                <div className="text-sm text-blue-200">遅延・延長認定</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">2.3x</div>
                <div className="text-sm text-blue-200">コスト増加（推計）</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">8章</div>
                <div className="text-sm text-blue-200">完全解説</div>
              </div>
            </div>
          </div>

          {/* レポート内容プレビュー */}
          <div className="bg-white border rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-bold mb-1">レポート内容（約20,000字）</h2>
            <p className="text-xs text-gray-400 mb-4">データ基準：原則2026年1月末 ／ 特定移行支援システムは2025年12月末時点</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">1.</span>
                <span><strong>移行期限の概要と背景</strong> — なぜ2026年3月31日か・標準化の3つの目的</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">2.</span>
                <span><strong>進捗状況の全体像</strong> — 38.4%・特定移行支援システム8,956件・業務別の進捗差</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">3.</span>
                <span><strong>コスト構造の解体</strong> — 平均2.3倍増の原因・非機能要件問題・小規模自治体の不均衡</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">4-5.</span>
                <span><strong>遅延の構造的原因・デジタル庁の対応</strong> — ベンダー不足・制度設計の欠陥・コスト低減策</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">6.</span>
                <span><strong>都道府県・規模別ランキング</strong> — 上位／下位10都道府県（推計値）・規模別サマリー</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">7.</span>
                <span><strong>利害関係者別アクションプラン</strong> — 自治体職員・ITベンダー・議員・メディア別に解説</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">8.</span>
                <span><strong>2026年以降のロードマップ</strong> — 2031年度末までの移行フェーズ・第3幕の予告</span>
              </li>
            </ul>
          </div>

          {/* CTAフォーム */}
          <div className="bg-gray-50 border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">
              無料レポートを受け取る（PDF・約20,000字）
            </h3>
            <div className="max-w-md mx-auto space-y-4">
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-700"
                required
              >
                <option value="">ご所属を選択してください</option>
                {ORG_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label className="flex items-start gap-2 text-sm text-gray-600 text-left cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  レポートのダウンロードおよび更新情報のメール配信に同意します。
                  配信はいつでも解除できます。
                </span>
              </label>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                onClick={handleDownload}
                disabled={!canSubmit}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "準備中..." : "レポートを受け取る →"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              ※ご入力いただいた情報はレポート配信のみに使用します。第三者への提供はいたしません。
            </p>
          </div>
        </div>
      )}

      {/* サンクス画面 */}
      {showThanks && (
        <div className="text-center max-w-lg mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-12">
            <div className="text-5xl mb-4">&#128196;</div>
            <h2 className="text-2xl font-bold text-green-800 mb-3">
              PDFを開いています
            </h2>
            <p className="text-green-700 mb-6">
              今後のデータ更新・解説レポートは
              <br />
              <strong>{email}</strong> 宛にお届けします。
            </p>
            <div className="bg-white rounded-xl p-5 mb-6 text-left">
              <h3 className="font-bold text-gray-800 mb-3">
                メールでお届けする内容
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  <span>
                    週次「ガバクラ週報」— 最新動向と編集部の見解
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  <span>レポート更新のお知らせ（データ更新時）</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowThanks(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← トップに戻る
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            印刷ダイアログが表示されない場合は、ブラウザのポップアップ許可設定をご確認ください。
            配信はいつでも解除できます。
          </p>
        </div>
      )}
    </div>
  );
}
