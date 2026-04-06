"use client";

import { Search } from "lucide-react";

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
      <Search size={40} color="#94A3B8" strokeWidth={1.5} className="mx-auto mb-3" aria-hidden="true" />
      <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {message}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
        {hint}
      </p>
    </div>
  );
}
