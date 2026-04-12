import Link from "next/link";
import {
  getSource,
  CONFIDENCE_CONFIG,
  CATEGORY_CONFIG,
  type DataSource,
  type ConfidenceLevel,
} from "@/lib/sources";
import { BadgeCheck, Check, AlertTriangle, Info } from "lucide-react";

// --- Confidence アイコン ---
function ConfidenceIcon({ level, size = 14 }: { level: ConfidenceLevel; size?: number }) {
  const cfg = CONFIDENCE_CONFIG[level];
  const color = cfg.color;

  if (level === "official") return <BadgeCheck size={size} color={color} aria-hidden="true" />;
  if (level === "verified") return <Check size={size} color={color} aria-hidden="true" />;
  if (level === "estimated") return <AlertTriangle size={size} color={color} aria-hidden="true" />;
  return <Info size={size} color={color} aria-hidden="true" />;
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
function FooterAttribution({
  sources,
  pageId,
  dataMonth,
}: {
  sources: DataSource[];
  pageId?: string;
  dataMonth?: string;
}) {
  if (sources.length === 0) return null;

  const hasAiSurvey = sources.some(s => s.confidence === "ai_survey");
  const orgs = [...new Set(sources.map(s => s.org))];

  // dataMonth フォーマット: "YYYY-MM" → "YYYY年M月"
  let formattedMonth: string | null = null;
  if (dataMonth) {
    const [y, m] = dataMonth.split("-");
    formattedMonth = `${y}年${parseInt(m)}月`;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs py-2 border-t border-gray-100">
      {formattedMonth && (
        <span style={{ color: "var(--color-text-muted)" }}>
          更新: {formattedMonth}
        </span>
      )}
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
  dataMonth?: string;
};

export default function SourceAttribution({
  sourceIds,
  variant = "footer",
  pageId,
  dataMonth,
}: SourceAttributionProps) {
  const sources = sourceIds
    .map((id) => getSource(id))
    .filter((s): s is DataSource => s !== undefined);

  if (sources.length === 0) return null;

  if (variant === "inline") {
    return <InlineAttribution sources={sources} />;
  }

  return <FooterAttribution sources={sources} pageId={pageId} dataMonth={dataMonth} />;
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
