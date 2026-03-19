"use client";

import { useState, useTransition, useEffect } from "react";
import { saveArticleAction } from "../actions";

type ArticleData = {
  id?: number;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  date?: string;
  tags?: string[];
  author?: string;
  is_published?: boolean;
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "article-" + Date.now();
}

export default function ArticleEditor({ article }: { article?: ArticleData }) {
  const isNew = !article?.id;
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!article?.slug);
  const [description, setDescription] = useState(article?.description ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [date, setDate] = useState(article?.date ?? new Date().toISOString().slice(0, 10));
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [author, setAuthor] = useState(article?.author ?? "GCInsight編集部");
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
  const [previewHtml, setPreviewHtml] = useState("");

  // タイトルからslug自動生成
  useEffect(() => {
    if (!slugManual && title) setSlug(slugify(title));
  }, [title, slugManual]);

  // プレビュー用markdown→html
  useEffect(() => {
    if (tab !== "preview") return;
    import("marked").then(({ marked }) => {
      setPreviewHtml(marked(content) as string);
    });
  }, [tab, content]);

  const handleSubmit = (published: boolean) => {
    startTransition(async () => {
      const fd = new FormData();
      if (article?.id) fd.append("id", String(article.id));
      fd.append("slug", slug);
      fd.append("title", title);
      fd.append("description", description);
      fd.append("content", content);
      fd.append("date", date);
      fd.append("tags", tags);
      fd.append("author", author);
      fd.append("is_published", String(published));
      await saveArticleAction(fd);
    });
  };

  const wordCount = content.replace(/[#*\-_`>\[\]]/g, "").replace(/\s+/g, "").length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* 編集ヘッダー */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 shadow-sm bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <a href="/admin" className="text-sm font-medium hover:underline" style={{ color: "var(--color-brand-secondary)" }}>
            ← 記事一覧
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {isNew ? "新規記事" : "記事を編集"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            {wordCount.toLocaleString()}字
          </span>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", backgroundColor: "white" }}
          >
            下書き保存
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: "#16a34a" }}
          >
            {isPending ? "保存中..." : "公開する"}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6">
        {/* メインエリア */}
        <div className="flex-1 space-y-4">
          {/* タイトル */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事タイトルを入力..."
            className="w-full px-4 py-3 text-xl font-bold rounded-xl border bg-white outline-none focus:ring-2"
            style={{ border: "2px solid var(--color-border)", color: "var(--color-text-primary)" }}
          />

          {/* タブ: 編集 / プレビュー */}
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: "2px solid var(--color-border)" }}>
            <div className="flex border-b border-gray-100">
              {(["edit", "preview"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className="px-5 py-2.5 text-sm font-semibold transition-colors"
                  style={{
                    color: tab === t ? "var(--color-brand-secondary)" : "var(--color-text-muted)",
                    borderBottom: tab === t ? "2px solid var(--color-brand-secondary)" : "2px solid transparent",
                  }}>
                  {t === "edit" ? "✏️ 編集（Markdown）" : "👁 プレビュー"}
                </button>
              ))}
              <span className="ml-auto px-4 py-2.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                Markdown対応
              </span>
            </div>

            {tab === "edit" ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`## 見出し\n\n本文をMarkdownで書いてください...\n\n- リスト1\n- リスト2\n\n**強調** や [リンク](/cloud) も使えます。`}
                className="w-full px-5 py-4 text-sm leading-relaxed outline-none resize-none font-mono"
                style={{ minHeight: "60vh", color: "var(--color-text-primary)" }}
              />
            ) : (
              <div
                className="px-5 py-4 prose-article"
                style={{ minHeight: "60vh" }}
                dangerouslySetInnerHTML={{ __html: previewHtml || "<p style='color:#9ca3af'>プレビューするにはコンテンツを入力してください</p>" }}
              />
            )}
          </div>
        </div>

        {/* サイドバー（メタ情報） */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* 公開ステータス */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              公開設定
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsPublished(!isPublished)}
                className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                style={{ backgroundColor: isPublished ? "#16a34a" : "#d1d5db" }}
              >
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  style={{ transform: isPublished ? "translateX(20px)" : "translateX(0)" }} />
              </div>
              <span className="text-sm font-semibold"
                style={{ color: isPublished ? "#16a34a" : "var(--color-text-secondary)" }}>
                {isPublished ? "公開中" : "下書き"}
              </span>
            </label>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {isPublished ? "公開ボタンを押すと即反映されます" : "下書き保存では非公開のままです"}
            </p>
          </div>

          {/* スラッグ */}
          <div className="card p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              スラッグ（URL）
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
            />
            <p className="text-xs break-all" style={{ color: "var(--color-text-muted)" }}>
              /articles/{slug || "—"}
            </p>
          </div>

          {/* 概要 */}
          <div className="card p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              概要（SEO description）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none resize-none"
              style={{ border: "1.5px solid var(--color-border)" }}
              placeholder="検索結果に表示される説明文（80〜120字）"
            />
            <p className="text-xs tabular-nums text-right" style={{ color: description.length > 120 ? "#b91c1c" : "var(--color-text-muted)" }}>
              {description.length}/120字
            </p>
          </div>

          {/* 日付 */}
          <div className="card p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              公開日
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
            />
          </div>

          {/* タグ */}
          <div className="card p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
              placeholder="ガバメントクラウド, AWS, 解説"
            />
            {tags && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.split(/[,、\s]+/).filter(Boolean).map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* 著者 */}
          <div className="card p-4 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              著者
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
