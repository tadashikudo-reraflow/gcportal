import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import data from "@/public/data/standardization.json";
import { Municipality } from "@/lib/types";

// SSG: 47都道府県分の静的パラメータを生成
export function generateStaticParams() {
  const prefectures = data.prefectures.map((p) => p.prefecture);
  return prefectures.map((prefecture) => ({
    prefecture: encodeURIComponent(prefecture),
  }));
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
    description: `${name}の全市区町村のガバメントクラウド移行進捗状況。${rate ? `平均完了率${rate}%。` : ""}業務別の詳細データ付き。`,
    openGraph: {
      title: `${name} — ガバメントクラウド移行進捗`,
      description: rate
        ? `${name}の平均完了率は${rate}%`
        : `${name}の移行進捗を可視化`,
      images: [
        {
          url: `/og?title=${encodeURIComponent(name)}&subtitle=${encodeURIComponent(rate ? `平均完了率 ${rate}%` : "ガバメントクラウド移行進捗")}${prefSummary ? `&rate=${prefSummary.avg_rate}` : ""}&type=prefecture`,
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
              完了 {prefSummary.completed} / 危機 {prefSummary.critical}
            </p>
          </div>
        )}
      </div>

      {/* 市区町村テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium sticky left-0 bg-gray-50 z-10 min-w-[120px]">
                  市区町村
                </th>
                <th className="text-left py-3 px-3 text-xs text-gray-500 font-medium min-w-[160px]">
                  完了率
                </th>
                {businessNames.map((biz) => (
                  <th
                    key={biz}
                    className="text-center py-3 px-1 text-xs text-gray-400 font-medium min-w-[36px]"
                    title={biz}
                  >
                    <span className="truncate block max-w-[32px] mx-auto" title={biz}>
                      {/* 業務名は hover の title で確認できるため省略表示 */}
                      <span className="sr-only">{biz}</span>
                      <span className="not-sr-only text-[10px] writing-mode-vertical" aria-hidden="true">
                        {biz.slice(0, 2)}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedMunicipalities.map((muni) => {
                const rate = muni.overall_rate;
                const textColor = getRateColor(rate);
                const barColor = getRateBarColor(rate);
                const pct = rate !== null ? rate * 100 : 0;

                return (
                  <tr
                    key={`${muni.prefecture}-${muni.city}`}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* 市区町村名 */}
                    <td className="py-2.5 px-3 font-medium text-gray-800 sticky left-0 bg-white z-10">
                      {muni.city}
                    </td>

                    {/* 全体完了率 + プログレスバー */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden min-w-[80px]">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold w-12 flex-shrink-0 ${textColor}`}
                        >
                          {formatRate(rate)}
                        </span>
                      </div>
                    </td>

                    {/* 業務別ミニバー */}
                    {businessNames.map((biz) => {
                      const bizRate = muni.business_rates[biz];
                      const bizPct =
                        bizRate !== null && bizRate !== undefined
                          ? bizRate * 100
                          : null;
                      const miniBarColor = getRateBarColor(
                        bizRate !== undefined ? bizRate : null
                      );

                      return (
                        <td
                          key={biz}
                          className="py-2.5 px-1 text-center"
                          title={`${biz}: ${formatRate(bizRate !== undefined ? bizRate : null)}`}
                        >
                          <div
                            className="mx-auto bg-gray-100 rounded-sm overflow-hidden"
                            style={{ width: 28, height: 28 }}
                            title={`${biz}: ${formatRate(bizRate !== undefined ? bizRate : null)}`}
                          >
                            {bizPct !== null ? (
                              <div
                                className={`w-full rounded-sm ${miniBarColor}`}
                                style={{
                                  height: `${Math.min(bizPct, 100)}%`,
                                  marginTop: `${100 - Math.min(bizPct, 100)}%`,
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 業務名凡例 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 mb-3">業務名一覧（ミニバー列の対応）</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          {businessNames.map((biz, i) => (
            <div key={biz} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 font-mono w-5 flex-shrink-0">
                {i + 1}.
              </span>
              <span className="text-xs text-gray-700">{biz}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
