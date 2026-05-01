"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, BookOpen } from "lucide-react";

const BOTTOM_NAV_ITEMS = [
  {
    label: "ホーム",
    icon: <Home size={20} />,
    href: "/",
  },
  {
    label: "進捗",
    icon: <Activity size={20} />,
    href: "/progress",
  },
  {
    label: "記事",
    icon: <BookOpen size={20} />,
    href: "/articles",
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
              className="flex-1 flex flex-col items-center justify-center gap-0.5 no-underline min-w-[44px]"
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
