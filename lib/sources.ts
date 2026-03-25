// データソースレジストリ — 全ページの出典情報を一元管理
// 各ページはこのレジストリを参照して出典表示・鮮度判定を行う

export type SourceCategory = "government" | "research" | "media" | "vendor" | "ai_survey";
export type ConfidenceLevel = "official" | "verified" | "estimated" | "ai_survey";

export type DataSource = {
  id: string;
  name: string;
  org: string;
  url: string | null;
  description: string;
  category: SourceCategory;
  lastAccessed: string;   // ISO date: 最終確認日
  dataMonth: string | null; // "YYYY-MM": データの基準月
  confidence: ConfidenceLevel;
  notes?: string;
};

// --- レジストリ本体 ---

export const DATA_SOURCES: Record<string, DataSource> = {
  // 政府機関
  "digital-cho-standardization": {
    id: "digital-cho-standardization",
    name: "地方公共団体の基幹業務システムの統一・標準化",
    org: "デジタル庁",
    url: "https://www.digital.go.jp/policies/local_governments",
    description: "標準化対象20業務の進捗データ、特定移行支援システム認定状況、ガバメントクラウド接続団体情報。",
    category: "government",
    lastAccessed: "2026-03-01",
    dataMonth: "2026-01",
    confidence: "official",
  },
  "digital-cho-govcloud": {
    id: "digital-cho-govcloud",
    name: "ガバメントクラウド",
    org: "デジタル庁",
    url: "https://www.digital.go.jp/policies/gov_cloud",
    description: "認定クラウドサービス（AWS・Azure・GCP・OCI・さくら）の情報、GCAS仕様。",
    category: "government",
    lastAccessed: "2026-03-01",
    dataMonth: null,
    confidence: "official",
  },
  "digital-cho-senkou-tco": {
    id: "digital-cho-senkou-tco",
    name: "デジタル庁先行事業TCO検証",
    org: "デジタル庁",
    url: "https://www.digital.go.jp/policies/local_governments",
    description: "先行事業におけるTCO（Total Cost of Ownership）検証結果。コスト変化率の公式データ。",
    category: "government",
    lastAccessed: "2026-02-15",
    dataMonth: "2025-09",
    confidence: "official",
  },
  "digital-cho-cost-measures-2025-06": {
    id: "digital-cho-cost-measures-2025-06",
    name: "自治体情報システムの標準化・ガバメントクラウド移行後の運用経費に係る総合的な対策＜概要＞",
    org: "デジタル庁",
    url: "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/c58162cb-92e5-4a43-9ad5-095b7c45100c/9b626d3b/20250613_policies_local_governments_doc_01.pdf",
    description: "2025年6月13日公表。運用経費増加の構造要因、当面の対策、FinOpsを含むコスト最適化支援の方向性を整理。",
    category: "government",
    lastAccessed: "2026-03-25",
    dataMonth: "2025-06",
    confidence: "official",
  },
  "digital-cho-senkou-infra": {
    id: "digital-cho-senkou-infra",
    name: "デジタル庁先行事業インフラ調査（令和6年9月）",
    org: "デジタル庁",
    url: "https://www.digital.go.jp/policies/local_governments",
    description: "本番稼働システムのクラウド基盤別シェア（AWS 97%等）。",
    category: "government",
    lastAccessed: "2026-02-15",
    dataMonth: "2024-10",
    confidence: "official",
  },
  "digital-cho-tokutei": {
    id: "digital-cho-tokutei",
    name: "特定移行支援システム認定",
    org: "デジタル庁",
    url: "https://www.digital.go.jp/policies/local_governments",
    description: "特定移行支援システムの認定状況と対象自治体リスト。",
    category: "government",
    lastAccessed: "2026-02-27",
    dataMonth: "2026-02",
    confidence: "official",
  },
  "cas-digital-gyozai": {
    id: "cas-digital-gyozai",
    name: "デジタル行財政改革",
    org: "内閣官房",
    url: "https://www.cas.go.jp/jp/seisaku/digital_gyozaikaikaku/",
    description: "共通ワーキングチーム資料。ガバメントクラウドのコスト分析・運用経費の実態データ。",
    category: "government",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "official",
  },
  "soumu-dx": {
    id: "soumu-dx",
    name: "自治体DX推進計画",
    org: "総務省",
    url: "https://www.soumu.go.jp/denshijiti/index_00001.html",
    description: "自治体のデジタル・トランスフォーメーション推進に関する計画・支援策・補助金情報。",
    category: "government",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "official",
  },
  "soumu-progress-excel": {
    id: "soumu-progress-excel",
    name: "市区町村標準化進捗Excel",
    org: "総務省",
    url: "https://www.soumu.go.jp/denshijiti/index_00001.html",
    description: "1,741市区町村×20業務の標準化進捗率。ETLでstandardization.jsonに変換。",
    category: "government",
    lastAccessed: "2026-03-01",
    dataMonth: "2026-01",
    confidence: "official",
  },
  "soumu-kiban-kikin": {
    id: "soumu-kiban-kikin",
    name: "デジタル基盤改革支援基金",
    org: "総務省",
    url: "https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/digital_kiban.html",
    description: "ガバメントクラウド移行にかかる自治体への財政支援（補助金）の要件・交付実績。",
    category: "government",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "official",
  },
  "jlis": {
    id: "jlis",
    name: "地方公共団体情報システム機構（J-LIS）",
    org: "J-LIS",
    url: "https://www.j-lis.go.jp/",
    description: "自治体の情報システム基盤を支える中間サーバー・LGWAN等の運用主体。",
    category: "government",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "official",
  },
  "egov-hourei": {
    id: "egov-hourei",
    name: "e-Gov法令検索",
    org: "デジタル庁",
    url: "https://elaws.e-gov.go.jp/",
    description: "標準化に関する法律等、関連法令の原文。",
    category: "government",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "official",
  },
  "chukakushi-survey-2025": {
    id: "chukakushi-survey-2025",
    name: "中核市市長会調査（2025）",
    org: "中核市市長会",
    url: null,
    description: "中核市におけるガバメントクラウド移行コストの実態調査。最悪事例+470%等。",
    category: "research",
    lastAccessed: "2026-02-15",
    dataMonth: "2025-06",
    confidence: "verified",
  },

  // 総務省（Deepリサーチ L1追加分）
  "soumu-security-guideline": {
    id: "soumu-security-guideline",
    name: "地方公共団体における情報セキュリティポリシーに関するガイドライン",
    org: "総務省",
    url: "https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/lg-cloud/",
    description: "ガバメントクラウド特則（第4編）を含むセキュリティポリシーガイドライン。ステークホルダー責任分担・インシデント対応体制。",
    category: "government",
    lastAccessed: "2026-03-21",
    dataMonth: null,
    confidence: "official",
  },
  "soumu-lg-cloud-portal": {
    id: "soumu-lg-cloud-portal",
    name: "自治体クラウドポータルサイト",
    org: "総務省",
    url: "https://www.soumu.go.jp/main_sosiki/jichi_gyousei/c-gyousei/lg-cloud/",
    description: "自治体クラウド導入促進の10の指針、フォローアップ調査、共同化事例。",
    category: "government",
    lastAccessed: "2026-03-21",
    dataMonth: null,
    confidence: "official",
  },
  "digital-cho-gcas-guide": {
    id: "digital-cho-gcas-guide",
    name: "ガバメントクラウドの利用について（GCAS利用ガイド）",
    org: "デジタル庁",
    url: "https://www.digital.go.jp/policies/gov_cloud",
    description: "技術要件305項目、CSP充足状況、さくらのクラウド開発計画進捗、GCAS管理サービス仕様。",
    category: "government",
    lastAccessed: "2026-03-21",
    dataMonth: "2024-07",
    confidence: "official",
  },

  // CSP公式ブログ（Deepリサーチ L2追加分）
  "aws-govcloud-site": {
    id: "aws-govcloud-site",
    name: "AWS 地方自治体のためのガバメントクラウド情報サイト",
    org: "AWS",
    url: "https://aws.amazon.com/jp/government-education/worldwide/japan/gov-cloud-advisory-site/",
    description: "タスクリスト・オンライントレーニング・相談窓口。自治体・ベンダー向け支援。",
    category: "vendor",
    lastAccessed: "2026-03-21",
    dataMonth: null,
    confidence: "verified",
    notes: "ベンダー視点。引用時は「AWS公式サイトによると」と明記",
  },
  "aws-blog-govcloud": {
    id: "aws-blog-govcloud",
    name: "AWS Public Sector Blog（ガバメントクラウド関連）",
    org: "AWS",
    url: "https://aws.amazon.com/jp/blogs/news/",
    description: "生成AI活用運用管理、ワークショップ報告、BLEA等のベストプラクティス。",
    category: "vendor",
    lastAccessed: "2026-03-21",
    dataMonth: null,
    confidence: "verified",
    notes: "ベンダー視点。引用時は「AWS Blogによると」と明記",
  },
  "gcp-blog-govcloud": {
    id: "gcp-blog-govcloud",
    name: "Google Cloud Blog（GCAS事例・ガバメントクラウド）",
    org: "Google Cloud",
    url: "https://cloud.google.com/blog/ja/",
    description: "GCAS（Cloud Run+Firestore）フルサーバーレス事例、EBPMダッシュボード（BigQuery/Looker）。",
    category: "vendor",
    lastAccessed: "2026-03-21",
    dataMonth: null,
    confidence: "verified",
    notes: "ベンダー視点。引用時は「Google Cloud公式ブログによると」と明記",
  },
  "azure-blog-govcloud": {
    id: "azure-blog-govcloud",
    name: "Microsoft Azure ガバメントクラウド支援",
    org: "Microsoft",
    url: "https://www.microsoft.com/ja-jp/industry/blog/government/",
    description: "早期移行団体検証事業支援、ISV向けクレジット、Azure OpenAI Service活用。",
    category: "vendor",
    lastAccessed: "2026-03-21",
    dataMonth: null,
    confidence: "verified",
    notes: "ベンダー視点。引用時は「Microsoft公式ブログによると」と明記",
  },
  "oracle-govcloud": {
    id: "oracle-govcloud",
    name: "Oracle Cloud ガバメントクラウド情報",
    org: "Oracle",
    url: "https://www.oracle.com/jp/cloud/government/",
    description: "和歌山市共同利用方式事例、iJAMP連携、コストパフォーマンス訴求。",
    category: "vendor",
    lastAccessed: "2026-03-21",
    dataMonth: null,
    confidence: "verified",
    notes: "ベンダー視点。引用時は「Oracle公式によると」と明記",
  },
  "oracle-network-pricing": {
    id: "oracle-network-pricing",
    name: "Cloud Networkingの価格",
    org: "Oracle",
    url: "https://www.oracle.com/jp/cloud/networking/pricing/",
    description: "OCIのネットワーキング料金。日本を含むAPACではアウトバウンドデータ転送が月10TBまで無料。",
    category: "vendor",
    lastAccessed: "2026-03-25",
    dataMonth: "2026-03",
    confidence: "verified",
    notes: "ベンダー公式の最新価格ページ",
  },
  "aws-ec2-pricing": {
    id: "aws-ec2-pricing",
    name: "Amazon EC2 料金",
    org: "AWS",
    url: "https://aws.amazon.com/jp/ec2/pricing/",
    description: "AWSのEC2料金ページ。データ転送アウト料金の説明を含む。",
    category: "vendor",
    lastAccessed: "2026-03-25",
    dataMonth: "2026-03",
    confidence: "verified",
    notes: "ベンダー公式の最新価格ページ",
  },
  "azure-bandwidth-pricing": {
    id: "azure-bandwidth-pricing",
    name: "Azure 帯域幅の価格",
    org: "Microsoft Azure",
    url: "https://azure.microsoft.com/ja-jp/pricing/details/bandwidth/",
    description: "Azureのデータ転送・帯域幅料金ページ。インターネットエグレスやリージョン間転送の料金を掲載。",
    category: "vendor",
    lastAccessed: "2026-03-25",
    dataMonth: "2026-03",
    confidence: "verified",
    notes: "ベンダー公式の最新価格ページ",
  },
  "sakura-cloud-pricing": {
    id: "sakura-cloud-pricing",
    name: "さくらのクラウド 料金",
    org: "さくらインターネット",
    url: "https://cloud.sakura.ad.jp/payment/",
    description: "さくらのクラウド料金ページ。データ転送量による従量課金なしの料金体系を案内。",
    category: "vendor",
    lastAccessed: "2026-03-25",
    dataMonth: "2026-03",
    confidence: "verified",
    notes: "ベンダー公式の最新価格ページ",
  },

  // 研究機関
  "iais": {
    id: "iais",
    name: "行政情報システム研究所（IAIS）",
    org: "一般社団法人 IAIS",
    url: "https://www.iais.or.jp/",
    description: "AIS臨時号等で自治体システム標準化の調査レポートを発行。",
    category: "research",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "verified",
  },
  "lasdec": {
    id: "lasdec",
    name: "地方自治情報センター（LASDEC）",
    org: "一般財団法人",
    url: "https://www.lasdec.or.jp/",
    description: "自治体の情報化に関する調査研究・統計データの提供。",
    category: "research",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "verified",
  },
  "applic-products": {
    id: "applic-products",
    name: "APPLIC準拠製品登録リスト",
    org: "APPLIC",
    url: null,
    description: "標準化対応パッケージの登録リスト。ベンダー・パッケージ情報の公式ソース。",
    category: "research",
    lastAccessed: "2026-02-15",
    dataMonth: null,
    confidence: "verified",
  },
  "applic-tekigo-excel": {
    id: "applic-tekigo-excel",
    name: "APPLIC適合システム一覧（Excel）",
    org: "APPLIC",
    url: null,
    description: "各業務×パッケージの適合番号・確認日を収録したExcelファイル。クラウド対応状況「調査中」の基準日として使用。",
    category: "research",
    lastAccessed: "2026-03-25",
    dataMonth: "2026-03",
    confidence: "official",
  },

  // ベンダー関連
  "oracle-tco": {
    id: "oracle-tco",
    name: "Oracle TCO白書",
    org: "Oracle",
    url: null,
    description: "OCI vs AWS/Azure/GCPのTCO比較。OCI = AWSの約55%との分析。",
    category: "vendor",
    lastAccessed: "2026-02-15",
    dataMonth: "2024-06",
    confidence: "verified",
    notes: "ベンダー公表値のため中立性に留意",
  },
  "gartner-iaas": {
    id: "gartner-iaas",
    name: "Gartner IaaS比較レポート",
    org: "Gartner",
    url: null,
    description: "IaaS各社のコスト・性能比較。クラウドコスト比較の第三者ソース。",
    category: "research",
    lastAccessed: "2026-01-15",
    dataMonth: "2024-09",
    confidence: "verified",
  },
  "vendor-press": {
    id: "vendor-press",
    name: "各社公式プレスリリース・採用情報",
    org: "各ベンダー",
    url: null,
    description: "TKC/NEC/富士通/日立/RKKCS等のプレスリリース・IR情報からのクラウド対応状況。",
    category: "vendor",
    lastAccessed: "2026-03-01",
    dataMonth: null,
    confidence: "verified",
  },

  // AI調査
  "grok-web-survey": {
    id: "grok-web-survey",
    name: "Grokウェブ調査",
    org: "xAI (Grok)",
    url: null,
    description: "AIによるウェブ調査で収集した情報。公式発表と異なる場合あり。要検証。",
    category: "ai_survey",
    lastAccessed: "2026-03-01",
    dataMonth: null,
    confidence: "ai_survey",
    notes: "移行予定・コスト推定等で使用。公式ソースで裏取りが必要",
  },

  // メディア
  "nikkei-xtech": {
    id: "nikkei-xtech",
    name: "日経クロステック",
    org: "日経BP",
    url: "https://xtech.nikkei.com/",
    description: "自治体システム標準化・ガバメントクラウドに関する取材記事・調査報道。",
    category: "media",
    lastAccessed: "2026-03-01",
    dataMonth: null,
    confidence: "verified",
  },
};

