import type { Metadata } from "next";
import { Vendor, Package } from "@/lib/supabase";
import RelatedArticles from "@/components/RelatedArticles";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import VendorRanking from "@/components/VendorRanking";
import BusinessPackageList from "@/components/BusinessPackageList";

export const metadata: Metadata = {
  title: "自治体向けガバメントクラウド対応パッケージ一覧 | ガバメントクラウド移行状況ダッシュボード",
  description: "TKC・富士通・NEC・日立・NTTなど主要ベンダーのガバメントクラウド対応パッケージ一覧。業務別・ベンダー別のシェアと導入実績を比較。",
};

export default async function PackagesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let vendors: Vendor[] = [];
  let packages: (Package & { vendors?: Vendor })[] = [];

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <p className="text-yellow-700 font-medium">Supabase環境変数が設定されていません。</p>
        <p className="text-yellow-600 text-sm mt-1">.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。</p>
      </div>
    );
  }

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const [vendorRes, packageRes] = await Promise.all([
      supabase.from("vendors").select("*").order("name"),
      supabase
        .from("packages")
        .select("*, vendors(name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count)")
        .order("business"),
    ]);

    vendors = vendorRes.data ?? [];
    packages = packageRes.data ?? [];
  } catch {
    vendors = [];
    packages = [];
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="pb-4">
        <h1 className="page-title">パッケージ・ベンダー一覧</h1>
        <p className="page-subtitle">
          標準化対応パッケージを提供するベンダーと業務別パッケージの一覧。
        </p>
      </div>

      {/* ベンダー採用団体ランキング */}
      <VendorRanking vendors={vendors} />

      {/* 業務別パッケージ一覧 */}
      <BusinessPackageList packages={packages} />

      <SourceAttribution sourceIds={PAGE_SOURCES.packages} pageId="packages" />

      <RelatedArticles cluster={CLUSTERS.vendor} />
    </div>
  );
}
