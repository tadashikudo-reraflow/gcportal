import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { logoutAction, quickDraftAction } from "./actions";
import SearchFilter from "./components/SearchFilter";

export const metadata = { title: "記事管理 | GCInsight Admin" };
export const dynamic = "force-dynamic";

type Article = {
  id: number;
  slug: string;
  title: string;
  date: string;
  tags: string[];
  is_published: boolean;
  updated_at: string;
};

async function getArticles(): Promise<Article[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, date, tags, is_published, updated_at")
    .order("updated_at", { ascending: false });
  return (data ?? []) as Article[];
}

export default async function AdminPage() {
  const articles = await getArticles();
  const published = articles.filter((a) => a.is_published).length;
  const drafts = articles.filter((a) => !a.is_published).length;

  // 本日更新した記事数
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayUpdated = articles.filter((a) =>
    a.updated_at?.startsWith(todayStr)
  ).length;

  // 最近の記事5件
  const recentArticles = articles.slice(0, 5);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* 管理ヘッダー */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ backgroundColor: "var(--color-brand-secondary)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-extrabold text-sm tracking-wide">
            GCInsight Admin
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#ffffff20", color: "#fff" }}
          >
            記事管理
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-xs text-white/70 hover:text-white"
          >
            サイトを見る &nearr;
          </Link>
          <form action={logoutAction}>
            <button
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: "#ffffff20", color: "#fff" }}
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 本日の統計バナー */}
        {todayUpdated > 0 && (
          <div
            className="mb-4 rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
            <span>
              本日 <strong>{todayUpdated}件</strong> の記事が更新されました
            </span>
          </div>
        )}

        <div className="flex gap-6">
          {/* 左カラム (70%) */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* サマリーカード */}
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "総記事数",
                  value: articles.length,
                  color: "var(--color-brand-secondary)",
                  bg: "#f0f4ff",
                },
                {
                  label: "公開中",
                  value: published,
                  color: "#16a34a",
                  bg: "#f0fdf4",
                },
                {
                  label: "下書き",
                  value: drafts,
                  color: "#d97706",
                  bg: "#fffbeb",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="card p-4 text-center"
                  style={{ backgroundColor: s.bg }}
                >
                  <p
                    className="text-3xl font-extrabold tabular-nums"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* 検索・フィルター付き記事テーブル（クライアントコンポーネント） */}
            <SearchFilter articles={articles} />

            {/* ヒント */}
            <div
              className="rounded-lg border border-dashed border-gray-300 px-5 py-4 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="font-semibold">ヒント:</span> Claude Code で
              <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 text-xs">
                /gc-article キーワード
              </code>
              を実行するとSEO記事を自動生成できます。
            </div>
          </div>

          {/* 右カラム (30%) */}
          <div className="flex-shrink-0 space-y-4" style={{ width: "300px" }}>
            {/* クイックドラフト */}
            <div className="card p-4 space-y-3">
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                クイックドラフト
              </h3>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                アイデアをすばやく下書き保存
              </p>
              <form action={quickDraftAction} className="space-y-2">
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="タイトル"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                  style={{ border: "1.5px solid var(--color-border)" }}
                />
                <textarea
                  name="content"
                  rows={4}
                  placeholder="本文（メモ）"
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none resize-none"
                  style={{ border: "1.5px solid var(--color-border)" }}
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: "var(--color-brand-secondary)" }}
                >
                  下書き保存
                </button>
              </form>
            </div>

            {/* 最近の更新 */}
            <div className="card p-4 space-y-3">
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                最近の更新
              </h3>
              {recentArticles.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  記事がありません
                </p>
              ) : (
                <div className="space-y-2">
                  {recentArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/admin/articles/${article.id}`}
                      className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 -mx-1 px-1 rounded transition-colors"
                    >
                      <span
                        className="mt-0.5 flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                        style={
                          article.is_published
                            ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                            : { backgroundColor: "#fef3c7", color: "#d97706" }
                        }
                      >
                        {article.is_published ? "公" : "草"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xs font-medium truncate"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {article.title || "(タイトルなし)"}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {new Date(article.updated_at).toLocaleDateString("ja-JP")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href="/admin"
                className="text-xs font-medium"
                style={{ color: "var(--color-brand-secondary)" }}
              >
                すべて見る &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
