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

export default function ReportClient() {
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
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

      setShowReport(true);
    } catch {
      setError("登録に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
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

      {/* サンクス画面 */}
      {showReport && (
        <div className="text-center max-w-lg mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 md:p-12">
            <div className="text-5xl mb-4">&#9993;</div>
            <h2 className="text-2xl font-bold text-green-800 mb-3">
              登録ありがとうございます
            </h2>
            <p className="text-green-700 mb-6">
              <strong>{email}</strong> 宛にレポートのダウンロードリンクをお送りしました。
              メールをご確認ください。
            </p>
            <div className="bg-white rounded-xl p-5 mb-6 text-left">
              <h3 className="font-bold text-gray-800 mb-3">今後のお届け内容</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">1.</span>
                  <span>無料レポート「ガバメントクラウド移行 最終結果レポート 2026」</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">2.</span>
                  <span>週次「ガバクラ週報」— 最新動向と編集部の見解</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setShowReport(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← トップに戻る
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            メールが届かない場合は迷惑メールフォルダをご確認ください。
            配信はいつでも解除できます。
          </p>
        </div>
      )}
    </div>
  );
}
