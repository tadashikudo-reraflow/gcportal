import { ReactNode } from "react";
import { Info, AlertTriangle, Check, XCircle } from "lucide-react";

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
    icon: <Info size={18} color="#0066FF" aria-hidden="true" />,
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    iconColor: "#d97706",
    textColor: "#92400e",
    icon: <AlertTriangle size={18} color="#d97706" aria-hidden="true" />,
  },
  tip: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    iconColor: "#16a34a",
    textColor: "#166534",
    icon: <Check size={18} color="#16a34a" aria-hidden="true" />,
  },
  error: {
    bg: "#fef2f2",
    border: "#fca5a5",
    iconColor: "#dc2626",
    textColor: "#7f1d1d",
    icon: <XCircle size={18} color="#dc2626" aria-hidden="true" />,
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
