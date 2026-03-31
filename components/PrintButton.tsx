"use client";

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
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      PDFで保存
    </button>
  );
}
