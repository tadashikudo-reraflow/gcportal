"use client";

import { Printer } from "lucide-react";

interface PrintButtonProps {
  prefName: string;
  cityName: string;
}

export default function PrintButton({ prefName, cityName }: PrintButtonProps) {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors"
      style={{ color: "var(--color-text-secondary)", backgroundColor: "white" }}
      aria-label={`${prefName}${cityName}の移行状況をPDFで保存`}
    >
      <Printer size={14} aria-hidden="true" />
      PDFで保存
    </button>
  );
}
