/**
 * コスト関連定数
 * 出典: デジタル庁先行事業TCO検証（2025年度）
 * TODO: 新しいデータソースが利用可能になったらAPIから取得に切り替え
 */
export const COST_CONSTANTS = {
  avgCostIncrease: 2.3,
  maxCostIncrease: 5.7,
  minCostIncrease: 1.6,
  initialIncreaseRate: 156, // 当初比増加率(%)
  source: "デジタル庁先行事業TCO検証",
} as const;
