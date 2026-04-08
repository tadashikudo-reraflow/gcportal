import Link from "next/link";
import { BarChart2 } from "lucide-react";
import type { ClusterConfig } from "@/lib/clusters";

type Props = {
  cluster: ClusterConfig;
};

export default function ArticleCTA({ cluster }: Props) {
  return (
    <div
      className="rounded-lg p-5 my-6"
      style={{
        backgroundColor: "rgba(26, 54, 93, 0.06)",
        borderLeft: "4px solid var(--color-brand-primary, #1a365d)",
      }}
    >
      <div className="flex items-start gap-3">
        <BarChart2 className="flex-shrink-0 mt-0.5" size={20} style={{ color: "var(--color-brand-primary, #1a365d)" }} />
        <div className="space-y-2">
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            この記事のデータをインタラクティブに確認
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {cluster.ctaText}
          </p>
          <Link
            href={cluster.pillarPath}
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline mt-1"
            style={{ color: "var(--color-brand-secondary, #2b6cb0)" }}
          >
            {cluster.pillarLabel}ページを見る →
          </Link>
        </div>
      </div>
    </div>
  );
}
