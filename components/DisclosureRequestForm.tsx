"use client";

import { useState } from "react";

const CATEGORY_OPTIONS = [
  { value: "migration_plan", label: "移行計画・方針（計画書・基本設計等）" },
  { value: "delay_reason", label: "遅延・未移行の理由（報告書・通知等）" },
  { value: "cost", label: "コスト・予算（契約金額・費用積算等）" },
  { value: "vendor", label: "ベンダー・調達（仕様書・入札結果等）" },
  { value: "schedule", label: "スケジュール（工程表・期限延長通知等）" },
  { value: "municipality", label: "特定自治体の状況（個別案件）" },
  { value: "other", label: "その他" },
];

const ORG_OPTIONS = [
  { value: "municipality", label: "自治体職員" },
  { value: "it_vendor", label: "IT企業・SIer" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "politician", label: "議員・議員事務所" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
];

export default function DisclosureRequestForm() {
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const isMunicipality = category === "municipality";
  const canSubmit =
    topic.trim().length >= 5 && category && agreed && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          category,
          municipality: isMunicipality ? municipality.trim() : undefined,
          email: email.trim() || undefined,
          organization_type: orgType || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "送信に失敗しました");
        return;
      }
      setDone(true);
    } catch {
      setError("処理に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ backgroundColor: "#F0F7FF", border: "1px solid #C7DFFF" }}
      >
        <div className="text-4xl mb-3">📨</div>
        <p
          className="font-bold text-lg mb-2"
          style={{ color: "var(--color-brand-primary)" }}
        >
          リクエストを受け付けました
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          GCInsight編集部が内容を確認し、開示請求の対象として適切と判断した場合に
          デジタル庁へ代理提出します。
          <br />
          結果が公開された際は、サイト上でお知らせします。
        </p>
        {email && (
          <p
            className="text-xs mt-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            ※ 結果通知先: {email}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 2px 12px rgba(0,51,141,0.06)",
      }}
    >
      {/* ヘッダー */}
      <div
        className="px-6 pt-5 pb-4"
        style={{
          borderBottom: "1px solid var(--color-border)",
          background: "linear-gradient(135deg, #F0F7FF 0%, #FFFFFF 100%)",
        }}
      >
        <p
          className="font-bold text-base"
          style={{ color: "var(--color-brand-primary)" }}
        >
          📄 開示請求リクエストを送る
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--color-text-secondary)" }}
        >
          「こんな情報が欲しい」を教えてください。GCInsight編集部が代理でデジタル庁へ開示請求し、結果をサイトで公開します。
        </p>
      </div>

      {/* フォーム本体 */}
      <div className="px-6 py-5 space-y-4">
        {/* カテゴリ */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--color-text-primary)" }}
          >
            カテゴリ <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "#F9FAFB",
              color: category ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            <option value="">選択してください</option>
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* 特定自治体（条件表示） */}
        {isMunicipality && (
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: "var(--color-text-primary)" }}
            >
              自治体名
            </label>
            <input
              type="text"
              placeholder="例: 横浜市、北海道札幌市"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{
                border: "1px solid var(--color-border)",
                backgroundColor: "#F9FAFB",
                fontSize: 14,
              }}
            />
          </div>
        )}

        {/* 知りたい内容 */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--color-text-primary)" }}
          >
            知りたい内容・背景{" "}
            <span style={{ color: "var(--color-error)" }}>*</span>
          </label>
          <textarea
            placeholder="例: ガバメントクラウドへの移行が遅延している自治体の理由・報告書を知りたい。議会質問の参考にしたい。"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "#F9FAFB",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          />
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {topic.trim().length}/5文字以上必須
          </p>
        </div>

        {/* 所属（任意） */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            ご所属（任意）
          </label>
          <select
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "#F9FAFB",
              color: orgType ? "var(--color-text-primary)" : "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            <option value="">選択しない</option>
            {ORG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* メール（任意） */}
        <div>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            結果通知メール（任意）
          </label>
          <input
            type="email"
            placeholder="example@org.jp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "#F9FAFB",
              fontSize: 14,
            }}
          />
          <p
            className="text-xs mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            開示結果が出た際にお知らせします（スパムなし）
          </p>
        </div>

        {/* 同意チェック */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 flex-shrink-0"
            style={{ accentColor: "var(--color-brand-primary)", width: 16, height: 16 }}
          />
          <span
            className="text-xs leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            本リクエストはGCInsight編集部が判断し代理提出します（提出を保証するものではありません）。
            入力情報は開示請求業務にのみ使用します。
          </span>
        </label>

        {/* エラー */}
        {error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        {/* 送信ボタン */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all"
          style={{
            backgroundColor: canSubmit
              ? "var(--color-brand-primary)"
              : "var(--color-surface-container-high)",
            color: canSubmit ? "#FFFFFF" : "var(--color-text-muted)",
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "送信中…" : "リクエストを送る"}
        </button>
      </div>
    </div>
  );
}
