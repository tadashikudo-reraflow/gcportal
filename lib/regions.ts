/** 8地方区分 */
export const REGIONS: Record<string, string[]> = {
  '北海道': ['北海道'],
  '東北': ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  '中部': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
  '近畿': ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  '中国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  '四国': ['徳島県', '香川県', '愛媛県', '高知県'],
  '九州沖縄': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
};

/** 都道府県 → 地方 逆引き */
export function prefectureToRegion(prefecture: string): string | undefined {
  for (const [region, prefs] of Object.entries(REGIONS)) {
    if (prefs.includes(prefecture)) return region;
  }
  return undefined;
}

/** 人口帯定義 */
export const POPULATION_BANDS = [
  { key: 'under1', label: '1万未満', min: 0, max: 9999 },
  { key: '1to5', label: '1-5万', min: 10000, max: 49999 },
  { key: '5to10', label: '5-10万', min: 50000, max: 99999 },
  { key: '10to30', label: '10-30万', min: 100000, max: 299999 },
  { key: 'over30', label: '30万以上', min: 300000, max: Infinity },
] as const;

/** ステータスラベル */
export const STATUS_OPTIONS = [
  { key: 'completed', label: '完了' },
  { key: 'on_track', label: '順調' },
  { key: 'warning', label: '要注意' },
  { key: 'critical', label: '危機' },
  { key: 'tokutei', label: '特定移行' },
] as const;

