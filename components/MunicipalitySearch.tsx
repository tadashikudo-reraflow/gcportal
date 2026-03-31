"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Municipality, MunicipalityPackageRow, Vendor, Package } from "@/lib/supabase";

const NAVY = "#00338D";

// クラウドバッジの色設定（BusinessPackageList と統一）
function getCloudBadgeStyle(
  platform: string | null,
  confirmed: boolean
): { bg: string; text: string } | null {
  const base: Record<string, { bg: string; text: string }> = {
    AWS:    { bg: "#ff9900", text: "#fff" },
    GCP:    { bg: "#1a73e8", text: "#fff" },
    Azure:  { bg: "#00b4ff", text: "#fff" },
    OCI:    { bg: "#b91c1c", text: "#fff" },
    Sakura: { bg: "#be185d", text: "#fff" },
  };
  if (!platform || !base[platform]) return null;
  const style = base[platform];
  if (!confirmed) return { bg: style.bg + "99", text: "#fff" };
  return style;
}

type PackageWithVendor = Package & { vendors?: Vendor };
type RowWithPackage = MunicipalityPackageRow & { packages?: PackageWithVendor };

type Props = {
  municipalities: Municipality[];
  packagesByMunicipality: Record<number, RowWithPackage[]>;
};

export default function MunicipalitySearch({
  municipalities,
  packagesByMunicipality,
}: Props) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // オートコンプリート候補（最大10件）
  const suggestions = query.trim().length >= 1
    ? municipalities
        .filter((m) => {
          const full = `${m.prefecture}${m.city}`;
          const q = query.trim();
          return full.includes(q) || m.city.includes(q) || m.prefecture.includes(q);
        })
        .slice(0, 10)
    : [];

  // コンテナ外クリックでドロップダウンを閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((m: Municipality) => {
    setQuery(`${m.prefecture} ${m.city}`);
    setSelectedMunicipality(m);
    setShowSuggestions(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedMunicipality(null);
    setShowSuggestions(true);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedMunicipality(null);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 選択中の自治体のパッケージ行
  const rows: RowWithPackage[] = selectedMunicipality
    ? (packagesByMunicipality[selectedMunicipality.id] ?? [])
    : [];

  // 確認済み / 未確認で分類
  const confirmedRows = rows.filter((r) => r.confidence === "confirmed");
  const unconfirmedRows = rows.filter((r) => r.confidence !== "confirmed");

  return (
    <div className="card p-5">
      {/* セクションヘッダー */}
      <h2
        className="text-sm font-bold mb-4 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="w-1 h-5 rounded-full inline-block flex-shrink-0"
          style={{ backgroundColor: "var(--color-gov-primary)" }}
        />
        自治体名から導入パッケージを検索
      </h2>

      {/* 検索ボックス */}
      <div ref={containerRef} className="relative mb-4">
        <div className="relative flex items-center">
          <span className="absolute left-3 text-gray-400 pointer-events-none" aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.trim().length >= 1 && setShowSuggestions(true)}
            placeholder="例：千葉市、川崎市、北海道など"
            autoComplete="off"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border text-sm outline-none transition-colors"
            style={{
              fontSize: 16, /* iOS Safariズーム防止 */
              borderColor: showSuggestions ? NAVY : "var(--color-border)",
              boxShadow: showSuggestions ? `0 0 0 2px ${NAVY}20` : "none",
              color: "var(--color-text-primary)",
              backgroundColor: "#fff",
            }}
            aria-label="自治体名を入力"
            aria-autocomplete="list"
            aria-expanded={showSuggestions && suggestions.length > 0}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="クリア"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* オートコンプリートドロップダウン */}
        {showSuggestions && suggestions.length > 0 && (
          <ul
            className="absolute z-20 w-full mt-1 rounded-lg border bg-white shadow-lg overflow-hidden"
            style={{ borderColor: "var(--color-border)" }}
            role="listbox"
          >
            {suggestions.map((m) => (
              <li key={m.id} role="option" aria-selected={selectedMunicipality?.id === m.id}>
                <button
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
                  onMouseDown={(e) => {
                    e.preventDefault(); // blur前に選択確定
                    handleSelect(m);
                  }}
                >
                  <span className="text-gray-400 text-xs">{m.prefecture}</span>
                  <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {m.city}
                  </span>
                  {m.size_category && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                      {m.size_category}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 候補なし */}
        {showSuggestions && query.trim().length >= 1 && suggestions.length === 0 && (
          <div
            className="absolute z-20 w-full mt-1 rounded-lg border bg-white shadow-lg px-4 py-3 text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
          >
            一致する自治体が見つかりません
          </div>
        )}
      </div>

      {/* 検索結果エリア */}
      {selectedMunicipality && (
        <div>
          {/* 自治体名ヘッダー */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: NAVY + "10", color: NAVY }}>
              {selectedMunicipality.prefecture}
            </span>
            <span className="font-bold" style={{ color: "var(--color-text-primary)" }}>
              {selectedMunicipality.city}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--color-text-muted)" }}>
              {rows.length > 0 ? `${rows.length}件のパッケージ情報` : ""}
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--color-text-muted)" }}>
              この自治体の導入情報はまだ登録されていません
            </p>
          ) : (
            <div className="space-y-4">
              {/* 確認済みデータ */}
              {confirmedRows.length > 0 && (
                <PackageTable
                  rows={confirmedRows}
                  label="確認済み（公式出典）"
                  labelColor="#166534"
                  labelBg="#d1fae5"
                />
              )}

              {/* 未確認データ */}
              {unconfirmedRows.length > 0 && (
                <PackageTable
                  rows={unconfirmedRows}
                  label="未確認・調査中"
                  labelColor="#92400e"
                  labelBg="#fef3c7"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* 未選択時のヒント */}
      {!selectedMunicipality && !query && (
        <p className="text-xs text-center py-2" style={{ color: "var(--color-text-muted)" }}>
          自治体名を入力して、導入パッケージ・ベンダーを確認できます
        </p>
      )}
    </div>
  );
}

// パッケージ一覧テーブル（確認済み/未確認共通）
function PackageTable({
  rows,
  label,
  labelColor,
  labelBg,
}: {
  rows: RowWithPackage[];
  label: string;
  labelColor: string;
  labelBg: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ backgroundColor: labelBg, color: labelColor }}
        >
          {label}
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {rows.length}件
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col style={{ width: "auto" }} />
            <col style={{ width: "6rem" }} />
            <col style={{ width: "5.5rem" }} />
            <col style={{ width: "4.5rem" }} />
          </colgroup>
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
              <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>パッケージ名</th>
              <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>ベンダー</th>
              <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>クラウド</th>
              <th className="text-left py-2 px-3 text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>業務</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const pkg = row.packages;
              const vendor = pkg?.vendors;
              const platform = vendor?.cloud_platform ?? null;
              const confirmed = vendor?.cloud_confirmed ?? false;
              const badgeStyle = getCloudBadgeStyle(platform, confirmed);
              return (
                <tr
                  key={row.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <td className="py-2 px-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {pkg?.package_name ?? "—"}
                  </td>
                  <td className="py-2 px-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {vendor?.short_name ?? vendor?.name ?? "不明"}
                  </td>
                  <td className="py-2 px-3">
                    {badgeStyle ? (
                      <span
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.text }}
                      >
                        {platform}
                        {!confirmed && (
                          <span className="opacity-80 text-xs ml-0.5">未確認</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>調査中</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {row.business ?? pkg?.business ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
