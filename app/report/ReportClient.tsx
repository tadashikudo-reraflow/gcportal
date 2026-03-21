"use client";

import { useState } from "react";

type ReportData = {
  generatedAt: string;
  title: string;
  dataMonth: string;
  executive_summary: {
    total_municipalities: number;
    avg_rate: number;
    completed_count: number;
    critical_count: number;
    at_risk_count: number;
    on_track_count: number;
    deadline: string;
  };
  prefecture_ranking: {
    top10: Array<{ prefecture: string; avg_rate: number; count: number }>;
    bottom10: Array<{ prefecture: string; avg_rate: number; count: number }>;
  };
  cost: {
    avgCostIncrease: number;
    maxCostIncrease: number;
    costFactors: string[];
  };
  sections: Array<{ title: string; content: string }>;
};

const ORG_OPTIONS = [
  { value: "municipality", label: "自治体職員" },
  { value: "it_vendor", label: "IT企業・SIer" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "politician", label: "議員・議員事務所" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
];

export default function ReportClient() {
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showReport, setShowReport] = useState(false);
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

      // 2. レポート取得
      const res = await fetch("/api/report");
      const data = await res.json();
      setReport(data);
      setShowReport(true);
    } catch {
      setError("レポートの取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* リード獲得セクション */}
      {!showReport && (
        <div className="text-center">
          <div className="bg-gradient-to-br from-[#002D72] to-[#001440] text-white rounded-2xl p-8 md:p-12 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              ガバメントクラウド移行
              <br />
              最終結果レポート 2026
            </h1>
            <p className="text-blue-200 text-lg mb-6">
              全国1,741自治体の移行状況を完全網羅した無料レポート
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">47</div>
                <div className="text-sm text-blue-200">都道府県分析</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">1,741</div>
                <div className="text-sm text-blue-200">自治体データ</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">2.3x</div>
                <div className="text-sm text-blue-200">コスト増加分析</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold">4</div>
                <div className="text-sm text-blue-200">推奨事項</div>
              </div>
            </div>
          </div>

          {/* レポート内容プレビュー */}
          <div className="bg-white border rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-bold mb-4">レポート内容</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">1.</span>
                <span>
                  <strong>エグゼクティブサマリー</strong> —
                  移行期限に対する全体進捗と課題の概要
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">2.</span>
                <span>
                  <strong>都道府県別分析</strong> —
                  上位10・下位10のランキングと地域間格差
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">3.</span>
                <span>
                  <strong>コスト分析</strong> —
                  移行コスト増加要因と構造的課題の解説
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 font-bold">4.</span>
                <span>
                  <strong>推奨事項</strong> —
                  遅延自治体・情報システム担当者向けアクションプラン
                </span>
              </li>
            </ul>
          </div>

          {/* CTA フォーム */}
          <div className="bg-gray-50 border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">
              無料でレポートをダウンロード
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
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              <button
                onClick={handleDownload}
                disabled={!canSubmit}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "読み込み中..." : "無料ダウンロード"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              ※ご入力いただいた情報はレポート配信のみに使用します。第三者への提供はいたしません。
            </p>
          </div>
        </div>
      )}

      {/* レポート表示 + サンクス */}
      {showReport && report && (
        <div>
          {/* サンクスバナー */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 print:hidden">
            <h2 className="text-lg font-bold text-green-800 mb-2">
              レポートをご覧いただけます
            </h2>
            <p className="text-green-700 text-sm mb-4">
              下記のボタンからPDF保存できます。週次「ガバクラ週報」を{email}宛にお届けします。
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://note.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
              >
                note で有料レポートを見る →
              </a>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 print:hidden">
            <button
              onClick={() => setShowReport(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              ← 戻る
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              PDF保存 (印刷)
            </button>
          </div>

          {/* 印刷用レポート本体 */}
          <div className="print:p-0" id="report-content">
            <div className="bg-gradient-to-br from-[#002D72] to-[#001440] text-white rounded-xl p-8 mb-8 print:rounded-none print:mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">{report.title}</h1>
              <p className="text-blue-200 mt-2">
                データ月: {report.dataMonth} | 生成日:{" "}
                {new Date(report.generatedAt).toLocaleDateString("ja-JP")}
              </p>
            </div>

            {/* エグゼクティブサマリー */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {report.sections[0]?.title}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-800">
                    {(report.executive_summary.avg_rate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">平均移行進捗率</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-800">
                    {report.executive_summary.completed_count}
                  </div>
                  <div className="text-sm text-gray-600">完了自治体</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-800">
                    {report.executive_summary.critical_count}
                  </div>
                  <div className="text-sm text-gray-600">深刻な遅延</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-800">
                    {report.executive_summary.at_risk_count}
                  </div>
                  <div className="text-sm text-gray-600">リスクあり</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {report.executive_summary.total_municipalities}
                  </div>
                  <div className="text-sm text-gray-600">対象自治体数</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {report.executive_summary.deadline}
                  </div>
                  <div className="text-sm text-gray-600">移行期限</div>
                </div>
              </div>
              <p className="text-gray-700">{report.sections[0]?.content}</p>
            </div>

            {/* 都道府県ランキング */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {report.sections[1]?.title}
              </h2>
              <p className="text-gray-700 mb-4">
                {report.sections[1]?.content}
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-green-700 mb-2">
                    進捗率 上位10
                  </h3>
                  <div className="space-y-2">
                    {report.prefecture_ranking.top10.map((p, i) => (
                      <div key={p.prefecture} className="flex items-center gap-2">
                        <span className="w-6 text-sm text-gray-500 text-right">
                          {i + 1}.
                        </span>
                        <span className="w-20 text-sm font-medium">
                          {p.prefecture}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-green-500 h-full rounded-full"
                            style={{ width: `${p.avg_rate * 100}%` }}
                          />
                        </div>
                        <span className="w-14 text-sm text-right">
                          {(p.avg_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-red-700 mb-2">
                    進捗率 下位10
                  </h3>
                  <div className="space-y-2">
                    {report.prefecture_ranking.bottom10.map((p, i) => (
                      <div key={p.prefecture} className="flex items-center gap-2">
                        <span className="w-6 text-sm text-gray-500 text-right">
                          {i + 1}.
                        </span>
                        <span className="w-20 text-sm font-medium">
                          {p.prefecture}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-red-400 h-full rounded-full"
                            style={{ width: `${p.avg_rate * 100}%` }}
                          />
                        </div>
                        <span className="w-14 text-sm text-right">
                          {(p.avg_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* コスト分析 */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {report.sections[2]?.title}
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-orange-700">
                    {report.cost.avgCostIncrease}x
                  </div>
                  <div className="text-sm text-gray-600">平均コスト増加</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-700">
                    {report.cost.maxCostIncrease}x
                  </div>
                  <div className="text-sm text-gray-600">最大コスト増加</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-700">
                    {report.cost.costFactors.length}
                  </div>
                  <div className="text-sm text-gray-600">主要因</div>
                </div>
              </div>
              <p className="text-gray-700 mb-3">
                {report.sections[2]?.content}
              </p>
              <ul className="space-y-1">
                {report.cost.costFactors.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-orange-500">&#9679;</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* 推奨事項 */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                {report.sections[3]?.title}
              </h2>
              <p className="text-gray-700">{report.sections[3]?.content}</p>
            </div>

            {/* フッター */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>
                本レポートはGCInsight（gcinsight.jp）が公開データを基に作成したものです。
              </p>
              <p>
                データソース: 総務省、デジタル庁、内閣官房
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
