"use client";

import { useState, useMemo } from "react";
import data from "@/public/data/standardization.json";
import { Municipality } from "@/lib/types";

const PREFECTURES_LIST = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

function buildTemplate(pref: string, munis: Municipality[]): string {
  const total = munis.length;
  const completed = munis.filter((m) => m.overall_rate === 1).length;
  const completedPct = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";
  const critical = munis.filter((m) => (m.overall_rate ?? 1) < 0.5).length;

  // 遅延上位3件
  const delayed = [...munis]
    .filter((m) => typeof m.overall_rate === "number" && m.overall_rate < 1)
    .sort((a, b) => (a.overall_rate as number) - (b.overall_rate as number))
    .slice(0, 3);

  const delayedList = delayed.length > 0
    ? delayed
        .map((m) => `${m.city}（進捗率${((m.overall_rate as number) * 100).toFixed(0)}%）`)
        .join("、")
    : "データなし";

  const dataMonth = (data.summary as { data_month?: string }).data_month ?? "最新";

  return `[${pref}]におけるガバメントクラウド移行の進捗状況について

1. ${pref}内の市区町村における標準化対応状況
   - 全${total}団体中、全20業務完了: ${completed}団体（${completedPct}%）
   - 危機的状況（進捗50%未満）: ${critical}団体

2. 特に遅延が懸念される自治体
   - ${delayedList}

出典: GCInsight（gcinsight.jp）、総務省・デジタル庁公表データ（${dataMonth}時点）`;
}

export default function TemplatePage() {
  const [selectedPref, setSelectedPref] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const municipalities = data.municipalities as Municipality[];

  const prefMunis = useMemo(() => {
    if (!selectedPref) return [];
    return municipalities.filter((m) => m.prefecture === selectedPref);
  }, [selectedPref, municipalities]);

  const templateText = useMemo(() => {
    if (!selectedPref || prefMunis.length === 0) return "";
    return buildTemplate(selectedPref, prefMunis);
  }, [selectedPref, prefMunis]);

  async function handleCopy() {
    if (!templateText) return;
    await navigator.clipboard.writeText(templateText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ページヘッダー */}
      <div className="pb-2">
        <h1 className="page-title">質問主意書テンプレート生成</h1>
        <p className="page-subtitle">
          都道府県を選択すると、その県の移行状況データを使った質問主意書テンプレートを自動生成します。
        </p>
      </div>

      {/* 都道府県セレクタ */}
      <div className="card p-5 space-y-3">
        <label
          htmlFor="pref-template-select"
          className="block text-sm font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          対象都道府県
        </label>
        <select
          id="pref-template-select"
          className="text-sm rounded-lg px-3 py-2 border w-full"
          style={{
            borderColor: "#E5E7EB",
            color: "var(--color-text-secondary)",
            backgroundColor: "white",
          }}
          value={selectedPref}
          onChange={(e) => {
            setSelectedPref(e.target.value);
            setCopied(false);
          }}
        >
          <option value="" disabled>都道府県を選択…</option>
          {PREFECTURES_LIST.map((pref) => (
            <option key={pref} value={pref}>{pref}</option>
          ))}
        </select>

        {selectedPref && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            対象自治体数: {prefMunis.length}団体
          </p>
        )}
      </div>

      {/* テンプレート表示 */}
      {templateText && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              生成されたテンプレート
            </p>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={
                copied
                  ? { borderColor: "#10B981", color: "#10B981", backgroundColor: "#f0fdf4" }
                  : { borderColor: "#E5E7EB", color: "var(--color-text-secondary)", backgroundColor: "white" }
              }
            >
              {copied ? (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  コピー完了
                </>
              ) : (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  コピー
                </>
              )}
            </button>
          </div>

          <textarea
            readOnly
            value={templateText}
            rows={14}
            className="w-full text-sm rounded-lg px-3 py-2.5 border resize-y"
            style={{
              borderColor: "#E5E7EB",
              color: "var(--color-text-secondary)",
              backgroundColor: "#f8fafc",
              fontFamily: "var(--font-mono, monospace)",
              lineHeight: "1.7",
            }}
          />

          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ※ 数値は総務省・デジタル庁公表データをもとに GCInsight が算出したものです。ご利用の際は最新データをご確認ください。
          </p>
        </div>
      )}

      {!selectedPref && (
        <div
          className="rounded-xl px-5 py-8 text-center"
          style={{ backgroundColor: "#f8fafc", border: "1px dashed #e5e7eb" }}
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            都道府県を選択するとテンプレートが生成されます
          </p>
        </div>
      )}
    </div>
  );
}
