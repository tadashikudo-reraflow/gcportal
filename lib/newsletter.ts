/**
 * lib/newsletter.ts
 * ニュースレター登録の共通モジュール
 * ORG_OPTIONS・submitNewsletter・A/Bテスト用ヘッドラインを一元管理
 */

// ================================
// 所属オプション（全コンポーネント共通）
// ================================
export const ORG_OPTIONS = [
  { value: "municipality", label: "自治体職員" },
  { value: "it_vendor", label: "IT企業・SIer" },
  { value: "consultant", label: "コンサル・シンクタンク" },
  { value: "politician", label: "議員・議員事務所" },
  { value: "media", label: "メディア・研究者" },
  { value: "other", label: "その他" },
] as const;

export type OrgOption = { value: string; label: string };

// ================================
// 登録 API 共通関数
// ================================
export async function submitNewsletter(params: {
  email: string;
  orgType: string;
  source: string;
}): Promise<void> {
  const res = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      organization_type: params.orgType,
      source: params.source,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `登録に失敗しました（${res.status}）`);
  }
}

// ================================
// A/B テスト — ヘッドライン variants
// ================================
export const HEADLINE_VARIANTS = {
  A: {
    headline: "ガバメントクラウドの「今週何が動いたか」を5分で把握",
    sub: "デジタル庁データ更新・ベンダー動向・コスト分析を1通に凝縮。",
  },
  B: {
    headline: "月曜の会議前に、ガバクラの週次サマリを5分で。",
    sub: "デジタル庁データ更新・ベンダー動向・コスト分析を1通に凝縮。",
  },
  C: {
    headline: "全国1,741自治体の進捗データを毎週金曜に整理してお届け。",
    sub: "デジタル庁データ更新・ベンダー動向・コスト分析を1通に凝縮。",
  },
} as const;

export type HeadlineVariant = keyof typeof HEADLINE_VARIANTS;

const VARIANT_KEY = "nl_variant";

/** クライアント側でのみ呼ぶ。localStorage でバリアントを固定する */
export function getOrAssignVariant(): HeadlineVariant {
  if (typeof window === "undefined") return "A";
  const stored = localStorage.getItem(VARIANT_KEY) as HeadlineVariant | null;
  if (stored && stored in HEADLINE_VARIANTS) return stored;
  const variants = Object.keys(HEADLINE_VARIANTS) as HeadlineVariant[];
  const assigned = variants[Math.floor(Math.random() * variants.length)];
  localStorage.setItem(VARIANT_KEY, assigned);
  return assigned;
}
