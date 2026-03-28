import Link from "next/link";
import type { BusinessSummary } from "@/lib/types";

function getRateColor(rate: number): string {
  if (rate >= 0.9) return "#378445";
  if (rate >= 0.7) return "#1D4ED8";
  if (rate >= 0.5) return "#F59E0B";
  return "#b91c1c";
}

type Props = {
  businesses: BusinessSummary[];
  total: number;
};

export default function BusinessCards({ businesses, total }: Props) {
  return (
    <div className="card p-6">
      <h2
        className="text-sm font-bold mb-3"
        style={{ color: "var(--color-text-primary)" }}
      >
        業務別 手続き進捗率
        <span className="text-xs font-normal ml-2" style={{ color: "var(--color-text-muted)" }}>進捗率降順・クリックで詳細</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {businesses.map((biz) => {
          const pct = biz.avg_rate * 100;
          const barColor = getRateColor(biz.avg_rate);

          return (
            <Link
              key={biz.business}
              href={`/businesses/${encodeURIComponent(biz.business)}`}
              className="bg-white rounded-xl p-3 flex flex-col gap-2 transition-all hover:shadow-md no-underline"
              style={{ border: "1px solid #E5E7EB" }}
            >
              <p
                className="text-xs leading-snug"
                style={{ color: "var(--color-text-secondary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                title={biz.business}
              >
                {biz.business}
              </p>
              <p
                className="tabular-nums font-black leading-none"
                style={{ fontSize: 20, color: barColor }}
              >
                {pct.toFixed(1)}%
              </p>
              <div className="rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "#e5e7eb" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
              {biz.critical > 0 && (
                <p className="text-[10px]" style={{ color: "#b91c1c" }}>
                  危機 <span style={{ fontWeight: 700 }}>{biz.critical}</span>団体
                </p>
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">凡例:</span>
        {[
          { label: "90%+", color: "#378445" },
          { label: "70-89%", color: "#1D4ED8" },
          { label: "50-69%", color: "#F59E0B" },
          { label: "<50%", color: "#b91c1c" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-500">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
