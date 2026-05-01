// ステータスカラーの唯一の定義源。全コンポーネントはここを参照する。
export const STATUS_COLORS = {
  complete:  { bg: "#166534", text: "#ffffff", light: "#dcfce7" },
  ontrack:   { bg: "#1D4ED8", text: "#ffffff", light: "#dbeafe" },
  warning:   { bg: "#D97706", text: "#ffffff", light: "#fef3c7" },
  critical:  { bg: "#B91C1C", text: "#ffffff", light: "#fee2e2" },
  tokutei:   { bg: "#64748B", text: "#ffffff", light: "#f1f5f9" },
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;
