import { ReactNode } from "react";

type CalloutVariant = "info" | "warning" | "tip" | "error";

interface CalloutProps {
  variant?: CalloutVariant;
  children: ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<
  CalloutVariant,
  { bg: string; border: string; iconColor: string; textColor: string; icon: ReactNode }
> = {
  info: {
    bg: "#f0f5ff",
    border: "#bfdbfe",
    iconColor: "#0066FF",
    textColor: "var(--color-text-secondary)",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#0066FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    iconColor: "#d97706",
    textColor: "#92400e",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#d97706"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  tip: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    iconColor: "#16a34a",
    textColor: "#166534",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#16a34a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    bg: "#fef2f2",
    border: "#fca5a5",
    iconColor: "#dc2626",
    textColor: "#7f1d1d",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
};

export default function Callout({ variant = "info", children, className }: CalloutProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`rounded-xl px-5 py-3 flex items-start gap-3 ${className ?? ""}`}
      style={{
        backgroundColor: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.textColor,
      }}
    >
      <span className="flex-shrink-0 mt-0.5">{styles.icon}</span>
      <div className="text-xs leading-relaxed">{children}</div>
    </div>
  );
}
