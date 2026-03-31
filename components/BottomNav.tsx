"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const BOTTOM_NAV_ITEMS = [
  {
    label: "ホーム",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    href: "/",
  },
  {
    label: "進捗",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    href: "/progress",
  },
  {
    label: "レポート",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    href: "/finops",
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="block sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--color-border)]"
      style={{ height: 56 }}
    >
      <div className="flex h-full">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 no-underline"
              style={{
                color: isActive ? "var(--color-brand-primary)" : "var(--color-text-muted)",
                minHeight: 44,
              }}
            >
              {item.icon}
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: "inherit" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
