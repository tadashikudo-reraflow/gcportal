"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/articles", label: "コラム・解説記事" },
  { href: "/members",  label: "会員限定レポート" },
];

export default function ContentTabNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b" style={{ borderColor: "var(--color-border)" }}>
      {TABS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="text-xs font-semibold px-4 py-2 -mb-px no-underline transition-colors"
            style={
              active
                ? { color: "var(--color-brand-primary)", borderBottom: "2px solid var(--color-brand-primary)" }
                : { color: "var(--color-text-secondary)", borderBottom: "2px solid transparent" }
            }
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