// --- ページ → ソースID マッピング ---

export const PAGE_SOURCES: Record<string, string[]> = {
  dashboard: ["soumu-progress-excel", "digital-cho-tokutei"],
  costs:     ["digital-cho-senkou-tco", "chukakushi-survey-2025", "grok-web-survey", "vendor-press"],
  costReduction: ["digital-cho-cost-measures-2025-06", "digital-cho-senkou-tco", "chukakushi-survey-2025", "oracle-network-pricing", "aws-ec2-pricing", "azure-bandwidth-pricing", "sakura-cloud-pricing"],
  cloud:     ["digital-cho-senkou-infra", "applic-products", "oracle-tco", "gartner-iaas", "vendor-press", "grok-web-survey"],
  packages:  ["applic-tekigo-excel", "applic-products", "vendor-press"],
  adoption:  ["vendor-press", "grok-web-survey"],
  risks:     ["soumu-progress-excel"],
  tokutei:   ["digital-cho-tokutei"],
  businesses: ["soumu-progress-excel"],
  prefectures: ["soumu-progress-excel"],
  timeline:  ["digital-cho-standardization", "digital-cho-govcloud", "soumu-dx", "cas-digital-gyozai"],
  sources:   [],
};

// --- Confidence 定義（UI表示用） ---

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, {
  label: string;
  labelShort: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  official: {
    label: "政府公式データ",
    labelShort: "公式",
    color: "#15803d",
    bgColor: "#f0fdf4",
    borderColor: "#86efac",
    icon: "check-circle",
  },
  verified: {
    label: "公式発表・第三者調査で確認済",
    labelShort: "確認済",
    color: "#1d4ed8",
    bgColor: "#eff6ff",
    borderColor: "#93c5fd",
    icon: "check",
  },
  estimated: {
    label: "推定値（複数ソースからの推計）",
    labelShort: "推定",
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fcd34d",
    icon: "alert-triangle",
  },
  ai_survey: {
    label: "独自調査（参考値）",
    labelShort: "独自調査（参考値）",
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fca5a5",
    icon: "info",
  },
};

