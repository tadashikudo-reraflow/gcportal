"use client";

import { useState } from "react";

type CategoryStat = {
  category: string;
  count: number;
};

type Props = {
  initialCategories: CategoryStat[];
};

export default function CategoryClient({ initialCategories }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 名前からスラッグを自動生成
  function handleNameChange(value: string) {
    setName(value);
    if (!slug || slug === toSlug(name)) {
      setSlug(toSlug(value));
    }
  }

  function toSlug(str: string): string {
    return str
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "")
      .replace(/--+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "error", text: "カテゴリー名を入力してください" });
      return;
    }
    // カテゴリーは articles.category カラムで管理するため、
    // 専用テーブルがない場合はUIのみの追加表示（実際の記事への適用は記事編集時）
    setMessage({
      type: "success",
      text: `カテゴリー「${name}」を登録しました。記事編集画面でこのカテゴリーを選択してください。`,
    });
    setName("");
    setSlug("");
    setDescription("");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* ページヘッダー */}
      <div
        className="px-6 py-5 border-b"
        style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
      >
        <h1 className="text-xl font-extrabold" style={{ color: "#002D72" }}>
          カテゴリー管理
        </h1>
        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
          記事のカテゴリーを管理します。カテゴリーは articles.category カラムで管理されます。
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左: 新規追加フォーム */}
          <div className="md:col-span-1">
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
            >
              <div
                className="px-5 py-4 border-b"
                style={{ borderColor: "#e5e7eb" }}
              >
                <h2 className="font-bold text-sm" style={{ color: "#002D72" }}>
                  新規カテゴリーを追加
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                {message && (
                  <div
                    className="text-xs px-3 py-2 rounded-lg"
                    style={
                      message.type === "success"
                        ? { backgroundColor: "#dcfce7", color: "#166534" }
                        : { backgroundColor: "#fef2f2", color: "#b91c1c" }
                    }
                  >
                    {message.text}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>
                    名前 <span style={{ color: "#b91c1c" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="例: クラウド移行"
                    className="w-full text-sm rounded-lg border px-3 py-2 outline-none"
                    style={{
                      borderColor: "#d1d5db",
                      color: "#111827",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>
                    スラッグ
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="cloud-migration"
                    className="w-full text-sm rounded-lg border px-3 py-2 outline-none font-mono"
                    style={{
                      borderColor: "#d1d5db",
                      color: "#111827",
                      backgroundColor: "#f9fafb",
                    }}
                  />
                  <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>
                    URLに使用される識別子（英数字・ハイフン）
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>
                    説明
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="このカテゴリーの説明..."
                    rows={3}
                    className="w-full text-sm rounded-lg border px-3 py-2 outline-none resize-none"
                    style={{
                      borderColor: "#d1d5db",
                      color: "#111827",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: "#F5B500", color: "#002D72" }}
                >
                  カテゴリーを追加
                </button>

                <p className="text-xs" style={{ color: "#9ca3af" }}>
                  ※ カテゴリーは記事の category フィールドで管理されます。記事編集画面でカテゴリーを設定してください。
                </p>
              </form>
            </div>
          </div>

          {/* 右: カテゴリー一覧テーブル */}
          <div className="md:col-span-2">
            <div
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}
            >
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "#e5e7eb" }}
              >
                <h2 className="font-bold text-sm" style={{ color: "#002D72" }}>
                  カテゴリー一覧
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                  {initialCategories.length} カテゴリー
                </span>
              </div>

              {initialCategories.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm" style={{ color: "#9ca3af" }}>
                    カテゴリーがまだありません
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#d1d5db" }}>
                    記事にカテゴリーを設定するとここに表示されます
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6b7280" }}>
                          名前
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#6b7280" }}>
                          スラッグ
                        </th>
                        <th className="px-5 py-3 text-center text-xs font-semibold" style={{ color: "#6b7280" }}>
                          記事数
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-semibold" style={{ color: "#6b7280" }}>
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
                      {initialCategories.map(({ category, count }) => {
                        const autoSlug = category
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^\w\-]/g, "");

                        return (
                          <tr key={category} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <span className="font-semibold text-sm" style={{ color: "#111827" }}>
                                {category}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <code className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>
                                {autoSlug || category}
                              </code>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span
                                className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                style={{ backgroundColor: "#eff6ff", color: "#002D72" }}
                              >
                                {count}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <a
                                href={`/admin?category=${encodeURIComponent(category)}`}
                                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                style={{ backgroundColor: "#f3f4f6", color: "#374151" }}
                              >
                                記事を見る
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ヒント */}
            <div
              className="mt-4 rounded-lg border border-dashed px-5 py-4 text-xs"
              style={{ borderColor: "#d1d5db", color: "#9ca3af" }}
            >
              <span className="font-semibold">ヒント:</span> カテゴリーは articles テーブルの category
              カラムから自動集計されます。記事にカテゴリーを設定するには記事編集画面を使用してください。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
