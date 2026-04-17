"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen } from "lucide-react";

const NAV_ITEMS = [
  { label: "ホーム", icon: <Home size={20} />, href: "/karte" },
  { label: "解説記事", icon: <BookOpen size={20} />, href: "/karte/articles" },
];

export default function KarteBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="block sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[var(--color-border)]"
      style={{ height: 56 }}
    >
      <div className="flex h-full">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/karte" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 no-underline"
              style={{ color: isActive ? "#2e7d32" : "var(--color-text-muted)", minHeight: 44 }}
            >
              {item.icon}
              <span className="text-[10px] font-medium leading-none" style={{ color: "inherit" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
