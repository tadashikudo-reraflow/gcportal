import data from "@/public/data/standardization.json";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import { COST_CONSTANTS } from "@/lib/constants";

type WidgetType = "progress" | "prefecture" | "cost" | undefined;

interface EmbedPageProps {
  searchParams: Promise<{ type?: string }>;
}

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#FA6414";
  return "#b91c1c";
}

function ProgressWidget() {
  const { summary, prefectures } = data;
  const avgRate = summary.avg_rate;
  const pct = (avgRate * 100).toFixed(1);
  const total = summary.total;

  // Count completed municipalities
  const completed = data.municipalities.filter(
    (m) => m.overall_rate >= 1.0,
  ).length;
  const critical = data.municipalities.filter(
    (m) => m.overall_rate < 0.5,
  ).length;

  // SVG progress ring
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = avgRate * circumference;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-6">
        {/* Progress ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={getRateColor(avgRate)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference - progress}`}
              strokeDashoffset={circumference * 0.25}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold" style={{ color: getRateColor(avgRate) }}>
              {pct}%
            </span>
            <span className="text-[10px] text-gray-500">全国平均</span>
          </div>
        </div>

        {/* Key numbers */}
        <div className="space-y-2 flex-1">
          <div>
            <p className="text-xs text-gray-500">対象自治体</p>
            <p className="text-lg font-bold text-gray-800">{total.toLocaleString()}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-gray-400">完了</p>
              <p className="text-sm font-bold" style={{ color: "#378445" }}>{completed}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400">危機</p>
              <p className="text-sm font-bold" style={{ color: "#b91c1c" }}>{critical}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
        <span>データ基準: {summary.data_month}</span>
        <a
          href="https://gcinsight.jp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline font-medium"
        >
          gcinsight.jp
        </a>
      </div>
    </div>
  );
}

function PrefectureWidget() {
  const sortedPrefectures = [...data.prefectures]
    .sort((a, b) => b.avg_rate - a.avg_rate)
    .slice(0, 10);

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
        <span
          className="w-1 h-4 rounded-full inline-block"
          style={{ backgroundColor: "#003087" }}
        />
        都道府県別完了率 TOP10
      </h3>
      <div className="space-y-1.5">
        {sortedPrefectures.map((pref, i) => {
          const pct = pref.avg_rate * 100;
          return (
            <div key={pref.prefecture} className="flex items-center gap-2 text-xs">
              <span className="w-5 text-gray-400 text-right flex-shrink-0">
                {i + 1}
              </span>
              <span className="w-16 font-medium text-gray-700 flex-shrink-0 truncate">
                {pref.prefecture}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: getRateColor(pref.avg_rate),
                  }}
                />
              </div>
              <span
                className="w-12 text-right font-bold flex-shrink-0 tabular-nums"
                style={{ color: getRateColor(pref.avg_rate) }}
              >
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
        <span>データ基準: {data.summary.data_month}</span>
        <a
          href="https://gcinsight.jp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline font-medium"
        >
          gcinsight.jp
        </a>
      </div>
    </div>
  );
}

function CostWidget() {
  // TODO: コストデータAPIから取得（avgCostIncrease / initialIncreaseRate は現在 COST_CONSTANTS 定数）
  const delayedCount = tokuteiData.total_count; // 特定移行認定団体数（都道府県含む公式総数935）

  return (
    <div className="p-5 space-y-4">
      <h3 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
        <span
          className="w-1 h-4 rounded-full inline-block"
          style={{ backgroundColor: "#b91c1c" }}
        />
        ガバメントクラウド移行コスト
      </h3>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-red-50 rounded-lg p-3">
          {/* TODO: コストデータAPIから取得 */}
          <p className="text-xl font-extrabold text-red-700">{COST_CONSTANTS.avgCostIncrease}x</p>
          <p className="text-[10px] text-red-500 mt-1">平均コスト増</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          {/* TODO: コストデータAPIから取得 */}
          <p className="text-xl font-extrabold text-orange-700">{COST_CONSTANTS.initialIncreaseRate}%</p>
          <p className="text-[10px] text-orange-500 mt-1">当初比増加率</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xl font-extrabold text-blue-700">{delayedCount.toLocaleString()}</p>
          <p className="text-[10px] text-blue-500 mt-1">特定移行認定団体</p>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
        <span>出典: {COST_CONSTANTS.source}</span>
        <a
          href="https://gcinsight.jp/costs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline font-medium"
        >
          gcinsight.jp/costs
        </a>
      </div>
    </div>
  );
}

function EmbedInstructions({ type }: { type: string }) {
  const baseUrl = "https://gcinsight.jp";
  const iframeSrc = `${baseUrl}/embed?type=${type}`;
  const snippet = `<iframe src="${iframeSrc}" width="400" height="${type === "prefecture" ? "420" : "280"}" frameborder="0" style="border-radius:12px;border:1px solid #e5e7eb;" loading="lazy"></iframe>`;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h4 className="text-xs font-bold text-gray-600 mb-2">
        埋め込みコード
      </h4>
      <pre className="text-[11px] text-gray-700 bg-white rounded border border-gray-200 p-3 overflow-x-auto whitespace-pre-wrap break-all">
        {snippet}
      </pre>
    </div>
  );
}

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const { type: rawType } = await searchParams;
  const type = (rawType as WidgetType) || "progress";

  const isStandalone = !rawType;

  return (
    <div
      className="max-w-md mx-auto"
      style={isStandalone ? { padding: "24px" } : undefined}
    >
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {type === "progress" && <ProgressWidget />}
        {type === "prefecture" && <PrefectureWidget />}
        {type === "cost" && <CostWidget />}
      </div>

      {/* Show embed instructions only when accessed directly (not in iframe) */}
      {isStandalone && (
        <div className="space-y-6 mt-8">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              GCInsight 埋め込みウィジェット
            </h2>
            <p className="text-sm text-gray-600">
              以下のウィジェットをあなたのサイトに埋め込むことができます。
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">type</code>{" "}
              パラメータでウィジェットの種類を選択してください。
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                進捗サマリー (<code className="text-xs">type=progress</code>)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                全国平均完了率・自治体数の概要を表示
              </p>
              <EmbedInstructions type="progress" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                都道府県ランキング (<code className="text-xs">type=prefecture</code>)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                完了率上位10都道府県を表示
              </p>
              <EmbedInstructions type="prefecture" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                コスト統計 (<code className="text-xs">type=cost</code>)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                移行コスト増加の概要を表示
              </p>
              <EmbedInstructions type="cost" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
