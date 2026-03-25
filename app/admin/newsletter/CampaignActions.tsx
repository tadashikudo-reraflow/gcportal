"use client";

import { useRouter } from "next/navigation";

export function DuplicateButton({ campaignId }: { campaignId: number }) {
  const router = useRouter();

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/newsletter/campaigns/${campaignId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`複製に失敗しました: ${err.error ?? res.status}`);
        return;
      }
      router.refresh();
    } catch {
      alert("複製に失敗しました");
    }
  };

  return (
    <button
      onClick={handleDuplicate}
      style={{
        fontSize: 13,
        color: "#6b7280",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      複製
    </button>
  );
}
