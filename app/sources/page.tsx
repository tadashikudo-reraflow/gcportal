import type { Metadata } from "next";
import Link from "next/link";
import {
  DATA_SOURCES,
  CONFIDENCE_CONFIG,
  CATEGORY_CONFIG,
  getDataFreshness,
  getSourcesForPage,
  PAGE_SOURCES,
  type DataSource,
  type ConfidenceLevel,
  type SourceCategory,
} from "@/lib/sources";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "データソース・方法論 | ガバメントクラウド移行状況ダッシュボード",
  description:
    "GCInsightが参照・引用するデジタル庁・総務省・内閣官房等の公式データソース一覧。データ収集方法論・信頼度レベル・鮮度ステータスを公開。",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  const allSources = Object.values(DATA_SOURCES);

  // カテゴリ別にグループ化
  const grouped: Record<SourceCategory, DataSource[]> = {
    government: [],
    research: [],
    media: [],
    vendor: [],
    ai_survey: [],
  };
  for (const s of allSources) {
    grouped[s.category].push(s);
  }

  // 信頼度集計
  const confidenceCounts: Record<ConfidenceLevel, number> = { official: 0, verified: 0, estimated: 0, ai_survey: 0 };
  for (const s of allSources) confidenceCounts[s.confidence]++;
  const totalSources = allSources.length;
  const trustedPct = Math.round(((confidenceCounts.official + confidenceCounts.verified) / totalSources) * 100);

  // 鮮度ステータス
  const sourcesWithMonth = allSources.filter((s) => s.dataMonth);
  const freshnessList = sourcesWithMonth.map((s) => ({
    source: s,
    ...getDataFreshness(s.dataMonth!, s.updateCycle),
  })).sort((a, b) => b.daysOld - a.daysOld);

  // ページ別ソースマッピング
  const pageLabels: Record<string, string> = {
    dashboard: "ダッシュボード",
    costs: "コスト分析",
    cloud: "クラウド基盤",
    packages: "パッケージ一覧",
    adoption: "導入実績",
    risks: "遅延リスク",
    tokutei: "特定移行",
    businesses: "業務別",
    prefectures: "都道府県別",
  };

  return (
    <div className="space-y-8">
      {/* パンくず + ヘッダー */}
      <Breadcrumb items={[{ label: "データソース・方法論" }]} />
      <div className="pb-2">
        <h1 className="page-title">データソース・方法論</h1>
        <p className="page-subtitle">
          GCInsightのデータ収集方法・出典・信頼度を公開しています
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--color-brand-primary)" }}>
            {totalSources}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>データソース</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: "#15803d" }}>
            {trustedPct}%
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>公式・確認済</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: "#1d4ed8" }}>
            {confidenceCounts.official}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>政府公式</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold tabular-nums" style={{ color: "#dc2626" }}>
            {confidenceCounts.ai_survey}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>AI調査（要検証）</p>
        </div>
      </div>

      {/* データ方法論 */}
      <div className="card p-5 space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          データ収集方法論
        </h2>
        <div className="text-sm leading-relaxed space-y-3" style={{ color: "var(--color-text-secondary)" }}>
          <p>
            GCInsightは、デジタル庁・総務省・内閣官房が公開する一次資料を主要データソースとしています。
            各データポイントには<strong>信頼度レベル</strong>を付与し、ユーザーがデータの確度を判断できるようにしています。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.entries(CONFIDENCE_CONFIG) as [ConfidenceLevel, typeof CONFIDENCE_CONFIG[ConfidenceLevel]][]).map(
              ([level, cfg]) => (
                <div
                  key={level}
                  className="rounded-lg px-3 py-2 flex items-start gap-2"
                  style={{ backgroundColor: cfg.bgColor, border: `1px solid ${cfg.borderColor}` }}
                >
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: cfg.color + "20", color: cfg.color }}
                  >
                    {cfg.labelShort}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: cfg.color }}>
                    {cfg.label}
                  </p>
                </div>
              )
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            一部のデータ（ベンダーの移行予定・コスト推定レンジ等）はAIによるウェブ調査を含みます。
            該当箇所には「AI調査」バッジを表示しています。公式発表と異なる場合があります。
          </p>
        </div>
      </div>

      {/* データ鮮度ステータス */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          データ鮮度ステータス
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">データソース</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">組織</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">基準月</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">経過</th>
                <th className="text-center py-2 px-3 text-xs text-gray-500 font-medium">鮮度</th>
              </tr>
            </thead>
            <tbody>
              {freshnessList.map(({ source, daysOld, isStale, isVeryStale, label }) => (
                <tr key={source.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {source.name}
                      </a>
                    ) : (
                      source.name
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {source.org}
                  </td>
                  <td className="py-2 px-3 text-xs tabular-nums">{label}</td>
                  <td className="py-2 px-3 text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                    {source.updateCycle === "reference" ? "—" : `${daysOld}日前`}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {source.updateCycle === "reference" ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 whitespace-nowrap">
                        公表時点
                      </span>
                    ) : isVeryStale ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        要更新
                      </span>
                    ) : isStale ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        やや古い
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        最新
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ページ別データソースマッピング */}
      <div className="card p-5 space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          ページ別データソース
        </h2>
        <div className="space-y-2">
          {Object.entries(PAGE_SOURCES)
            .filter(([pageId, ids]) => ids.length > 0 && pageLabels[pageId])
            .map(([pageId, sourceIds]) => {
              const sources = sourceIds.map((id) => DATA_SOURCES[id]).filter(Boolean);
              const hasAiSurvey = sources.some((s) => s.confidence === "ai_survey");
              return (
                <div key={pageId} className="rounded-lg border border-gray-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <Link
                      href={`/${pageId === "dashboard" ? "" : pageId}`}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: "var(--color-brand-secondary)" }}
                    >
                      {pageLabels[pageId]}
                    </Link>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {sources.length}ソース
                      </span>
                      {hasAiSurvey && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                          AI調査含む
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map((s) => {
                      const cfg = CONFIDENCE_CONFIG[s.confidence];
                      return (
                        <span
                          key={s.id}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                        >
                          {s.org}: {s.name.length > 20 ? s.name.slice(0, 20) + "…" : s.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 全ソース一覧（カテゴリ別） */}
      {(Object.entries(grouped) as [SourceCategory, DataSource[]][])
        .filter(([, sources]) => sources.length > 0)
        .map(([category, sources]) => {
          const cat = CATEGORY_CONFIG[category];
          return (
            <div key={category} className="space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: cat.bgColor, color: cat.color }}
                >
                  {cat.label}
                </span>
                <span className="text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
                  {sources.length}件
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sources.map((source) => {
                  const cfgConf = CONFIDENCE_CONFIG[source.confidence];
                  return (
                    <div
                      key={source.id}
                      className="card p-4 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                          {source.org}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: cfgConf.bgColor, color: cfgConf.color }}
                          >
                            {cfgConf.labelShort}
                          </span>
                          {source.url && (
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs"
                              style={{ color: "var(--color-brand-primary)" }}
                            >
                              ↗
                            </a>
                          )}
                        </div>
                      </div>
                      <h3
                        className="text-sm font-bold leading-snug"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {source.url ? (
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {source.name}
                          </a>
                        ) : (
                          source.name
                        )}
                      </h3>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                        {source.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {source.dataMonth && (
                          <span>基準: {source.dataMonth}</span>
                        )}
                        <span>確認: {source.lastAccessed}</span>
                      </div>
                      {source.notes && (
                        <p className="text-xs italic" style={{ color: "#d97706" }}>
                          {source.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* 既知の制約 */}
      <div className="rounded-lg border border-amber-200 px-5 py-4 space-y-2" style={{ backgroundColor: "#fffbeb" }}>
        <h2 className="text-sm font-bold" style={{ color: "#92400e" }}>
          既知の制約・注意事項
        </h2>
        <ul className="text-xs leading-relaxed space-y-1.5" style={{ color: "#92400e" }}>
          <li>標準化進捗データ（ダッシュボード・リスク）は総務省Excel公開ベースのため、公開タイミングに依存します</li>
          <li>コスト分析のベンダー別推定レンジはAI調査を含み、実際の契約条件により大きく異なる場合があります</li>
          <li>クラウドページの「移行予定」バッジはAIウェブ調査に基づく推定であり、公式発表ではありません</li>
          <li>導入実績データは自治体の公開資料・議事録を独自調査したもので、全数カバーではありません</li>
          <li>本サイトは政府公式サイトではなく、独立した分析プラットフォームです</li>
        </ul>
      </div>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/articles"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--color-brand-secondary)" }}
        >
          ← コラム・解説記事へ
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/terms"
            className="text-xs hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="text-xs hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            プライバシーポリシー
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            ダッシュボードへ →
          </Link>
        </div>
      </div>
    </div>
  );
}
