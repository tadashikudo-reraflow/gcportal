import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** 旧URL /karte/[slug] → 新URL /karte/articles/[slug] へ301リダイレクト */
export default async function KarteSlugRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/karte/articles/${slug}`);
}
