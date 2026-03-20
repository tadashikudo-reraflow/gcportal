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

// --- Footer バリアント（セクション下部のボックス型） ---
function FooterAttribution({ sources, pageId }: { sources: DataSource[]; pageId?: string }) {
  if (sources.length === 0) return null;

  // カテゴリ別にグループ化
  const grouped: Record<string, DataSource[]> = {};
  for (const s of sources) {
    const cat = s.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(s);
  }

  // confidence 集計
  const confidenceCounts: Record<ConfidenceLevel, number> = { official: 0, verified: 0, estimated: 0, ai_survey: 0 };
  for (const s of sources) confidenceCounts[s.confidence]++;

  const officialPct = sources.length > 0
    ? Math.round(((confidenceCounts.official + confidenceCounts.verified) / sources.length) * 100)
    : 0;

  return (
    <div className="rounded-lg border px-5 py-4 space-y-3" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "#374151" }}>
          データソース・出典
        </p>
        <div className="flex items-center gap-2">
          {officialPct > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f0fdf4", color: "#15803d" }}>
              {officialPct}% 公式・確認済
            </span>
          )}
          {pageId && (
            <Link href="/sources" className="text-xs underline" style={{ color: "#6b7280" }}>
              詳細 →
            </Link>
          )}
        </div>
      </div>

      {/* ソース一覧 */}
      <div className="space-y-1.5">
        {sources.map((source) => {
          const cfg = CONFIDENCE_CONFIG[source.confidence];
          const catCfg = CATEGORY_CONFIG[source.category];
          return (
            <div key={source.id} className="flex items-start gap-2 text-xs">
              <ConfidenceIcon level={source.confidence} size={14} />
              <div className="flex-1 min-w-0">
                <span className="font-medium" style={{ color: "#374151" }}>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {source.name}
                    </a>
                  ) : (
                    source.name
                  )}
                </span>
                <span className="ml-1.5" style={{ color: "#9ca3af" }}>
                  — {source.org}
                  {source.dataMonth && ` (${source.dataMonth})`}
                </span>
              </div>
              <span
                className="flex-shrink-0 px-1.5 py-0.5 rounded text-xs"
                style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
              >
                {cfg.labelShort}
              </span>
            </div>
          );
        })}
      </div>

      {/* AI調査の警告 */}
      {confidenceCounts.ai_survey > 0 && (
        <div className="rounded px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: "#fef2f2", color: "#991b1b" }}>
          <span className="font-semibold">注意:</span> 一部データはAI（Grok）によるウェブ調査に基づいています。
          公式発表と異なる場合があります。最新情報は各機関の公式サイトをご確認ください。
        </div>
      )}
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
