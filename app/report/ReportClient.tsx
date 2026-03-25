"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const ORG_OPTIONS = [
  { value: "municipality", label: "自治体職員" },
  { value: "it_vendor", label: "IT企業・SIer" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "politician", label: "議員・議員事務所" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
];

export default function ReportClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [error, setError] = useState("");

  const from = searchParams.get("from");
  const source = from ? `report:${from}` : "report";

  const sourceLabels: Record<string, string> = {
    hero: "トップページ",
    hero_mobile: "トップページ",
    home_cta: "トップページ",
    header: "ヘッダー",
    footer: "フッター",
    nav: "メニュー",
    costs: "コスト分析ページ",
    cloud: "クラウド基盤分析ページ",
    cost_reduction: "コスト削減特設ページ",
  };
  const sourceLabel = from ? sourceLabels[from] ?? "関連ページ" : null;

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
          source,
        }),
      });

      if (!leadRes.ok) {
        const err = await leadRes.json();
        setError(err.error || "登録に失敗しました");
        return;
      }

      // 2. PDFリンクはBeehiiv Welcome Emailで送信 → サンクス画面に誘導
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
            {sourceLabel && (
              <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold mb-4">
                {sourceLabel}をご覧の方向け
              </p>
            )}
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
            <div className="text-5xl mb-4">&#9993;</div>
            <h2 className="text-2xl font-bold text-green-800 mb-3">
              登録ありがとうございます
            </h2>
            <p className="text-green-700 mb-6">
              <strong>{email}</strong> 宛に
              <br />
              PDFダウンロードリンクをお送りしました。
              <br />
              <span className="text-sm">※リンクの有効期限は<strong>48時間</strong>です。</span>
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
