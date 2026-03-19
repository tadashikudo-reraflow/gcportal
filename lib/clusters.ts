/**
 * クラスター ↔ タグ ↔ ピラーページの対応定義
 * 内部リンク設計の中核マッピング
 */

export type ClusterConfig = {
  name: string;
  label: string;
  tags: string[];
  pillarPath: string;
  pillarLabel: string;
  ctaText: string;
};

export const CLUSTERS: Record<string, ClusterConfig> = {
  cost: {
    name: "cost",
    label: "コスト・FinOps",
    tags: ["コスト", "FinOps"],
    pillarPath: "/costs",
    pillarLabel: "コスト効果分析",
    ctaText: "クラウド別コスト比較データをインタラクティブに確認できます。",
  },
  vendor: {
    name: "vendor",
    label: "ベンダー比較",
    tags: ["ベンダー", "比較"],
    pillarPath: "/packages",
    pillarLabel: "パッケージ一覧",
    ctaText: "ガバメントクラウド対応パッケージの対応状況を比較できます。",
  },
  tokutei: {
    name: "tokutei",
    label: "特定移行支援",
    tags: ["特定移行支援"],
    pillarPath: "/tokutei",
    pillarLabel: "特定移行認定",
    ctaText: "特定移行支援システム認定自治体の一覧を確認できます。",
  },
  risk: {
    name: "risk",
    label: "遅延・リスク",
    tags: ["遅延", "リスク", "2026年問題"],
    pillarPath: "/risks",
    pillarLabel: "遅延リスク分析",
    ctaText: "自治体別の遅延リスク分析データを確認できます。",
  },
  business: {
    name: "business",
    label: "業務別",
    tags: ["業務別", "標準化"],
    pillarPath: "/businesses",
    pillarLabel: "業務別分析",
    ctaText: "標準化20業務ごとの移行進捗を確認できます。",
  },
  tech: {
    name: "tech",
    label: "セキュリティ・技術",
    tags: ["クラウド", "セキュリティ", "技術"],
    pillarPath: "/cloud",
    pillarLabel: "クラウド基盤",
    ctaText: "認定クラウド5社の対応状況と技術情報を確認できます。",
  },
  basics: {
    name: "basics",
    label: "基本情報",
    tags: ["解説", "ガバメントクラウド"],
    pillarPath: "/",
    pillarLabel: "ダッシュボード",
    ctaText: "全国自治体の移行状況をダッシュボードで確認できます。",
  },
};

/**
 * 記事のタグからマッチするクラスターを返す
 * 最も多くのタグが一致するクラスターを優先
 * 「ガバメントクラウド」「解説」は汎用タグのため basics の優先度を下げる
 */
export function getClusterForTags(tags: string[]): ClusterConfig | null {
  if (!tags || tags.length === 0) return null;

  let bestCluster: ClusterConfig | null = null;
  let bestScore = 0;

  for (const cluster of Object.values(CLUSTERS)) {
    // basics は汎用すぎるため、他に一致があれば優先しない
    if (cluster.name === "basics") continue;

    const score = cluster.tags.filter((ct) => tags.includes(ct)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCluster = cluster;
    }
  }

  // どれにも一致しなければ basics にフォールバック
  if (!bestCluster) {
    const basicsScore = CLUSTERS.basics.tags.filter((ct) =>
      tags.includes(ct)
    ).length;
    if (basicsScore > 0) bestCluster = CLUSTERS.basics;
  }

  return bestCluster;
}

/**
 * ピラーページパスからクラスター設定を取得
 */
export function getClusterForPath(path: string): ClusterConfig | null {
  return (
    Object.values(CLUSTERS).find((c) => c.pillarPath === path) ?? null
  );
}
