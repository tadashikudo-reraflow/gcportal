"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import RichEditor from "../components/RichEditor";
import { saveArticleAction, autoSaveArticleAction } from "../actions";

type SourceEntry = {
  url: string;
  title: string;
  org: string;
  accessed: string;
};

type ArticleData = {
  id?: number;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  content_format?: string;
  date?: string;
  tags?: string[];
  category?: string;
  author?: string;
  is_published?: boolean;
  featured_image?: string;
  sources?: SourceEntry[];
};

function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60) || `article-${Date.now()}`
  );
}

// SEOプレビューコンポーネント
function SeoPreview({
  slug,
  title,
  description,
}: {
  slug: string;
  title: string;
  description: string;
}) {
  const displayTitle = title.slice(0, 60) || "タイトル未入力";
  const displayDesc = description.slice(0, 160) || "説明文が未入力です";
  const displaySlug = slug || "article-slug";

  return (
    <div
      className="rounded-lg p-3 text-left"
      style={{ backgroundColor: "#fff", border: "1px solid #e0e0e0" }}
    >
      {/* URL行 */}
      <p className="text-xs flex items-center gap-1 mb-1" style={{ color: "#5f6368" }}>
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold"
          style={{ backgroundColor: "#4285f4", fontSize: "9px" }}
        >
          G
        </span>
        <span>gcinsight.jp</span>
        <span style={{ color: "#bbb" }}>›</span>
        <span>articles</span>
        <span style={{ color: "#bbb" }}>›</span>
        <span className="truncate max-w-[100px]">{displaySlug}</span>
      </p>
      {/* タイトル */}
      <p
        className="text-sm font-medium leading-snug mb-0.5 truncate"
        style={{ color: "#1a0dab" }}
      >
        {displayTitle}
      </p>
      {/* description */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: "#4d5156", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}
      >
        {displayDesc}
      </p>
    </div>
  );
}

