/**
 * コスト関連定数
 * 出典: 中核市市長会調査(2025年1月)
 * TODO: 新しいデータソースが利用可能になったらAPIから取得に切り替え
 */
export const COST_CONSTANTS = {
  avgCostIncrease: 2.3,
  maxCostIncrease: 5.7,
  minCostIncrease: 1.6,
  initialIncreaseRate: 156, // 当初比増加率(%) 出典: 中核市市長会調査(2025年1月)
  source: "中核市市長会調査(2025年1月)",
} as const;
