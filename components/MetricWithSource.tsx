/**
 * MetricWithSource — KPI数値の横に信頼度バッジを表示
 *
 * RAGドキュメントで裏付けがあれば "verified"、静的JSONのみなら "unverified"
 */

import { DATA_SOURCES, type ConfidenceLevel } from "@/lib/sources";

const BADGE_STYLES: Record<ConfidenceLevel, { bg: string; text: string; label: string }> = {
  official:   { bg: "#dcfce7", text: "#166534", label: "公式" },
  verified:   { bg: "#dbeafe", text: "#1e40af", label: "検証済" },
  estimated:  { bg: "#fef3c7", text: "#92400e", label: "推計" },
  ai_survey:  { bg: "#fee2e2", text: "#991b1b", label: "AI調査" },
};

export default function MetricWithSource({
  sourceId,
  children,
}: {
  sourceId?: string;
  children: React.ReactNode;
}) {
  if (!sourceId) return <>{children}</>;

  const source = DATA_SOURCES[sourceId];
  if (!source) return <>{children}</>;

  const badge = BADGE_STYLES[source.confidence];

  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <span
        className="text-xs px-1.5 py-0.5 rounded font-medium leading-none"
        style={{ backgroundColor: badge.bg, color: badge.text }}
        title={`出典: ${source.name} (${source.org})`}
      >
        {badge.label}
      </span>
    </span>
  );
}
