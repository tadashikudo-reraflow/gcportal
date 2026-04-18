/** GA4 イベントトラッキング ユーティリティ */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * ニュースレター登録完了イベントを GA4 に送信する。
 * @param source - 登録元コンポーネント識別子（例: "newsletter_modal", "article_banner"）
 * @param orgType - 所属種別（例: "municipality", "it_vendor"）
 * @param variant - A/Bテスト用ヘッドラインバリアント（例: "A", "B", "C"）
 */
export function trackNewsletterSignup(source: string, orgType?: string, variant?: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "newsletter_signup", {
    event_category: "conversion",
    event_label: source,
    organization_type: orgType ?? "unknown",
    ab_variant: variant ?? "none",
  });
}
