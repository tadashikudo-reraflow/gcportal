import Link from "next/link";
import {
  getSource,
  CONFIDENCE_CONFIG,
  CATEGORY_CONFIG,
  type DataSource,
  type ConfidenceLevel,
} from "@/lib/sources";

// --- Confidence アイコン（SVG inline） ---
function ConfidenceIcon({ level, size = 14 }: { level: ConfidenceLevel; size?: number }) {
  const cfg = CONFIDENCE_CONFIG[level];
  const color = cfg.color;

  if (level === "official") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (level === "verified") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (level === "estimated") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  // ai_survey
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

// --- Inline バリアント（データ横のピル型） ---
function InlineAttribution({ sources }: { sources: DataSource[] }) {
  if (sources.length === 0) return null;

  // 最高 confidence を代表表示
  const priorityOrder: ConfidenceLevel[] = ["official", "verified", "estimated", "ai_survey"];
  const bestConfidence = priorityOrder.find((c) =>
    sources.some((s) => s.confidence === c)
  ) ?? "estimated";
  const cfg = CONFIDENCE_CONFIG[bestConfidence];

  const orgs = [...new Set(sources.map((s) => s.org))];
  const dataMonths = sources.map((s) => s.dataMonth).filter(Boolean) as string[];
  const latestMonth = dataMonths.sort().reverse()[0];

  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ backgroundColor: cfg.bgColor, color: cfg.color, border: `1px solid ${cfg.borderColor}` }}
      title={sources.map((s) => `${s.name}（${s.org}）`).join("\n")}
    >
      <ConfidenceIcon level={bestConfidence} size={12} />
      <span className="font-medium">
        出典: {orgs.join("・")}
        {latestMonth && ` (${latestMonth})`}
      </span>
    </span>
  );
}

// --- Footer バリアント（シンプル1行） ---
function FooterAttribution({ sources, pageId }: { sources: DataSource[]; pageId?: string }) {
  if (sources.length === 0) return null;

  const hasAiSurvey = sources.some(s => s.confidence === "ai_survey");
  const orgs = [...new Set(sources.map(s => s.org))];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs py-2 border-t border-gray-100">
      <span style={{ color: "var(--color-text-muted)" }}>
        出典: {orgs.join("・")}
      </span>
      {hasAiSurvey && (
        <span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
          AI調査含
        </span>
      )}
      <Link href="/sources" className="hover:underline ml-auto" style={{ color: "var(--color-brand-primary)" }}>
        詳細 →
      </Link>
    </div>
  );
}

// --- メインコンポーネント ---

type SourceAttributionProps = {
  sourceIds: string[];
  variant?: "inline" | "footer";
  pageId?: string;
};

export default function SourceAttribution({
  sourceIds,
  variant = "footer",
  pageId,
}: SourceAttributionProps) {
  const sources = sourceIds
    .map((id) => getSource(id))
    .filter((s): s is DataSource => s !== undefined);

  if (sources.length === 0) return null;

  if (variant === "inline") {
    return <InlineAttribution sources={sources} />;
  }

  return <FooterAttribution sources={sources} pageId={pageId} />;
}

// --- 個別のConfidenceバッジ（他のページから直接使用可能） ---

export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const cfg = CONFIDENCE_CONFIG[level];
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded"
      style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
    >
      <ConfidenceIcon level={level} size={12} />
      {cfg.labelShort}
    </span>
  );
}
