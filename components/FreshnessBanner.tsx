import { getDataFreshness } from "@/lib/sources";
import { AlertCircle, AlertTriangle } from "lucide-react";

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
        <AlertCircle size={18} color="#dc2626" className="flex-shrink-0 mt-0.5" aria-hidden="true" />
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
      <AlertTriangle size={16} color="#d97706" className="flex-shrink-0" aria-hidden="true" />
      <p className="text-xs" style={{ color: "#92400e" }}>
        <span className="font-semibold">{label}</span>時点（{daysOld}日前）
      </p>
    </div>
  );
}
