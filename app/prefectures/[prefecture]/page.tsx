import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { Municipality } from "@/lib/types";

// SSG: 47都道府県分の静的パラメータを生成
// Next.jsが自動でURLエンコードするため、ここでは生の日本語文字列を返す
export function generateStaticParams() {
  const prefectures = data.prefectures.map((p) => p.prefecture);
  return prefectures.map((prefecture) => ({ prefecture }));
}

function getRateColor(rate: number | null): string {
  if (rate === null) return "text-gray-400";
  if (rate >= 1.0) return "text-green-600";
  if (rate >= 0.8) return "text-blue-600";
  if (rate >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

function getRateBarColor(rate: number | null): string {
  if (rate === null) return "bg-gray-200";
  if (rate >= 1.0) return "bg-green-500";
  if (rate >= 0.8) return "bg-blue-400";
  if (rate >= 0.5) return "bg-yellow-400";
  return "bg-red-500";
}

function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return (rate * 100).toFixed(1) + "%";
}

/** 業務ヘルスステータス判定 */
type HealthStatus = "stable" | "volatile" | "alert";

function getBusinessHealth(avgRate: number): HealthStatus {
  if (avgRate >= 0.8) return "stable";
  if (avgRate >= 0.5) return "volatile";
  return "alert";
}

const HEALTH_CONFIG: Record<HealthStatus, { dot: string; border: string; label: string }> = {
  stable:   { dot: "bg-emerald-500", border: "border-gray-200",  label: "安定" },
  volatile: { dot: "bg-amber-600",   border: "border-amber-400", label: "注意" },
  alert:    { dot: "bg-red-500",     border: "border-red-400",   label: "危機" },
};

interface PageProps {
  params: Promise<{ prefecture: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { prefecture: encoded } = await params;
  const name = decodeURIComponent(encoded);
  const prefSummary = data.prefectures.find((p) => p.prefecture === name);
  const rate = prefSummary ? (prefSummary.avg_rate * 100).toFixed(1) : null;

  return {
    title: `${name}のガバメントクラウド移行進捗 | GCInsight`,
    description: `${name}の全市区町村のガバメントクラウド移行進捗状況。${rate ? `手続き進捗率（都道府県平均）${rate}%。` : ""}業務別の詳細データ付き。`,
    alternates: { canonical: `/prefectures/${name}` },
    openGraph: {
      title: `${name} — ガバメントクラウド移行進捗`,
      description: rate
        ? `${name}の手続き進捗率（都道府県平均）は${rate}%`
        : `${name}の移行進捗を可視化`,
      images: [
        {
          url: `/og?title=${encodeURIComponent(name)}&subtitle=${encodeURIComponent(rate ? `手続き進捗率（平均） ${rate}%` : "ガバメントクラウド移行進捗")}${prefSummary ? `&rate=${prefSummary.avg_rate}` : ""}&type=prefecture`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PrefectureDetailPage({ params }: PageProps) {
  const { prefecture: encodedPrefecture } = await params;
  const prefectureName = decodeURIComponent(encodedPrefecture);

  // 該当都道府県の市区町村を取得
  const municipalities: Municipality[] = data.municipalities.filter(
    (m) => m.prefecture === prefectureName
  );

  if (municipalities.length === 0) {
    notFound();
  }

  // 完了率の低い順（昇順）に並べる
  const sortedMunicipalities = [...municipalities].sort((a, b) => {
    if (a.overall_rate === null && b.overall_rate === null) return 0;
    if (a.overall_rate === null) return 1;
    if (b.overall_rate === null) return -1;
    return a.overall_rate - b.overall_rate;
  });

  // 業務名一覧（最初の自治体から取得）
  const businessNames = Object.keys(municipalities[0].business_rates);

  // 都道府県サマリーを取得
  const prefSummary = data.prefectures.find(
    (p) => p.prefecture === prefectureName
  );

  // 特定移行認定自治体のSet
  const tokuteiSet = new Set<string>(
    (tokuteiData.municipalities as { prefecture: string; city: string }[]).map(
      (m) => `${m.prefecture}/${m.city}`
    )
  );
  const tokuteiCount = sortedMunicipalities.filter(
    (m) => tokuteiSet.has(`${m.prefecture}/${m.city}`)
  ).length;
  // 全業務完了（overall_rate >= 1.0 かつ特定移行でない）の自治体数
  const allCompleteCount = sortedMunicipalities.filter(
    (m) => m.overall_rate !== null && m.overall_rate >= 1.0 && !tokuteiSet.has(`${m.prefecture}/${m.city}`)
  ).length;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/prefectures"
              className="text-sm text-blue-600 hover:underline"
            >
              ← 都道府県一覧に戻る
            </Link>
          </div>
          <h1 className="page-title">
            {prefectureName} の標準化進捗
          </h1>
          <p className="page-subtitle">
            {municipalities.length} 市区町村 / データ基準: {data.summary.data_month}
          </p>
        </div>
        {prefSummary && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-right flex-shrink-0">
            <p className="text-xs text-gray-500 mb-1">都道府県平均</p>
            <p
              className={`text-3xl font-extrabold ${getRateColor(prefSummary.avg_rate)}`}
            >
              {formatRate(prefSummary.avg_rate)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              全業務完了 <strong style={{ color: allCompleteCount > 0 ? "#16a34a" : "#ef4444" }}>{allCompleteCount}</strong> / 危機 {prefSummary.critical} / 特定移行 {tokuteiCount}
            </p>
          </div>
        )}
      </div>

      {/* 業務ヘルス概観 */}
      {(() => {
        // 業務ごとの都道府県内平均完了率を算出
        const bizHealthMap = businessNames.map((biz, i) => {
          const rates = municipalities
            .map((m) => m.business_rates[biz])
            .filter((r): r is number => r !== null && r !== undefined);
          const avg = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
          const status = getBusinessHealth(avg);
          return { biz, index: i + 1, avg, status };
        });
        const cfg = HEALTH_CONFIG;
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-800">業務別ヘルス</h2>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />安定</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-600" />注意</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />危機</span>
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
              {bizHealthMap.map((item) => {
                const c = cfg[item.status];
                return (
                  <div
                    key={item.biz}
                    className={`rounded-xl border-2 ${c.border} bg-gray-50 p-3 flex flex-col items-center gap-1.5 text-center`}
                    title={`${item.biz}: ${formatRate(item.avg)}（${c.label}）`}
                  >
                    <span className="text-[10px] text-gray-400 font-medium">{item.index}</span>
                    <span className={`inline-block w-3 h-3 rounded-full ${c.dot}`} />
                    <span className="text-[11px] text-gray-700 font-medium leading-tight">{item.biz.length > 5 ? item.biz.slice(0, 4) + "…" : item.biz}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 市区町村一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
          <span className="text-xs font-semibold text-gray-500">市区町村</span>
          <span className="text-xs text-gray-400">クリックで業務別詳細を表示</span>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedMunicipalities.map((muni) => {
            const rate = muni.overall_rate;
            const textColor = getRateColor(rate);
            const barColor = getRateBarColor(rate);
            const pct = rate !== null ? rate * 100 : 0;
            const isTokutei = tokuteiSet.has(`${muni.prefecture}/${muni.city}`);

            return (
              <details key={`${muni.prefecture}-${muni.city}`} className="group">
                <summary className="flex items-center gap-3 py-2.5 px-4 cursor-pointer hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-xs text-gray-400 group-open:rotate-90 transition-transform">▶</span>
                  <span className="font-medium text-gray-800 text-sm min-w-[80px]">{muni.city}</span>
                  {isTokutei && (
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">認定</span>
                  )}
                  <div className="flex-1 flex items-center gap-2 max-w-[240px]">
                    <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-12 flex-shrink-0 ${textColor}`}>
                      {formatRate(rate)}
                    </span>
                  </div>
                </summary>
                <div className="px-4 pb-3 pt-1">
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
                    {businessNames.map((biz, i) => {
                      const bizRate = muni.business_rates[biz];
                      const bizPct = bizRate !== null && bizRate !== undefined ? bizRate * 100 : null;
                      const dotColor = bizRate !== null && bizRate !== undefined
                        ? bizRate >= 1.0 ? "bg-emerald-500" : bizRate >= 0.8 ? "bg-blue-400" : bizRate >= 0.5 ? "bg-amber-500" : "bg-red-500"
                        : "bg-gray-300";
                      return (
                        <div key={biz} className="flex flex-col items-center gap-0.5 text-center py-1.5">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} />
                          <span className="text-[10px] text-gray-500 leading-tight">{biz.length > 4 ? biz.slice(0, 3) + "…" : biz}</span>
                          <span className={`text-[10px] font-bold ${bizRate !== null && bizRate !== undefined ? (bizRate >= 1.0 ? "text-emerald-600" : bizRate >= 0.5 ? "text-gray-600" : "text-red-600") : "text-gray-400"}`}>
                            {bizPct !== null ? `${bizPct.toFixed(0)}%` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
