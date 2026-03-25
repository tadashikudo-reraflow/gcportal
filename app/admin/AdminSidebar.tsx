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
  { label: "ニュースレター", href: "/admin/newsletter", icon: "&#128140;" },
  { label: "購読者", href: "/admin/newsletter/subscribers", icon: "&#128101;" },
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
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={
              active
                ? {
                    backgroundColor: "#eef2fa",
                    color: "#002D72",
                    borderLeft: "3px solid #002D72",
                    paddingLeft: "9px",
                  }
                : {
                    color: "#6b7280",
                    borderLeft: "3px solid transparent",
                    paddingLeft: "9px",
                  }
            }
          >
            <span
              className="text-base leading-none"
              dangerouslySetInnerHTML={{ __html: item.icon }}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
