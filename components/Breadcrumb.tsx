import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type Props = {
  items: BreadcrumbItem[];
};

const BASE_URL = "https://gcinsight.jp";

export default function Breadcrumb({ items }: Props) {
  // BreadcrumbList 構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "ホーム",
        item: BASE_URL,
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.label,
        ...(item.href ? { item: `${BASE_URL}${item.href}` } : {}),
      })),
    ],
  };

  return (
    <nav aria-label="パンくずリスト" className="mb-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
