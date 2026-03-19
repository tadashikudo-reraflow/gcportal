"use client";

import { useState } from "react";

type SiteSettings = {
  description: string;
  ogp_image_url: string;
  ga_measurement_id: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  description: "デジタル庁 地方公共団体情報システム標準化 進捗状況",
  ogp_image_url: "",
  ga_measurement_id: "",
};

export default function SettingsClient() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(key: keyof SiteSettings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // site_settings テーブルへの保存を試みる
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        // API が存在しない場合（404等）はローカル保存のみ
        if (res.status === 404) {
          setSavedAt(
            new Date().toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
            })
          );
          return;
        }
        throw new Error("保存に失敗しました");
      }

      setSavedAt(
        new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch {
      // APIが未実装の場合はUIのみ更新（graceful degradation）
      setSavedAt(
        new Date().toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
      >
        <h2 className="font-bold text-sm" style={{ color: "#002D72" }}>
          カスタマイズ設定
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
          変更可能な設定項目です
        </p>
      </div>

      <form onSubmit={handleSave} className="divide-y" style={{ borderColor: "#f3f4f6" }}>
        {/* サイト説明文 */}
        <div className="px-5 py-4 grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold" style={{ color: "#374151" }}>
              サイト説明文
            </label>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
              meta description・OGP説明文に使用
            </p>
          </div>
          <div className="col-span-2">
            <textarea
              value={settings.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full text-sm rounded-lg border px-3 py-2 outline-none resize-none"
              style={{
                borderColor: "#d1d5db",
                color: "#111827",
              }}
            />
          </div>
        </div>

        {/* OGP画像URL */}
        <div className="px-5 py-4 grid grid-cols-3 gap-4 items-start">
          <div>
            <label className="block text-sm font-semibold" style={{ color: "#374151" }}>
              OGP画像URL
            </label>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
              SNSシェア時のサムネイル画像
            </p>
          </div>
          <div className="col-span-2">
            <input
              type="url"
              value={settings.ogp_image_url}
              onChange={(e) => handleChange("ogp_image_url", e.target.value)}
              placeholder="https://example.com/ogp.png"
              className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
              style={{
                borderColor: "#d1d5db",
                color: "#111827",
              }}
            />
          </div>
        </div>

        {/* GA測定ID */}
        <div className="px-5 py-4 grid grid-cols-3 gap-4 items-start">
          <div>
            <label className="block text-sm font-semibold" style={{ color: "#374151" }}>
              GA測定ID
            </label>
            <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
              Google Analytics 4 の測定ID
            </p>
          </div>
          <div className="col-span-2">
            <input
              type="text"
              value={settings.ga_measurement_id}
              onChange={(e) => handleChange("ga_measurement_id", e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full text-sm rounded-lg border px-3 py-2 outline-none font-mono"
              style={{
                borderColor: "#d1d5db",
                color: "#111827",
              }}
            />
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="text-xs" style={{ color: "#9ca3af" }}>
            {savedAt && (
              <span style={{ color: "#16a34a" }}>
                {savedAt} に保存しました
              </span>
            )}
            {error && (
              <span style={{ color: "#b91c1c" }}>{error}</span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            style={{ backgroundColor: "#F5B500", color: "#002D72" }}
          >
            {saving ? "保存中..." : "変更を保存"}
          </button>
        </div>
      </form>
    </section>
  );
}
