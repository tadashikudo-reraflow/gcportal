import type { Metadata } from "next";
import Link from "next/link";
import {
  DATA_SOURCES,
  CONFIDENCE_CONFIG,
  PAGE_SOURCES,
  type DataSource,
  type ConfidenceLevel,
} from "@/lib/sources";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "データソース・出典 | ガバメントクラウド移行状況ダッシュボード",
  description:
    "GCInsightが参照するデジタル庁・総務省・内閣官房等の公式データソース一覧。",
  alternates: { canonical: "/sources" },
};

// 組織 → 優先順位
const ORG_ORDER = [
  "デジタル庁",
  "総務省",
  "内閣官房",
  "内閣府",
  "APPLIC",
  "地方公共団体情報システム機構（J-LIS）",
  "AWS",
  "Oracle",
  "Microsoft",
  "Google Cloud",
  "さくらインターネット",
  "U.S. Department of Justice",
  "Privacy and Civil Liberties Oversight Board (PCLOB)",
  "フランス上院（Sénat français）",
];

export default function SourcesPage() {
  const allSources = Object.values(DATA_SOURCES);

  // 信頼度集計
  const confidenceCounts: Record<ConfidenceLevel, number> = { official: 0, verified: 0, estimated: 0, ai_survey: 0 };
  for (const s of allSources) confidenceCounts[s.confidence]++;
  const totalSources = allSources.length;
  const trustedPct = Math.round(((confidenceCounts.official + confidenceCounts.verified) / totalSources) * 100);

  // 組織別グループ化
  const byOrg: Record<string, DataSource[]> = {};
  for (const s of allSources) {
    if (!byOrg[s.org]) byOrg[s.org] = [];
    byOrg[s.org].push(s);
  }

  // 並び順: ORG_ORDER 定義 → 残りアルファベット順
  const orgEntries = Object.entries(byOrg).sort(([a], [b]) => {
    const ai = ORG_ORDER.indexOf(a);
    const bi = ORG_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b, "ja");
  });

  // ページ別マッピング（表示名）
  const pageLabels: Record<string, string> = {
    dashboard: "ダッシュボード",
    costs: "コスト分析",
    cloud: "クラウド比較",
    packages: "パッケージ一覧",
    adoption: "導入実績",
    risks: "遅延リスク",
    tokutei: "特定移行",
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "ソース・出典" }]} />

      {/* ヘッダー */}
      <div className="pb-1">
        <h1 className="page-title">ソース・出典</h1>
        <p className="page-subtitle">GCInsightが参照・引用する公式データソース一覧</p>
      </div>

      {/* サマリー（2枚のみ） */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "var(--color-brand-primary)" }}>
            {totalSources}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>データソース</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#15803d" }}>
            {trustedPct}%
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>公式・確認済</p>
        </div>
      </div>

      {/* 組織別ソース一覧（アコーディオン） */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold px-1" style={{ color: "var(--color-text-primary)" }}>組織別ソース</h2>
        {orgEntries.map(([org, sources]) => {
          const isOfficial = sources.some(s => s.confidence === "official");
          const hasAi = sources.some(s => s.confidence === "ai_survey");
          return (
            <details key={org} className="group card overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                    {org}
                  </span>
                  {hasAi && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                      AI調査含
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>{sources.length}件</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="transition-transform group-open:rotate-180 text-gray-400">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </summary>

              <div className="border-t border-gray-100">
                {sources.map((s, i) => {
                  const cfg = CONFIDENCE_CONFIG[s.confidence];
                  const inner = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                            style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                          >
                            {cfg.labelShort}
                          </span>
                          <span className="text-xs font-medium" style={{ color: s.url ? "var(--color-brand-secondary)" : "var(--color-text-primary)" }}>
                            {s.name}
                          </span>
                        </div>
                        {s.url && (
                          <span className="text-xs flex-shrink-0 mt-0.5 font-bold" style={{ color: "var(--color-brand-primary)" }}>↗</span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                          {s.description}
                        </p>
                      )}
                    </>
                  );
                  return s.url ? (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-4 py-3 flex flex-col gap-1 no-underline hover:bg-blue-50 active:bg-blue-100 transition-colors ${i < sources.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      {inner}
                    </a>
                  ) : (
                    <div
                      key={s.id}
                      className={`px-4 py-3 flex flex-col gap-1 ${i < sources.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>

      {/* ページ別ソース（シンプル表） */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>ページ別出典</h2>
        <div className="space-y-2">
          {Object.entries(PAGE_SOURCES)
            .filter(([pageId, ids]) => ids.length > 0 && pageLabels[pageId])
            .map(([pageId, sourceIds]) => {
              const sources = sourceIds.map(id => DATA_SOURCES[id]).filter(Boolean);
              return (
                <div key={pageId} className="flex flex-col gap-1 py-2 border-b border-gray-50 last:border-0">
                  <Link
                    href={`/${pageId === "dashboard" ? "" : pageId}`}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: "var(--color-brand-secondary)" }}
                  >
                    {pageLabels[pageId]} →
                  </Link>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                    {sources.map(s => s.org).filter((v, i, a) => a.indexOf(v) === i).join("・")}
                  </p>
                </div>
              );
            })}
        </div>
      </div>

      {/* 信頼度の定義（コンパクト） */}
      <div className="card p-5 space-y-3">
        <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>信頼度レベル</h2>
        <div className="space-y-2">
          {(Object.entries(CONFIDENCE_CONFIG) as [ConfidenceLevel, typeof CONFIDENCE_CONFIG[ConfidenceLevel]][]).map(([level, cfg]) => (
            <div key={level} className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded flex-shrink-0 w-16 text-center font-bold"
                style={{ backgroundColor: cfg.bgColor, color: cfg.color }}>
                {cfg.labelShort}
              </span>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{cfg.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          ※ AI調査バッジのデータ（ベンダー推定等）は公式発表と異なる場合があります。
        </p>
      </div>

      {/* 既知の制約 */}
      <div className="rounded-lg border border-amber-200 px-4 py-3" style={{ backgroundColor: "#fffbeb" }}>
        <p className="text-xs font-semibold mb-2" style={{ color: "#92400e" }}>既知の制約・注意事項</p>
        <ul className="text-xs leading-relaxed space-y-1" style={{ color: "#92400e" }}>
          <li>・ 標準化進捗データは総務省Excel公開タイミングに依存</li>
          <li>・ コスト推定レンジはAI調査を含み、契約条件により大きく異なる場合あり</li>
          <li>・ 導入実績データは自治体公開資料の独自調査で、全数カバーではない</li>
          <li>・ 本サイトは政府公式サイトではない</li>
        </ul>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between pt-1">
        <Link href="/articles" className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}>← コラム</Link>
        <div className="flex items-center gap-3">
          <Link href="/terms" className="text-xs hover:underline" style={{ color: "var(--color-text-muted)" }}>利用規約</Link>
          <Link href="/privacy" className="text-xs hover:underline" style={{ color: "var(--color-text-muted)" }}>プライバシー</Link>
        </div>
      </div>
    </div>
  );
}
