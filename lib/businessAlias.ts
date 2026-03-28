/**
 * 業務名エイリアスマップ
 *
 * municipality_packages.business に入りうる非標準名を
 * standardization.json の20業務名に正規化する。
 * マッチしない場合は null を返す（20業務外として扱う）。
 */

const STANDARD_BUSINESSES = [
  "住民記録",
  "選挙人名簿管理",
  "固定資産税",
  "個人住民税",
  "法人住民税",
  "軽自動車税",
  "就学",
  "国民年金",
  "国民健康保険",
  "後期高齢者医療",
  "介護保険",
  "障害者福祉",
  "生活保護",
  "健康管理",
  "児童手当",
  "児童扶養手当",
  "子ども・子育て支援",
  "戸籍",
  "戸籍附票",
  "印鑑登録",
] as const;

export type StandardBusiness = (typeof STANDARD_BUSINESSES)[number];

/**
 * 非標準名 → 標準20業務名 のマッピング。
 * DB側で正規化済みでも、将来の取り込みミスに備えてアプリ側でもフォールバック変換する。
 */
const ALIAS_MAP: Record<string, StandardBusiness> = {
  // 住民記録
  住民基本台帳: "住民記録",
  住基: "住民記録",
  住民基本台帳システム: "住民記録",

  // 戸籍
  戸籍総合: "戸籍",
  戸籍情報: "戸籍",
  戸籍システム: "戸籍",

  // 戸籍附票
  戸籍附票管理: "戸籍附票",

  // 国民健康保険
  国保: "国民健康保険",

  // 後期高齢者医療
  後期高齢: "後期高齢者医療",

  // 子ども・子育て支援
  子育て支援: "子ども・子育て支援",
  子ども子育て支援: "子ども・子育て支援",
};

const standardSet = new Set<string>(STANDARD_BUSINESSES);

/**
 * 業務名を標準20業務名に変換する。
 * - 既に標準名ならそのまま返す
 * - エイリアスに該当すれば変換して返す
 * - どちらでもなければ null（20業務外）
 */
export function normalizeBusiness(business: string | null): StandardBusiness | null {
  if (!business) return null;
  if (standardSet.has(business)) return business as StandardBusiness;
  return ALIAS_MAP[business] ?? null;
}
