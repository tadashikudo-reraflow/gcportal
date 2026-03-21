"use client";

import { useState, useMemo } from "react";

// --- Types ---

export type MunicipalityPackageRow = {
  id: number;
  municipality_id: number;
  package_id: number;
  business: string | null;
  adoption_year: number | null;
  source: string | null;
  confidence: string;
  municipalities: {
    prefecture: string;
    city: string;
    overall_rate: number | null;
  } | null;
  packages: {
    package_name: string;
    vendors: {
      name: string;
      short_name: string | null;
      cloud_platform: string | null;
      cloud_confirmed: boolean;
    } | null;
  } | null;
};

export type VendorRow = {
  id: number;
  name: string;
  short_name: string | null;
  cloud_platform: string | null;
  cloud_confirmed: boolean;
  multitenancy: boolean;
  municipality_count: number | null;
};

// --- Constants ---

const SEIREI_CITIES = new Set([
  "札幌市", "仙台市", "さいたま市", "千葉市", "横浜市", "川崎市", "相模原市",
  "新潟市", "静岡市", "浜松市", "名古屋市", "京都市", "大阪市", "堺市",
  "神戸市", "岡山市", "広島市", "北九州市", "福岡市", "熊本市",
]);

const CHUKAKU_CITIES = new Set([
  "旭川市", "函館市", "青森市", "八戸市", "盛岡市", "秋田市", "山形市",
  "福島市", "郡山市", "いわき市", "水戸市", "宇都宮市", "前橋市", "高崎市",
  "川越市", "越谷市", "川口市", "船橋市", "柏市", "八王子市", "横須賀市",
  "富山市", "金沢市", "福井市", "甲府市", "長野市", "松本市", "岐阜市",
  "豊橋市", "岡崎市", "豊田市", "一宮市", "春日井市", "大津市", "豊中市",
  "吹田市", "高槻市", "枚方市", "東大阪市", "姫路市", "尼崎市", "西宮市",
  "明石市", "奈良市", "和歌山市", "鳥取市", "松江市", "倉敷市", "呉市",
  "福山市", "下関市", "高松市", "松山市", "高知市", "久留米市", "長崎市",
  "佐世保市", "大分市", "宮崎市", "鹿児島市", "那覇市",
]);

const SHIKOU_TOKUREI_CITIES = new Set([
  "つくば市", "伊勢崎市", "太田市", "熊谷市", "所沢市", "春日部市",
  "草加市", "平塚市", "厚木市", "大和市", "小田原市", "茅ヶ崎市",
  "富士市", "沼津市", "四日市市", "岸和田市", "茨木市", "八尾市",
  "寝屋川市", "加古川市", "宝塚市", "長岡市", "上越市",
]);

type SizeCategory = "政令指定都市" | "中核市" | "施行時特例市" | "その他の市区町村";

function classifyCity(cityName: string): SizeCategory {
  if (SEIREI_CITIES.has(cityName)) return "政令指定都市";
  if (CHUKAKU_CITIES.has(cityName)) return "中核市";
  if (SHIKOU_TOKUREI_CITIES.has(cityName)) return "施行時特例市";
  return "その他の市区町村";
}

const SIZE_ORDER: SizeCategory[] = [
  "政令指定都市",
  "中核市",
  "施行時特例市",
  "その他の市区町村",
];

const CLOUD_COLORS: Record<string, { bg: string; text: string }> = {
  AWS:    { bg: "#ff9900", text: "#fff" },
  GCP:    { bg: "#1a73e8", text: "#fff" },
  Azure:  { bg: "#00b4ff", text: "#fff" },
  OCI:    { bg: "#c8102e", text: "#fff" },
  Sakura: { bg: "#e91e8c", text: "#fff" },
};

function cloudBadge(platform: string | null, confirmed: boolean) {
  if (!platform) return { bg: "#9ca3af", text: "#fff" };
  const c = CLOUD_COLORS[platform] ?? { bg: "#9ca3af", text: "#fff" };
  return confirmed ? c : { bg: c.bg + "88", text: "#fff" };
}

function confidenceBadge(conf: string) {
  if (conf === "confirmed") return "bg-green-100 text-green-700";
  if (conf === "likely") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-500";
}

function confidenceLabel(conf: string) {
  if (conf === "confirmed") return "確認済み";
  if (conf === "likely") return "推定";
  return "不明";
}