export const CATEGORY_CONFIG: Record<SourceCategory, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  government: { label: "政府機関", color: "#1565c0", bgColor: "#e3f2fd" },
  research:   { label: "研究機関", color: "#2e7d32", bgColor: "#e8f5e9" },
  media:      { label: "メディア", color: "#6a1b9a", bgColor: "#f3e5f5" },
  vendor:     { label: "ベンダー", color: "#e65100", bgColor: "#fff3e0" },
  ai_survey:  { label: "AI調査",   color: "#c62828", bgColor: "#ffebee" },
};

// --- ヘルパー関数 ---

export function getSource(id: string): DataSource | undefined {
  return DATA_SOURCES[id];
}

export function getSourcesForPage(pageId: string): DataSource[] {
  const ids = PAGE_SOURCES[pageId] ?? [];
  return ids.map((id) => DATA_SOURCES[id]).filter(Boolean);
}

export function getDataFreshness(dataMonth: string): {
  daysOld: number;
  isStale: boolean;
  isVeryStale: boolean;
  label: string;
} {
  const [year, month] = dataMonth.split("-").map(Number);
  // dataMonthの末日を基準日とする
  const dataDate = new Date(year, month, 0); // month=1-based → month番目の0日 = 前月末日
  const now = new Date();
  const daysOld = Math.floor((now.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24));

  return {
    daysOld: Math.max(0, daysOld),
    isStale: daysOld > 30,
    isVeryStale: daysOld > 60,
    label: `${year}年${month}月時点`,
  };
}

export function isStale(source: DataSource, thresholdDays = 30): boolean {
  if (!source.dataMonth) return false;
  return getDataFreshness(source.dataMonth).daysOld > thresholdDays;
}

/** ページの全ソースのうち、最も新しいdataMonthを返す */
export function getPageDataMonth(pageId: string): string | null {
  const sources = getSourcesForPage(pageId);
  const months = sources.map((s) => s.dataMonth).filter(Boolean) as string[];
  if (months.length === 0) return null;
  return months.sort().reverse()[0];
}

/** 信頼度の集計: ページ内ソースのconfidence分布を返す */
export function getPageConfidenceBreakdown(pageId: string): Record<ConfidenceLevel, number> {
  const sources = getSourcesForPage(pageId);
  const counts: Record<ConfidenceLevel, number> = { official: 0, verified: 0, estimated: 0, ai_survey: 0 };
  for (const s of sources) {
    counts[s.confidence]++;
  }
  return counts;
}
