"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",             label: "ダッシュボード", short: "TOP"   },
  { href: "/businesses",   label: "業務別",         short: "業務"   },
  { href: "/risks",        label: "遅延リスク",     short: "リスク" },
  { href: "/tokutei",      label: "特定移行認定",   short: "特定移行" },
  { href: "/packages",     label: "パッケージ一覧", short: "PKG"   },
  { href: "/adoption",     label: "導入実績",       short: "導入"   },
  { href: "/costs",        label: "コスト効果",     short: "コスト" },
  { href: "/cloud",        label: "クラウド基盤",   short: "Cloud"  },
  { href: "/benchmark",   label: "ベンチマーク",   short: "比較"   },
  { href: "/timeline",    label: "スケジュール",   short: "日程"   },
  { href: "/compare",     label: "自治体比較",     short: "比較2"  },
  { href: "/report",      label: "無料レポート",   short: "PDF"    },
  { href: "/articles",     label: "コラム・解説",   short: "記事"   },
{ href: "/sources",      label: "参照サイト",     short: "出典"   },
] as const;

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav style={{ backgroundColor: "var(--color-gov-nav)" }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map(({ href, label, short }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`nav-link whitespace-nowrap flex-shrink-0 ${isActive ? "nav-link-active" : ""}`}
              >
                {/* デスクトップ: フルラベル / モバイル: 短縮ラベル */}
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
