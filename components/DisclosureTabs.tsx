import Link from "next/link";

type Tab = "request" | "results";

export default function DisclosureTabs({ active }: { active: Tab }) {
  return (
    <div className="flex items-center gap-3">
      {/* タブ1: 開示請求依頼 */}
      {active === "request" ? (
        <span
          className="px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{
            backgroundColor: "var(--color-brand-primary)",
            color: "#ffffff",
          }}
        >
          開示請求依頼
        </span>
      ) : (
        <Link
          href="/disclosure"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold no-underline"
          style={{
            backgroundColor: "var(--color-surface-container-low)",
            color: "var(--color-text-secondary)",
            border: "1px solid var(--color-border)",
          }}
        >
          開示請求依頼
        </Link>
      )}

      {/* タブ2: 開示結果（目立つボタン） */}
      {active === "results" ? (
        <span
          className="px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{
            backgroundColor: "var(--color-brand-primary)",
            color: "#ffffff",
          }}
        >
          開示結果
        </span>
      ) : (
        <Link
          href="/disclosure/results"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold no-underline"
          style={{
            backgroundColor: "var(--color-success)",
            color: "#ffffff",
          }}
        >
          開示結果を見る
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
