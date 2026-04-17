"use client";

import { useEffect, useState } from "react";
import PdfLeadForm from "@/components/PdfLeadForm";

/** グローバルニュースレター登録モーダル。
 *  window.dispatchEvent(new CustomEvent("openLeadModal", { detail: { source: "newsletter_xxx" } }))
 *  で任意の場所から開ける。RootShell に1回だけ配置する。
 */
export default function PdfLeadModal() {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("newsletter_modal");

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ source?: string }>).detail;
      if (detail?.source) setSource(detail.source);
      setOpen(true);
    };
    window.addEventListener("openLeadModal", handler);
    // 後方互換: 旧 openPdfModal イベント
    window.addEventListener("openPdfModal", handler);
    return () => {
      window.removeEventListener("openLeadModal", handler);
      window.removeEventListener("openPdfModal", handler);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-sm relative">
        <button
          onClick={() => setOpen(false)}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md"
          style={{ backgroundColor: "#fff", color: "#374151" }}
          aria-label="閉じる"
        >
          ✕
        </button>
        <PdfLeadForm source={source} mode="newsletter" />
      </div>
    </div>
  );
}