// スピナー
function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export default function ArticleEditor({ article }: { article?: ArticleData }) {
  const isNew = !article?.id;
  const [isPending, startTransition] = useTransition();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | undefined>(article?.id);

  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugManual, setSlugManual] = useState(!!article?.slug);
  const [description, setDescription] = useState(article?.description ?? "");
  const [content, setContent] = useState(article?.content ?? "");
  const [date, setDate] = useState(
    article?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [tags, setTags] = useState((article?.tags ?? []).join(", "));
  const [category, setCategory] = useState(article?.category ?? "");
  const [author, setAuthor] = useState(article?.author ?? "GCInsight編集部");
  const [isPublished, setIsPublished] = useState(article?.is_published ?? false);
  const [featuredImage, setFeaturedImage] = useState(article?.featured_image ?? "");
  const [sources, setSources] = useState<SourceEntry[]>(
    article?.sources ?? []
  );

  // ファクト検証
  const [verifying, setVerifying] = useState(false);
  const [verifyResults, setVerifyResults] = useState<
    { claim: string; status: "supported" | "contradicted" | "unverified"; confidence: number }[]
  >([]);

  // 変更検知用の前回値
  const prevContentRef = useRef(content);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // タイトルからslug自動生成
  useEffect(() => {
    if (!slugManual && title) setSlug(slugify(title));
  }, [title, slugManual]);

  // 自動保存関数
  const doAutoSave = useCallback(async () => {
    setIsAutoSaving(true);
    try {
      const fd = new FormData();
      if (savedId) fd.append("id", String(savedId));
      fd.append("slug", slug || slugify(title) || `draft-${Date.now()}`);
      fd.append("title", title);
      fd.append("description", description);
      fd.append("content", content);
      fd.append("content_format", "html");
      fd.append("date", date);
      fd.append("tags", tags);
      fd.append("category", category);
      fd.append("author", author);
      fd.append("featured_image", featuredImage);
      fd.append("sources", JSON.stringify(sources));
      const result = await autoSaveArticleAction(fd);
      setAutoSavedAt(result.savedAt);
      if (result.id && !savedId) setSavedId(result.id);
    } catch {
      // 自動保存失敗は静かに無視
    } finally {
      setIsAutoSaving(false);
    }
  }, [savedId, slug, title, description, content, date, tags, category, author, featuredImage, sources]);

  // コンテンツ変更時のdebounce自動保存（3秒）
  useEffect(() => {
    if (content === prevContentRef.current) return;
    prevContentRef.current = content;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      doAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [content, doAutoSave]);

  // 30秒ごとの定期自動保存
  useEffect(() => {
    const interval = setInterval(() => {
      doAutoSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [doAutoSave]);

  // 手動保存（下書き or 公開）
  const handleSubmit = (published: boolean) => {
    startTransition(async () => {
      const fd = new FormData();
      if (savedId) fd.append("id", String(savedId));
      fd.append("slug", slug || slugify(title));
      fd.append("title", title);
      fd.append("description", description);
      fd.append("content", content);
      fd.append("content_format", "html");
      fd.append("date", date);
      fd.append("tags", tags);
      fd.append("category", category);
      fd.append("author", author);
      fd.append("featured_image", featuredImage);
      fd.append("sources", JSON.stringify(sources));
      fd.append("is_published", String(published));
      await saveArticleAction(fd);
    });
  };

  // ファクト検証: 記事内の数値・統計を抽出して検証
  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResults([]);
    try {
      // HTMLからテキスト抽出し、数値を含む文を抽出
      const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const sentences = textContent.split(/(?<=[。！？\.\!\?])\s*/).filter(Boolean);
      const claims = sentences
        .filter((s) => /\d/.test(s) && s.length > 10 && s.length < 300)
        .slice(0, 10);

      if (claims.length === 0) {
        setVerifyResults([{ claim: "検証対象の数値・統計が見つかりませんでした", status: "unverified", confidence: 0 }]);
        return;
      }

      const res = await fetch("/api/rag/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claims }),
      });
      const data = await res.json();
      if (res.ok) {
        setVerifyResults(data.results);
      } else {
        setVerifyResults([{ claim: `エラー: ${data.error}`, status: "unverified", confidence: 0 }]);
      }
    } catch (err) {
      setVerifyResults([{
        claim: `エラー: ${err instanceof Error ? err.message : String(err)}`,
        status: "unverified",
        confidence: 0,
      }]);
    } finally {
      setVerifying(false);
    }
  };

  const descLen = description.length;
  const descColor =
    descLen >= 80 && descLen <= 120
      ? "#16a34a"
      : descLen > 120
      ? "#b91c1c"
      : "var(--color-text-muted)";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* ステータスバー */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 shadow-sm bg-white border-b border-gray-200"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <a
            href="/admin"
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--color-brand-secondary)" }}
          >
            &larr; 記事一覧
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {isNew ? "新規記事" : title || "記事を編集"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* 自動保存ステータス */}
          <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-text-muted)" }}>
            {isAutoSaving ? (
              <>
                <Spinner />
                保存中...
              </>
            ) : autoSavedAt ? (
              `自動保存済み ${autoSavedAt}`
            ) : null}
          </span>

          <button
            onClick={() => handleSubmit(false)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-semibold border transition-colors hover:bg-gray-50"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
              backgroundColor: "white",
            }}
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Spinner />
                保存中
              </span>
            ) : (
              "下書き保存"
            )}
          </button>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors hover:bg-blue-50"
            style={{
              borderColor: "#3b82f6",
              color: "#3b82f6",
              backgroundColor: "white",
            }}
          >
            {verifying ? (
              <span className="flex items-center gap-1.5">
                <Spinner />
                検証中
              </span>
            ) : (
              "RAG検証"
            )}
          </button>

          <button
            onClick={() => handleSubmit(true)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#16a34a" }}
          >
            {isPending ? (
              <span className="flex items-center gap-1.5">
                <Spinner />
                公開中
              </span>
            ) : (
              "公開する"
            )}
          </button>
        </div>
      </header>

      {/* メインレイアウト */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* 左: メインエディター */}
        <div className="flex-1 space-y-4 min-w-0">
          {/* タイトル入力 */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事タイトルを入力..."
            className="w-full px-4 py-3 text-xl font-bold rounded-xl border bg-white outline-none focus:ring-2"
            style={{
              border: "2px solid var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          />

          {/* TipTapリッチエディター */}
          <RichEditor
            content={content}
            onChange={setContent}
            placeholder="本文をリッチテキストで入力してください..."
          />

          {/* ファクト検証結果 */}
          {verifyResults.length > 0 && (
            <div className="card p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: "#3b82f6" }}>
                RAG ファクト検証結果
              </h3>
              {verifyResults.map((r, i) => {
                const statusStyle =
                  r.status === "supported"
                    ? { bg: "#dcfce7", text: "#166534", label: "裏付けあり" }
                    : r.status === "contradicted"
                    ? { bg: "#fee2e2", text: "#991b1b", label: "矛盾あり" }
                    : { bg: "#f3f4f6", text: "#6b7280", label: "未検証" };
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded text-xs"
                    style={{ backgroundColor: statusStyle.bg }}
                  >
                    <span
                      className="flex-shrink-0 px-1.5 py-0.5 rounded font-bold"
                      style={{ color: statusStyle.text }}
                    >
                      {statusStyle.label}
                    </span>
                    <span className="leading-relaxed" style={{ color: statusStyle.text }}>
                      {r.claim}
                      {r.confidence > 0 && (
                        <span className="ml-1 opacity-70">({(r.confidence * 100).toFixed(0)}%)</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 右: サイドバー */}
        <div className="flex-shrink-0 space-y-4" style={{ width: "280px" }}>
          {/* 公開設定 */}
          <div className="card p-4 space-y-3">
            <h3
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              公開設定
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsPublished(!isPublished)}
                className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer"
                style={{ backgroundColor: isPublished ? "#16a34a" : "#d1d5db" }}
              >
                <div
                  className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  style={{ transform: isPublished ? "translateX(20px)" : "translateX(0)" }}
                />
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: isPublished ? "#16a34a" : "var(--color-text-secondary)" }}
              >
                {isPublished ? "公開中" : "下書き"}
              </span>
            </label>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {isPublished
                ? "公開ボタンを押すと即反映されます"
                : "下書き保存では非公開のままです"}
            </p>
          </div>

          {/* 公開日 */}
          <div className="card p-4 space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
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

          {/* 著者 */}
          <div className="card p-4 space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
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

          {/* カテゴリー */}
          <div className="card p-4 space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              カテゴリー
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
              placeholder="ガバメントクラウド"
            />
          </div>

          {/* タグ */}
          <div className="card p-4 space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              タグ（カンマ区切り）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
              placeholder="AWS, 解説, 自治体"
            />
            {tags && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags
                  .split(/[,、\s]+/)
                  .filter(Boolean)
                  .map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* 出典・参考文献 */}
          <div className="card p-4 space-y-3">
            <h3
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              出典・参考文献
            </h3>
            {sources.map((src, i) => (
              <div
                key={i}
                className="space-y-1.5 p-2.5 rounded-lg relative"
                style={{ backgroundColor: "#f8f9fb", border: "1px solid var(--color-border)" }}
              >
                <button
                  type="button"
                  onClick={() => setSources(sources.filter((_, j) => j !== i))}
                  className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500 text-xs leading-none"
                  title="削除"
                >
                  ✕
                </button>
                <input
                  type="url"
                  value={src.url}
                  onChange={(e) => {
                    const next = [...sources];
                    next[i] = { ...next[i], url: e.target.value };
                    setSources(next);
                  }}
                  placeholder="URL"
                  className="w-full px-2 py-1 text-xs rounded border outline-none"
                  style={{ border: "1px solid var(--color-border)" }}
                />
                <input
                  type="text"
                  value={src.title}
                  onChange={(e) => {
                    const next = [...sources];
                    next[i] = { ...next[i], title: e.target.value };
                    setSources(next);
                  }}
                  placeholder="タイトル"
                  className="w-full px-2 py-1 text-xs rounded border outline-none"
                  style={{ border: "1px solid var(--color-border)" }}
                />
                <input
                  type="text"
                  value={src.org}
                  onChange={(e) => {
                    const next = [...sources];
                    next[i] = { ...next[i], org: e.target.value };
                    setSources(next);
                  }}
                  placeholder="組織名"
                  className="w-full px-2 py-1 text-xs rounded border outline-none"
                  style={{ border: "1px solid var(--color-border)" }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSources([
                  ...sources,
                  { url: "", title: "", org: "", accessed: new Date().toISOString().slice(0, 10) },
                ])
              }
              className="w-full py-1.5 text-xs font-semibold rounded-lg border border-dashed transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--color-border)", color: "var(--color-brand-secondary)" }}
            >
              + 出典を追加
            </button>
            {sources.length > 0 && (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {sources.length}件の出典
              </p>
            )}
          </div>

          {/* アイキャッチ画像 */}
          <div className="card p-4 space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              アイキャッチ画像
            </label>
            <input
              type="url"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
              placeholder="https://..."
            />
            {featuredImage && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredImage}
                  alt="アイキャッチプレビュー"
                  className="w-full h-28 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* スラッグ */}
          <div className="card p-4 space-y-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              スラッグ（URL）
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManual(true);
              }}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none"
              style={{ border: "1.5px solid var(--color-border)" }}
            />
            <p className="text-xs break-all" style={{ color: "var(--color-text-muted)" }}>
              /articles/{slug || "—"}
            </p>
            {slugManual && (
              <button
                type="button"
                onClick={() => {
                  setSlugManual(false);
                  setSlug(slugify(title));
                }}
                className="text-xs underline"
                style={{ color: "var(--color-brand-secondary)" }}
              >
                タイトルから再生成
              </button>
            )}
          </div>

          {/* SEOプレビュー + description */}
          <div className="card p-4 space-y-3">
            <h3
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--color-text-muted)" }}
            >
              SEO / 概要
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-1.5 text-sm rounded-lg border outline-none resize-none"
              style={{ border: "1.5px solid var(--color-border)" }}
              placeholder="検索結果に表示される説明文（80〜120字が最適）"
            />
            <div className="flex justify-between items-center">
              <span
                className="text-xs"
                style={{
                  color: descColor,
                  fontWeight: descLen >= 80 && descLen <= 120 ? "600" : "normal",
                }}
              >
                {descLen >= 80 && descLen <= 120
                  ? "最適な文字数です"
                  : descLen > 120
                  ? "長すぎます"
                  : "80字以上が推奨"}
              </span>
              <span
                className="text-xs tabular-nums"
                style={{ color: descColor }}
              >
                {descLen} / 120字
              </span>
            </div>

            {/* Googleプレビュー */}
            <div>
              <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--color-text-muted)" }}>
                Google検索プレビュー
              </p>
              <SeoPreview slug={slug} title={title} description={description} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
