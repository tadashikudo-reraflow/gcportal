import type { MetadataRoute } from "next";

const BASE_URL = "https://gcportal-tau.vercel.app";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/prefectures`,   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/businesses`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/risks`,         lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/tokutei`,       lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/packages`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/adoption`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/costs`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/cloud`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/articles`,      lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
  ];

  const prefecturePages: MetadataRoute.Sitemap = PREFECTURES.map((pref) => ({
    url: `${BASE_URL}/prefectures/${encodeURIComponent(pref)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...prefecturePages];
}
