"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "ダッシュボード", href: "/admin", icon: "&#128202;" },
  { label: "記事一覧", href: "/admin/articles", icon: "&#128221;" },
  { label: "新規追加", href: "/admin/articles/new", icon: "&#9999;&#65039;" },
  { label: "カテゴリー", href: "/admin/categories", icon: "&#128193;" },
  { label: "スケジュール", href: "/admin/schedule", icon: "&#128197;" },
  { label: "設定", href: "/admin/settings", icon: "&#128295;" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={
              active
                ? {
                    backgroundColor: "rgba(245,181,0,0.15)",
                    color: "#F5B500",
                  }
                : {
                    color: "rgba(255,255,255,0.75)",
                  }
            }
          >
            <span
              className="text-base leading-none"
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
            <span>{item.label}</span>
            {active && (
              <span
                className="ml-auto w-1 h-4 rounded-full"
                style={{ backgroundColor: "#F5B500" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
