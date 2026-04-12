"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Menu, ChevronDown } from "lucide-react";

// 目的別ナビゲーション構造
const NAV_GROUPS = [
  {
    label: "ホーム",
    short: "TOP",
    href: "/",
  },
  {
    label: "コスト比較",
    short: "コスト",
    href: "/costs",
  },
  {
    label: "ガバクラ比較",
    short: "比較",
    href: "/cloud",
  },
  {
    label: "進捗",
    short: "進捗",
    href: "/progress",
  },
  {
    label: "調べる",
    short: "調べる",
    children: [
      { href: "/standards",  label: "標準仕様書", desc: "" },
      { href: "/packages",   label: "パッケージ", desc: "" },
      { href: "/timeline",   label: "スケジュール", desc: "" },
      { href: "/sources",    label: "出典", desc: "" },
      { href: "/disclosure", label: "開示請求", desc: "" },
    ],
  },
  { label: "コラム", short: "コラム", href: "/articles" },
  { label: "会員限定", short: "会員", href: "/members" },
] as const;

type NavGroup = (typeof NAV_GROUPS)[number];

function isGroupWithChildren(g: NavGroup): g is NavGroup & { children: ReadonlyArray<{ href: string; label: string; desc: string }> } {
  return "children" in g;
}

// モバイルドロワー用: 全ナビゲーション情報（セクション分け）
const DRAWER_SECTIONS = [
  {
    title: "メニュー",
    items: [
      { href: "/", label: "ホーム" },
    ],
  },
  {
    title: "コスト・比較",
    items: [
      { href: "/costs",    label: "コスト比較" },
      { href: "/cloud",    label: "ガバクラ比較" },
    ],
  },
  {
    title: "進捗",
    items: [
      { href: "/progress", label: "進捗ダッシュボード" },
    ],
  },
  {
    title: "調べる",
    items: [
      { href: "/standards",  label: "標準仕様書" },
      { href: "/packages",   label: "パッケージ" },
      { href: "/timeline",   label: "スケジュール" },
      { href: "/sources",    label: "出典" },
      { href: "/disclosure", label: "開示請求" },
    ],
  },
  {
    title: "その他",
    items: [
      { href: "/articles", label: "コラム" },
      { href: "/members",  label: "会員限定レポート" },
    ],
  },
];

function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  // ESCキーで閉じる
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      // スクロール禁止
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <>
      {/* オーバーレイ */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.2s ease",
        }}
      />
      {/* ドロワーパネル（左からスライド） */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ナビゲーションメニュー"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 51,
          width: "min(280px, 80vw)",
          backgroundColor: "#fff",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ドロワーヘッダー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--color-text-primary)" }}>
            メニュー
          </span>
          <button
            onClick={onClose}
            aria-label="メニューを閉じる"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
            }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* セクション一覧 */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          {DRAWER_SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 4 }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                  padding: "8px 16px 4px",
                }}
              >
                {section.title}
              </p>
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    style={{
                      display: "block",
                      padding: "10px 16px",
                      fontSize: "0.9375rem",
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? "var(--color-brand-secondary)" : "var(--color-text-primary)",
                      backgroundColor: isActive ? "rgba(0,51,141,0.06)" : "transparent",
                      textDecoration: "none",
                      borderLeft: isActive ? "3px solid var(--color-brand-secondary)" : "3px solid transparent",
                    }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; maxLeft: number } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // ドロップダウン位置を計算
  const updateDropdownPos = useCallback((label: string) => {
    const btn = buttonRefs.current[label];
    const inner = innerRef.current;
    if (!btn || !inner) return;
    const btnRect = btn.getBoundingClientRect();
    const innerRect = inner.getBoundingClientRect();
    setDropdownPos({
      left: btnRect.left - innerRect.left,
      maxLeft: innerRect.width - 280, // min-width: 280px
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
    setDrawerOpen(false);
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
    <>
      <nav style={{ backgroundColor: "var(--color-surface-container-low)" }} ref={navRef}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 relative flex items-center" ref={innerRef}>
          {/* ハンバーガーボタン（モバイルのみ） */}
          <button
            className="sm:hidden flex-shrink-0 flex items-center justify-center mr-1"
            style={{
              width: 40,
              height: 44,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
              WebkitTapHighlightColor: "transparent",
            }}
            aria-label="メニューを開く"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} aria-hidden="true" />
          </button>

          {/* スクロール可能なボタン列（デスクトップのみ表示） */}
          <div className="hidden sm:flex items-center gap-0 overflow-x-auto scrollbar-none nav-scroll-snap flex-1">
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
                    {group.label}
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
                    {group.label}
                    <ChevronDown size={10} strokeWidth={2.5} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                );
              }
              return null;
            })}
          </div>

          {/* モバイル: 現在ページ表示（オプション） */}
          <div className="sm:hidden flex-1" />

          <div className="sm:hidden nav-fade-hint" aria-hidden="true" />
        </div>

        {/* ドロップダウン: overflow-x-autoコンテナの外側 */}
        {openChildren && (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 relative">
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
                    {child.desc && <span className="nav-dropdown-desc">{child.desc}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* モバイルドロワー */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
      />
    </>
  );
}
