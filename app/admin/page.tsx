import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { logoutAction, togglePublishAction, deleteArticleAction } from "./actions";

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* 管理ヘッダー */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ backgroundColor: "var(--color-brand-secondary)" }}>
        <div className="flex items-center gap-3">
          <span className="text-white font-extrabold text-sm tracking-wide">⚙ GCInsight Admin</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ffffff20", color: "#fff" }}>
            記事管理
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" target="_blank" className="text-xs text-white/70 hover:text-white">
            サイトを見る ↗
          </Link>
          <form action={logoutAction}>
            <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: "#ffffff20", color: "#fff" }}>
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* サマリー */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "総記事数", value: articles.length, color: "var(--color-brand-secondary)" },
            { label: "公開中", value: published, color: "#16a34a" },
            { label: "下書き", value: drafts, color: "#d97706" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* 記事一覧 */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>記事一覧</h2>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: "var(--color-brand-primary)", color: "#002D72" }}
            >
              ＋ 新規記事
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>記事がまだありません</p>
              <Link href="/admin/articles/new" className="inline-block mt-3 text-sm font-semibold underline"
                style={{ color: "var(--color-brand-secondary)" }}>
                最初の記事を書く
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {articles.map((article) => (
                <div key={article.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                  {/* ステータスバッジ */}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 w-14 text-center"
                    style={article.is_published
                      ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                      : { backgroundColor: "#fef3c7", color: "#d97706" }}
                  >
                    {article.is_published ? "公開中" : "下書き"}
                  </span>

                  {/* タイトル */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>
                      {article.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {article.slug} ・ {article.date || "日付未設定"} ・ 更新 {new Date(article.updated_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>

                  {/* タグ */}
                  <div className="hidden md:flex gap-1 flex-shrink-0">
                    {(article.tags ?? []).slice(0, 2).map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t}</span>
                    ))}
                  </div>

                  {/* 操作ボタン */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: "var(--color-section-bg)", color: "var(--color-text-secondary)" }}
                    >
                      編集
                    </Link>
                    <form action={togglePublishAction.bind(null, article.id, article.is_published)}>
                      <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={article.is_published
                          ? { backgroundColor: "#fef3c7", color: "#d97706" }
                          : { backgroundColor: "#dcfce7", color: "#16a34a" }}>
                        {article.is_published ? "下書きに戻す" : "公開する"}
                      </button>
                    </form>
                    <form action={deleteArticleAction.bind(null, article.id)}
                      onSubmit={(e) => { if (!confirm("削除しますか？")) e.preventDefault(); }}>
                      <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}>
                        削除
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 記事追加のヒント */}
        <div className="rounded-lg border border-dashed border-gray-300 px-5 py-4 text-xs"
          style={{ color: "var(--color-text-muted)" }}>
          <span className="font-semibold">💡 ヒント:</span> Claude Codeで
          <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 text-xs">/gc-article キーワード</code>
          を実行するとSEO記事を自動生成できます。
        </div>
      </div>
    </div>
  );
}
