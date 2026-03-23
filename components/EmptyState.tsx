"use client";

type EmptyStateProps = {
  message?: string;
  hint?: string;
};

export default function EmptyState({
  message = "該当するデータがありません",
  hint = "フィルター条件を変更してください",
}: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94A3B8"
        strokeWidth="1.5"
        className="mx-auto mb-3"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {message}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
        {hint}
      </p>
    </div>
  );
}
