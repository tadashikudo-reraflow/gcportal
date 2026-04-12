"use client";

import NewsletterModal from "./NewsletterModal";

export default function NewsletterExploreCard() {
  return (
    <NewsletterModal
      label={
        <>
          <span className="explore-card-badge" style={{ backgroundColor: "#BFDBFE", color: "#1E40AF" }}>
            無料
          </span>
          <span className="explore-card-title" style={{ color: "#1E40AF", fontSize: "1rem" }}>ニュースレター登録</span>
          <span className="explore-card-desc">週次まとめ＋限定レポートをメールでお届け</span>
        </>
      }
      source="newsletter_explorecard"
      buttonClassName="explore-card col-span-2 sm:col-span-1"
      buttonStyle={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", padding: "1.25rem 1.5rem", textAlign: "left", border: "1px solid #BFDBFE", cursor: "pointer", display: "flex", flexDirection: "column" }}
    />
  );
}
