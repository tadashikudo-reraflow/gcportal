import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

export default function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="パンくずリスト" className="mb-4">
      <ol className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
        <li>
          <Link href="/" className="hover:underline" style={{ color: "var(--color-brand-primary)" }}>
            ホーム
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <span className="mx-1">/</span>
            {item.href ? (
              <Link href={item.href} className="hover:underline" style={{ color: "var(--color-brand-primary)" }}>
                {item.label}
              </Link>
            ) : (
              <span style={{ color: "var(--color-text-secondary)" }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
