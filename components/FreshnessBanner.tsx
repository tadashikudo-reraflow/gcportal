import { getDataFreshness } from "@/lib/sources";

type FreshnessBannerProps = {
  dataMonth: string;        // "YYYY-MM"
  thresholdDays?: number;   // default 30
  pageLabel?: string;       // "ダッシュボード"
};

export default function FreshnessBanner({
  dataMonth,
  thresholdDays = 30,
  pageLabel,
}: FreshnessBannerProps) {
  const { daysOld, isStale, isVeryStale, label } = getDataFreshness(dataMonth);

  // 新鮮: 小さなグレーテキストのみ
  if (!isStale) {
    return (
      <p className="text-xs" style={{ color: "#9ca3af" }}>
        データ基準: {label}
      </p>
    );
  }

  // 非常に古い (>60日): レッドバナー
  if (isVeryStale) {
    return (
      <div
        className="rounded-lg px-4 py-3 flex items-start gap-3"
        style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5" }}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#991b1b" }}>
            {label}時点のデータです（{daysOld}日前）
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#b91c1c" }}>
            最新情報は
            <a
              href="https://www.digital.go.jp/policies/local_governments"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              デジタル庁公式サイト
            </a>
            をご確認ください。
          </p>
        </div>
      </div>
    );
  }

  // やや古い (30-60日): アンバーバナー
  return (
    <div
      className="rounded-lg px-4 py-2.5 flex items-center gap-2"
      style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d" }}
    >
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="text-xs" style={{ color: "#92400e" }}>
        <span className="font-semibold">{label}</span>時点（{daysOld}日前）
      </p>
    </div>
  );
}
