"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

// 目的別ナビゲーション構造
const NAV_GROUPS = [
  {
    label: "ホーム",
    short: "TOP",
    href: "/",
  },
  {
    label: "自治体を調べる",
    short: "調べる",
    children: [
      { href: "/businesses", label: "業務別の進捗を見る", desc: "20業務ごとの完了率" },
      { href: "/benchmark",  label: "自治体同士を比較する", desc: "人口帯・地域別の比較" },
      { href: "/timeline",   label: "スケジュールを確認", desc: "移行タイムライン" },
    ],
  },
  {
    label: "リスクを把握する",
    short: "リスク",
    children: [
      { href: "/risks",   label: "遅延リスク自治体一覧", desc: "完了率50%未満の自治体" },
      { href: "/tokutei", label: "期限延長が認められた「特定移行」", desc: "935団体の認定状況" },
    ],
  },
  {
    label: "コスト・ベンダー",
    short: "コスト",
    children: [
      { href: "/packages", label: "導入パッケージ一覧", desc: "ベンダー別の採用状況" },
      { href: "/costs",    label: "コスト増の要因を分析", desc: "ベンダー別コスト比較" },
      { href: "/cloud",    label: "クラウド基盤の内訳", desc: "AWS/Azure/GCP/OCI/さくら" },
    ],
  },
  {
    label: "インサイト",
    short: "記事",
    children: [
      { href: "/articles", label: "コラム・解説記事", desc: "移行のヒントと用語解説" },
      { href: "/report",   label: "無料レポート（PDF）", desc: "全体サマリーをダウンロード" },
      { href: "/sources",  label: "データソース・出典", desc: "参照元の一覧" },
    ],
  },
] as const;

type NavGroup = (typeof NAV_GROUPS)[number];

function isGroupWithChildren(g: NavGroup): g is NavGroup & { children: ReadonlyArray<{ href: string; label: string; desc: string }> } {
  return "children" in g;
}

export default function NavBar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; maxLeft: number } | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // ドロップダウン位置を計算
  const updateDropdownPos = useCallback((label: string) => {
    const btn = buttonRefs.current[label];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const btnRect = btn.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    setDropdownPos({
      left: btnRect.left - navRect.left,
      maxLeft: navRect.width - 280, // min-width: 280px
    });
  }, []);

  // 外部クリック + Escapeで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenGroup(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // パス変更で閉じる
  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  function isGroupActive(g: NavGroup): boolean {
    if ("href" in g && !("children" in g)) {
      return pathname === g.href;
    }
    if (isGroupWithChildren(g)) {
      return g.children.some((c) => pathname.startsWith(c.href));
    }
    return false;
  }

  // 開いているグループのchildrenを取得
  const openGroupData = openGroup
    ? NAV_GROUPS.find((g) => g.label === openGroup && isGroupWithChildren(g))
    : null;
  const openChildren = openGroupData && isGroupWithChildren(openGroupData)
    ? openGroupData.children
    : null;

  return (
    <nav style={{ backgroundColor: "var(--color-gov-nav)" }} ref={navRef}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 relative">
        {/* スクロール可能なボタン列 */}
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none nav-scroll-snap">
          {NAV_GROUPS.map((group) => {
            const active = isGroupActive(group);

            // 単独リンク（ホーム）
            if (!isGroupWithChildren(group) && "href" in group) {
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  className={`nav-link nav-touch-target whitespace-nowrap flex-shrink-0 ${active ? "nav-link-active" : ""}`}
                >
                  <span className="hidden sm:inline">{group.label}</span>
                  <span className="sm:hidden">{group.short}</span>
                </Link>
              );
            }

            // ドロップダウンボタン（ドロップダウン本体はスクロールコンテナ外にレンダリング）
            if (isGroupWithChildren(group)) {
              const isOpen = openGroup === group.label;
              return (
                <button
                  key={group.label}
                  ref={(el) => { buttonRefs.current[group.label] = el; }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isOpen) {
                      setOpenGroup(null);
                    } else {
                      setOpenGroup(group.label);
                      updateDropdownPos(group.label);
                    }
                  }}
                  className={`nav-link nav-touch-target whitespace-nowrap flex items-center gap-1 flex-shrink-0 ${active ? "nav-link-active" : ""}`}
                  style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
                >
                  <span className="hidden sm:inline">{group.label}</span>
                  <span className="sm:hidden">{group.short}</span>
                  <svg
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              );
            }
            return null;
          })}
        </div>
        <div className="nav-fade-hint sm:hidden" aria-hidden="true" />

        {/* ドロップダウン: overflow-x-autoコンテナの外側 */}
        {openChildren && (
          <div
            className="nav-dropdown"
            style={dropdownPos ? { left: Math.max(0, Math.min(dropdownPos.left, dropdownPos.maxLeft)) } : undefined}
          >
            {openChildren.map((child) => {
              const childActive = pathname.startsWith(child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`nav-dropdown-item ${childActive ? "nav-dropdown-item-active" : ""}`}
                >
                  <span className="nav-dropdown-label">{child.label}</span>
                  <span className="nav-dropdown-desc">{child.desc}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
