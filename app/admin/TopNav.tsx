"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "./actions";

type NavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "ダッシュボード", href: "/admin" },
  { label: "ニュースレター", href: "/admin/newsletter" },
  { label: "購読者", href: "/admin/newsletter/subscribers" },
  { label: "ヒートマップ", href: "/admin/heatmap" },
  { label: "設定", href: "/admin/settings" },
  { label: "NL設定", href: "/admin/newsletter/config" },
];

export default function TopNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  return (
    <header
      style={{
        height: 56,
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 24px",
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
            marginRight: 32,
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
              fontSize: 15,
              color: "var(--color-text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            GCInsight
          </span>
        </Link>

        {/* 中央: ナビリンク */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            flex: 1,
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: "0 16px",
                  height: 56,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--color-text-primary)" : "#6b7280",
                  textDecoration: "none",
                  borderBottom: active ? "2px solid var(--color-text-primary)" : "2px solid transparent",
                  transition: "color 0.15s",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 右: 書くボタン + ログアウト */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
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
      </div>
    </header>
  );
}
