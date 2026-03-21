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

export default function ReportClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);
  const [showReport, setShowReport] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch("/api/report");
      const data = await res.json();
      setReport(data);
      setShowReport(true);
    } catch {
      alert("レポートの取得に失敗しました");
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

          {/* CTA */}
          <div className="bg-gray-50 border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4">
              無料でレポートをダウンロード
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="メールアドレス（任意）"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleDownload}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loading ? "読み込み中..." : "無料ダウンロード"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※メールアドレスの入力は任意です。入力された場合、更新情報をお届けします。
            </p>
          </div>
        </div>
      )}

      {/* レポート表示 */}
      {showReport && report && (
        <div>
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
