"use client";

import { useEffect, useState } from "react";
import PdfLeadForm from "@/components/PdfLeadForm";

/** グローバルPDFリードモーダル。
 *  window.dispatchEvent(new CustomEvent("openPdfModal")) で任意の場所から開ける。
 *  RootShell に1回だけ配置する。
 */
export default function PdfLeadModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("openPdfModal", handler);
    return () => window.removeEventListener("openPdfModal", handler);
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
        <PdfLeadForm source="modal" />
      </div>
    </div>
  );
}
