import Link from "next/link";

type NavCard = {
  href: string;
  badge: string;
  badgeStyle: { backgroundColor: string; color: string };
  title: string;
  desc: string;
};

const ALL_CARDS: NavCard[] = [
  {
    href: "/businesses",
    badge: "20業務",
    badgeStyle: { backgroundColor: "#DBEAFE", color: "#1D4ED8" },
    title: "業務別の進捗",
    desc: "住民記録・国民年金など業務ごとの移行率を確認",
  },
  {
    href: "/benchmark",
    badge: "比較",
    badgeStyle: { backgroundColor: "#D1FAE5", color: "#065F46" },
    title: "自治体を比較",
    desc: "人口帯・都道府県で類似団体をベンチマーク",
  },
  {
    href: "/risks",
    badge: "リスク",
    badgeStyle: { backgroundColor: "#FEE2E2", color: "#B91C1C" },
    title: "遅延リスク自治体",
    desc: "進捗50%未満の自治体を地域・人口帯で絞り込む",
  },
  {
    href: "/tokutei",
    badge: "935団体",
    badgeStyle: { backgroundColor: "#FEF3C7", color: "#92400E" },
    title: "特定移行の認定状況",
    desc: "期限延長が認められた自治体の一覧を確認",
  },
  {
    href: "/costs",
    badge: "コスト",
    badgeStyle: { backgroundColor: "#FEF3C7", color: "#92400E" },
    title: "コスト増の要因",
    desc: "ベンダー別コスト比較と高騰の背景を分析",
  },
  {
    href: "/packages",
    badge: "パッケージ",
    badgeStyle: { backgroundColor: "#F3E8FF", color: "#6B21A8" },
    title: "導入パッケージ",
    desc: "ベンダー別の採用状況と自治体数を一覧で確認",
  },
  {
    href: "/cloud",
    badge: "クラウド",
    badgeStyle: { backgroundColor: "#E0F2FE", color: "#0369A1" },
    title: "クラウド基盤の内訳",
    desc: "AWS / Azure / GCP / OCI / さくらの分布",
  },
  {
    href: "/cost-reduction",
    badge: "削減",
    badgeStyle: { backgroundColor: "#DCFCE7", color: "#166534" },
    title: "コスト削減の現実解",
    desc: "移行済み最適化と未移行見直しの具体策",
  },
];

type Props = {
  exclude?: string; // 現在のページのhref（自分自身を除外）
  limit?: number;
};

export default function PageNavCards({ exclude, limit = 4 }: Props) {
  const cards = ALL_CARDS.filter((c) => c.href !== exclude).slice(0, limit);
  return (
    <div className="page-nav-cards">
      <p className="page-nav-cards-label">他のページも見る</p>
      <div className="page-nav-cards-grid">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="explore-card">
            <span className="explore-card-badge" style={c.badgeStyle}>
              {c.badge}
            </span>
            <span className="explore-card-title">{c.title}</span>
            <span className="explore-card-desc">{c.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