function rateColor(rate: number | null): string {
  if (rate == null) return "text-gray-400";
  if (rate >= 0.9) return "text-green-600";
  if (rate >= 0.7) return "text-yellow-600";
  return "text-red-600";
}

function formatRate(rate: number | null): string {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

// --- Chevron Icon ---

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

// --- Structured data types ---

type MunicipalityGroup = {
  key: string; // "prefecture|city"
  prefecture: string;
  city: string;
  overallRate: number | null;
  rows: MunicipalityPackageRow[];
};

type CategoryGroup = {
  category: SizeCategory;
  municipalities: MunicipalityGroup[];
  avgRate: number | null;
};

type BusinessVendorSummary = {
  business: string;
  vendors: {
    vendorName: string;
    cloudPlatform: string | null;
    cloudConfirmed: boolean;
    count: number;
    municipalities: string[];
  }[];
  totalCount: number;
};

// --- Component ---

export default function AdoptionExplorer({
  rows,
  vendors,
}: {
  rows: MunicipalityPackageRow[];
  vendors: VendorRow[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedMunicipalities, setExpandedMunicipalities] = useState<Set<string>>(new Set());
  const [expandedBusinesses, setExpandedBusinesses] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"municipality" | "business">("municipality");

  // Filter rows by search
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter((r) => {
      const city = r.municipalities?.city?.toLowerCase() ?? "";
      const pref = r.municipalities?.prefecture?.toLowerCase() ?? "";
      const vendor = (r.packages?.vendors?.short_name ?? r.packages?.vendors?.name ?? "").toLowerCase();
      const pkg = r.packages?.package_name?.toLowerCase() ?? "";
      const biz = r.business?.toLowerCase() ?? "";
      return city.includes(q) || pref.includes(q) || vendor.includes(q) || pkg.includes(q) || biz.includes(q);
    });
  }, [rows, searchQuery]);

  // Build category hierarchy
  const categoryGroups = useMemo((): CategoryGroup[] => {
    // Group by municipality
    const muniMap = new Map<string, MunicipalityGroup>();
    for (const row of filteredRows) {
      const city = row.municipalities?.city ?? `ID:${row.municipality_id}`;
      const pref = row.municipalities?.prefecture ?? "不明";
      const key = `${pref}|${city}`;
      if (!muniMap.has(key)) {
        muniMap.set(key, {
          key,
          prefecture: pref,
          city,
          overallRate: row.municipalities?.overall_rate ?? null,
          rows: [],
        });
      }
      muniMap.get(key)!.rows.push(row);
    }

    // Group municipalities by size category
    const catMap = new Map<SizeCategory, MunicipalityGroup[]>();
    for (const cat of SIZE_ORDER) catMap.set(cat, []);

    for (const muni of muniMap.values()) {
      const cat = classifyCity(muni.city);
      catMap.get(cat)!.push(muni);
    }

    // Sort municipalities within each category by prefecture then city name
    for (const munis of catMap.values()) {
      munis.sort((a, b) => a.prefecture.localeCompare(b.prefecture) || a.city.localeCompare(b.city));
    }

    return SIZE_ORDER.map((cat): CategoryGroup => {
      const munis = catMap.get(cat)!;
      const rates = munis.map((m) => m.overallRate).filter((r): r is number => r != null);
      const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
      return { category: cat, municipalities: munis, avgRate };
    }).filter((g) => g.municipalities.length > 0);
  }, [filteredRows]);

  // Build business-vendor summary
  const businessSummaries = useMemo((): BusinessVendorSummary[] => {
    const bizMap = new Map<string, Map<string, {
      vendorName: string;
      cloudPlatform: string | null;
      cloudConfirmed: boolean;
      municipalities: Set<string>;
    }>>();

    for (const row of filteredRows) {
      const biz = row.business ?? "不明";
      const vendorName = row.packages?.vendors?.short_name ?? row.packages?.vendors?.name ?? "不明";

      if (!bizMap.has(biz)) bizMap.set(biz, new Map());
      const vendorMap = bizMap.get(biz)!;

      if (!vendorMap.has(vendorName)) {
        vendorMap.set(vendorName, {
          vendorName,
          cloudPlatform: row.packages?.vendors?.cloud_platform ?? null,
          cloudConfirmed: row.packages?.vendors?.cloud_confirmed ?? false,
          municipalities: new Set(),
        });
      }
      const city = row.municipalities?.city ?? `ID:${row.municipality_id}`;
      vendorMap.get(vendorName)!.municipalities.add(city);
    }

    return Array.from(bizMap.entries())
      .map(([biz, vendorMap]) => {
        const vendorsList = Array.from(vendorMap.values())
          .map((v) => ({
            vendorName: v.vendorName,
            cloudPlatform: v.cloudPlatform,
            cloudConfirmed: v.cloudConfirmed,
            count: v.municipalities.size,
            municipalities: Array.from(v.municipalities).sort(),
          }))
          .sort((a, b) => b.count - a.count);

        return {
          business: biz,
          vendors: vendorsList,
          totalCount: vendorsList.reduce((sum, v) => sum + v.count, 0),
        };
      })
      .sort((a, b) => a.business.localeCompare(b.business));
  }, [filteredRows]);

  // Toggle helpers
  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleMunicipality = (key: string) => {
    setExpandedMunicipalities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleBusiness = (biz: string) => {
    setExpandedBusinesses((prev) => {
      const next = new Set(prev);
      if (next.has(biz)) next.delete(biz);
      else next.add(biz);
      return next;
    });
  };

  // Unique municipality count
  const uniqueMuniCount = useMemo(() => {
    const set = new Set<string>();
    for (const row of filteredRows) {
      const city = row.municipalities?.city ?? `ID:${row.municipality_id}`;
      set.add(city);
    }
    return set.size;
  }, [filteredRows]);

  const uniqueVendorCount = useMemo(() => {
    const set = new Set<string>();
    for (const row of filteredRows) {
      const v = row.packages?.vendors?.short_name ?? row.packages?.vendors?.name;
      if (v) set.add(v);
    }
    return set.size;
  }, [filteredRows]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="自治体名、ベンダー名、業務名で検索..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": "#002D72" } as React.CSSProperties}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredRows.length} 件の導入実績（{uniqueMuniCount} 自治体）が見つかりました
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold" style={{ color: "#002D72" }}>{filteredRows.length}</p>
          <p className="text-xs text-gray-500 mt-1">導入実績件数</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold" style={{ color: "#002D72" }}>{uniqueMuniCount}</p>
          <p className="text-xs text-gray-500 mt-1">調査済み自治体</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-green-600">
            {filteredRows.filter((r) => r.confidence === "confirmed").length}
          </p>
          <p className="text-xs text-gray-500 mt-1">確認済み</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-gray-800">{uniqueVendorCount}</p>
          <p className="text-xs text-gray-500 mt-1">対応ベンダー</p>
        </div>
      </div>

      {filteredRows.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-700 font-medium">
            {searchQuery ? "該当するデータが見つかりません" : "データ収集中です"}
          </p>
          <p className="text-yellow-600 text-sm mt-1">
            {searchQuery ? "検索条件を変更してください" : "順次追加されます。"}
          </p>
        </div>
      )}

      {/* Tab switcher */}
      {filteredRows.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("municipality")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "municipality"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            自治体規模別
          </button>
          <button
            onClick={() => setActiveTab("business")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === "business"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            業務別ベンダーシェア
          </button>
        </div>
      )}

      {/* Municipality-size hierarchy view */}
      {activeTab === "municipality" && filteredRows.length > 0 && (
        <div className="space-y-3">
          {categoryGroups.map((group) => {
            const isExpanded = expandedCategories.has(group.category);
            return (
              <div
                key={group.category}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronIcon open={isExpanded} />
                    <h2 className="text-base font-bold text-gray-800">{group.category}</h2>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: "#002D72" }}
                    >
                      {group.municipalities.length} 自治体
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {group.avgRate != null && (
                      <span>
                        平均移行率:{" "}
                        <span className={`font-bold ${rateColor(group.avgRate)}`}>
                          {formatRate(group.avgRate)}
                        </span>
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded: list of municipalities */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {group.municipalities.map((muni) => {
                      const isMuniExpanded = expandedMunicipalities.has(muni.key);
                      const confirmedCount = muni.rows.filter((r) => r.confidence === "confirmed").length;
                      return (
                        <div key={muni.key} className="border-b border-gray-50 last:border-b-0">
                          {/* Municipality header */}
                          <button
                            onClick={() => toggleMunicipality(muni.key)}
                            className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronIcon open={isMuniExpanded} />
                              <span className="text-xs text-gray-400">{muni.prefecture}</span>
                              <span className="text-sm font-semibold text-gray-800">{muni.city}</span>
                              <span className="text-xs text-gray-400">
                                {muni.rows.length} 業務
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {muni.overallRate != null && (
                                <span className={`text-sm font-bold ${rateColor(muni.overallRate)}`}>
                                  {formatRate(muni.overallRate)}
                                </span>
                              )}
                              <span className="text-xs text-gray-400">
                                確認済み {confirmedCount}/{muni.rows.length}
                              </span>
                            </div>
                          </button>

                          {/* Municipality detail table */}
                          {isMuniExpanded && (
                            <div className="px-6 pb-3 overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">業務</th>
                                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">ベンダー</th>
                                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">パッケージ</th>
                                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">クラウド</th>
                                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">採用年度</th>
                                    <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">確信度</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {muni.rows.map((row) => {
                                    const vendor = row.packages?.vendors;
                                    const badge = cloudBadge(
                                      vendor?.cloud_platform ?? null,
                                      vendor?.cloud_confirmed ?? false
                                    );
                                    return (
                                      <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-2 px-3 text-gray-700 text-xs font-medium">
                                          {row.business ?? "—"}
                                        </td>
                                        <td className="py-2 px-3 text-gray-800 text-xs">
                                          {vendor?.short_name ?? vendor?.name ?? "—"}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600 text-xs">
                                          {row.packages?.package_name ?? "—"}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                            style={{ backgroundColor: badge.bg, color: badge.text }}
                                          >
                                            {vendor?.cloud_platform ?? "不明"}
                                            {vendor?.cloud_platform && !vendor?.cloud_confirmed && (
                                              <span className="opacity-75 ml-0.5">?</span>
                                            )}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-gray-500 text-xs">
                                          {row.adoption_year ? `${row.adoption_year}年度` : "—"}
                                        </td>
                                        <td className="py-2 px-3">
                                          <span
                                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${confidenceBadge(
                                              row.confidence
                                            )}`}
                                          >
                                            {confidenceLabel(row.confidence)}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Business-vendor share view */}
      {activeTab === "business" && filteredRows.length > 0 && (
        <div className="space-y-3">
          {businessSummaries.map((biz) => {
            const isExpanded = expandedBusinesses.has(biz.business);
            // Top vendor
            const topVendor = biz.vendors[0];
            const topShare = topVendor ? ((topVendor.count / biz.totalCount) * 100).toFixed(0) : "0";
            return (
              <div
                key={biz.business}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => toggleBusiness(biz.business)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronIcon open={isExpanded} />
                    <h3 className="text-sm font-bold text-gray-800">{biz.business}</h3>
                    <span className="text-xs text-gray-400">
                      {biz.vendors.length} ベンダー / {biz.totalCount} 自治体
                    </span>
                  </div>
                  {topVendor && (
                    <div className="text-xs text-gray-500">
                      最多: <span className="font-semibold text-gray-700">{topVendor.vendorName}</span>
                      <span className="ml-1">({topShare}%)</span>
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    {/* Share bar chart */}
                    <div className="space-y-2 mb-3">
                      {biz.vendors.map((v) => {
                        const share = (v.count / biz.totalCount) * 100;
                        const badge = cloudBadge(v.cloudPlatform, v.cloudConfirmed);
                        return (
                          <div key={v.vendorName} className="flex items-center gap-3">
                            <span className="text-xs text-gray-700 w-24 flex-shrink-0 truncate" title={v.vendorName}>
                              {v.vendorName}
                            </span>
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                              style={{ backgroundColor: badge.bg, color: badge.text }}
                            >
                              {v.cloudPlatform ?? "?"}
                            </span>
                            <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${share}%`,
                                  backgroundColor: "#002D72",
                                  minWidth: share > 0 ? "4px" : "0",
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-700 w-16 text-right flex-shrink-0">
                              {v.count} ({share.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Municipality list per vendor */}
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer hover:text-gray-700 py-1">
                        導入自治体一覧を表示
                      </summary>
                      <div className="mt-2 space-y-2">
                        {biz.vendors.map((v) => (
                          <div key={v.vendorName}>
                            <span className="font-semibold text-gray-700">{v.vendorName}</span>
                            <span className="text-gray-400 ml-1">({v.count})</span>
                            <p className="text-gray-500 mt-0.5 leading-relaxed">
                              {v.municipalities.join("、")}
                            </p>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
