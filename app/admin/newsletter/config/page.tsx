"use client";

import { useEffect, useState } from "react";

type NewsletterConfig = {
  id: number;
  author_name: string;
  author_title: string;
  author_style: string;
  author_signature_html: string;
  reader_persona: string;
  reader_tone: string;
  reader_topics: string;
  x_keywords: string;
  note_keywords: string;
  updated_at: string;
};

const defaultConfig: Omit<NewsletterConfig, "id" | "updated_at"> = {
  author_name: "GCInsight編集部",
  author_title: "元JTC自治体担当 × 外資IT営業 × 政策ウォッチャー × 地方在住",
  author_style: "部外者がズバッと正論で指摘する",
  author_signature_html: "",
  reader_persona: "自治体DX担当者・ITベンダー営業・政策関心層",
  reader_tone: "わかりやすく・現場感重視・専門用語は必ず平易に解説",
  reader_topics: "ガバメントクラウド移行遅延・ベンダー動向・予算・住民影響",
  x_keywords: "ガバメントクラウド,自治体標準化,ガバクラ,自治体DX",
  note_keywords: "ガバメントクラウド,自治体DX,標準化基盤",
};

export default function NewsletterConfigPage() {
  const [form, setForm] = useState<Omit<NewsletterConfig, "id" | "updated_at">>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/newsletter/config")
      .then((r) => r.json())
      .then((data: NewsletterConfig & { error?: string }) => {
        if (data && !data.error) {
          const { id: _id, updated_at, ...fields } = data as NewsletterConfig;
          setForm(fields);
          setSavedAt(updated_at);
        }
      })
      .catch(() => {/* GETエラーは無視してデフォルト表示 */});
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/newsletter/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました");
      } else {
        setSavedAt(data.updated_at);
      }
    } catch {
      setError("ネットワークエラー");
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderBottom: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
    color: "#111",
    padding: "8px 0",
    background: "transparent",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    display: "block",
  };

  const fieldWrapStyle: React.CSSProperties = {
    marginBottom: 24,
  };

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "40px 24px 120px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#111",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>ニュースレター設定</h1>
      {savedAt && (
        <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 32 }}>
          最終保存: {new Date(savedAt).toLocaleString("ja-JP")}
        </p>
      )}

      {/* 著者設定 */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#6b7280",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 24,
            paddingBottom: 8,
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          著者設定
        </h2>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="author_name">著者名</label>
          <input
            id="author_name"
            name="author_name"
            type="text"
            value={form.author_name}
            onChange={handleChange}
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="author_title">肩書き</label>
          <input
            id="author_title"
            name="author_title"
            type="text"
            value={form.author_title}
            onChange={handleChange}
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="author_style">執筆スタイル</label>
          <textarea
            id="author_style"
            name="author_style"
            rows={2}
            value={form.author_style}
            onChange={handleChange}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="author_signature_html">署名HTML</label>
          <textarea
            id="author_signature_html"
            name="author_signature_html"
            rows={4}
            value={form.author_signature_html}
            onChange={handleChange}
            placeholder="メール末尾に挿入されるHTMLを入力"
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </div>
      </section>

      {/* 読者・収集設定 */}
      <section style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#6b7280",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 24,
            paddingBottom: 8,
            borderBottom: "1px solid #f3f4f6",
          }}
        >
          読者・収集設定
        </h2>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="reader_persona">想定読者</label>
          <input
            id="reader_persona"
            name="reader_persona"
            type="text"
            value={form.reader_persona}
            onChange={handleChange}
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="reader_tone">トーン・スタイル</label>
          <textarea
            id="reader_tone"
            name="reader_tone"
            rows={2}
            value={form.reader_tone}
            onChange={handleChange}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="reader_topics">主要トピック（カンマ区切り）</label>
          <input
            id="reader_topics"
            name="reader_topics"
            type="text"
            value={form.reader_topics}
            onChange={handleChange}
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="x_keywords">X検索キーワード（カンマ区切り）</label>
          <input
            id="x_keywords"
            name="x_keywords"
            type="text"
            value={form.x_keywords}
            onChange={handleChange}
            style={fieldStyle}
          />
        </div>

        <div style={fieldWrapStyle}>
          <label style={labelStyle} htmlFor="note_keywords">note検索キーワード（カンマ区切り）</label>
          <input
            id="note_keywords"
            name="note_keywords"
            type="text"
            value={form.note_keywords}
            onChange={handleChange}
            style={fieldStyle}
          />
        </div>
      </section>

      {error && (
        <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      {/* 保存ボタン（右下固定） */}
      <div
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 200,
        }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? "#555" : "#111",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            padding: "10px 24px",
            border: "none",
            borderRadius: 8,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
          }}
        >
          {saving ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
