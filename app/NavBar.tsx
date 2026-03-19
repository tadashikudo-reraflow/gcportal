"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",             label: "ダッシュボード" },
  { href: "/prefectures",  label: "都道府県別"     },
  { href: "/businesses",   label: "業務別"         },
  { href: "/risks",        label: "遅延リスク一覧" },
  { href: "/packages",     label: "パッケージ一覧" },
  { href: "/adoption",     label: "導入実績"       },
  { href: "/costs",        label: "コスト効果"     },
  { href: "/cloud",        label: "クラウド基盤"   },
] as const;

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={{ backgroundColor: "var(--color-gov-nav)" /* #003591 */ }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map(({ href, label }) => {
            // "/" は完全一致、それ以外は前方一致でactive判定
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link whitespace-nowrap flex-shrink-0 ${isActive ? "nav-link-active" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
