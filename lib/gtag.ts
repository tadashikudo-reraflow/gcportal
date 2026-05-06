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

/**
 * CTA インプレッション（IntersectionObserver で表示確認時）
 * @param source - CTA識別子（例: "newsletter_article_mid_<slug>"）
 */
export function trackCtaImpression(source: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "cta_impression", {
    event_category: "engagement",
    event_label: source,
  });
}

/**
 * CTA クリック（送信ボタン・リンク等のアクション）
 * @param source - CTA識別子
 * @param action - クリック種別（例: "submit", "view_municipality"）
 */
export function trackCtaClick(source: string, action: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "cta_click", {
    event_category: "engagement",
    event_label: source,
    cta_action: action,
  });
}

/**
 * 自治体ページへのリンククリック専用イベント
 * @param source - クリック元コンポーネント
 */
export function trackMunicipalityLinkClick(source: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "municipality_link_click", {
    event_category: "engagement",
    event_label: source,
  });
}
