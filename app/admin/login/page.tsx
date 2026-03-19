import { loginAction } from "../actions";

export const metadata = { title: "管理ログイン | GCInsight" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/admin";
  const error = sp.error;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-section-bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
            style={{ backgroundColor: "var(--color-brand-secondary)" }}>
            <span className="text-white text-xl">⚙</span>
          </div>
          <h1 className="text-xl font-extrabold" style={{ color: "var(--color-brand-secondary)" }}>
            GCInsight 管理画面
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>記事の管理・公開</p>
        </div>

        <form action={loginAction} className="card p-6 space-y-4">
          <input type="hidden" name="next" value={next} />

          {error && (
            <div className="rounded-lg px-4 py-2 text-sm" style={{ backgroundColor: "#fef2f2", color: "#b91c1c" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text-secondary)" }}>
              パスワード
            </label>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2"
              style={{
                border: "2px solid var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              placeholder="管理パスワードを入力"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--color-brand-secondary)" }}
          >
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
