"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "./actions";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "ダッシュボード", href: "/admin" },
  { label: "ニュースレター", href: "/admin/newsletter" },
  { label: "購読者", href: "/admin/newsletter/subscribers" },
  { label: "アナリティクス", href: "/admin/analytics" },
  { label: "設定", href: "/admin/settings" },
  { label: "NL設定", href: "/admin/newsletter/config" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname === '/admin/login') return null;

  function isActive(href: string): boolean {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  return (
    <>
    <header
      style={{
        height: 48,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* 左: ロゴ */}
        <Link
          href="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            marginRight: 20,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: "var(--color-brand-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            GC
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            GCInsight
          </span>
        </Link>

        {/* 中央: ナビリンク (768px以上のみ表示) */}
        <nav className="hidden md:flex" style={{ alignItems: "center", gap: 0, flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "0 12px",
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--color-text-primary)" : "#6b7280",
                  textDecoration: "none",
                  borderBottom: active ? "2px solid var(--color-text-primary)" : "2px solid transparent",
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* スペーサー (モバイル) */}
        <div className="flex md:hidden" style={{ flex: 1 }} />

        {/* 右: 書くボタン + ログアウト (768px以上のみ) */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Link
            href="/admin/newsletter/compose"
            style={{
              backgroundColor: "var(--color-text-primary)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 8,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            新しいメールを書く
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#6b7280",
                padding: "4px 0",
              }}
            >
              ログアウト
            </button>
          </form>
        </div>

        {/* ハンバーガーボタン (768px未満のみ) */}
        <button
          className="flex md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: 20,
            color: "#374151",
            flexShrink: 0,
          }}
          aria-label="メニュー"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>

    {/* モバイルメニュー */}
    {menuOpen && (
      <div
        className="md:hidden"
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          position: "sticky",
          top: 48,
          zIndex: 99,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--color-text-primary)" : "#6b7280",
                textDecoration: "none",
                borderLeft: active ? "3px solid var(--color-text-primary)" : "3px solid transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 12 }}>
          <Link
            href="/admin/newsletter/compose"
            onClick={() => setMenuOpen(false)}
            style={{
              backgroundColor: "var(--color-text-primary)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            新しいメールを書く
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                color: "#6b7280",
                padding: "6px 0",
              }}
            >
              ログアウト
            </button>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
