import type { Metadata } from "next";
import Link from "next/link";
import { Vendor, Package, Municipality, MunicipalityPackageRow } from "@/lib/supabase";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import { CLUSTERS } from "@/lib/clusters";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import VendorRanking from "@/components/VendorRanking";
import BusinessPackageList from "@/components/BusinessPackageList";
import MunicipalitySearch from "@/components/MunicipalitySearch";
import Breadcrumb from "@/components/Breadcrumb";

// ISR: デジタル庁データは日次更新のため1時間キャッシュで十分
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ガバクラ対応パッケージ一覧｜ベンダー別シェア・導入実績比較｜GCInsight",
  description: "TKC・富士通・NEC・日立・NTTなど主要ベンダーのガバメントクラウド対応パッケージ一覧。業務別・ベンダー別のシェアと導入実績を比較。",
  alternates: { canonical: "/packages" },
};

type MunicipalityPackageWithPackage = MunicipalityPackageRow & {
  packages?: Package & { vendors?: Vendor };
};

export default async function PackagesPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let vendors: Vendor[] = [];
  let packages: (Package & { vendors?: Vendor })[] = [];
  let municipalities: Municipality[] = [];
  let packagesByMunicipality: Record<number, MunicipalityPackageWithPackage[]> = {};

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

    const [vendorRes, packageRes, municipalityRes, mpRes] = await Promise.all([
      supabase.from("vendors").select("id, name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count").order("name"),
      supabase
        .from("packages")
        .select("id, package_name, business, vendor_id, confirmed_date, vendors(name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count)")
        .order("business"),
      supabase
        .from("municipalities")
        .select("id, prefecture, city, pref_city_code, size_category")
        .order("prefecture")
        .order("city"),
      supabase
        .from("municipality_packages")
        .select(
          "id, municipality_id, package_id, business, adoption_year, confidence, packages(id, package_name, business, vendor_id, confirmed_date, vendors(name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count))"
        )
        .limit(3000),
    ]);

    vendors = (vendorRes.data ?? []) as unknown as Vendor[];
    packages = (packageRes.data ?? []) as unknown as (Package & { vendors?: Vendor })[];
    municipalities = municipalityRes.data ?? [];

    // municipality_id をキーにした Map を構築
    // Supabase の JOIN 結果はネスト型が配列になるため unknown 経由でキャスト
    const mpRows: MunicipalityPackageWithPackage[] = (mpRes.data ?? []) as unknown as MunicipalityPackageWithPackage[];
    for (const row of mpRows) {
      if (!packagesByMunicipality[row.municipality_id]) {
        packagesByMunicipality[row.municipality_id] = [];
      }
      packagesByMunicipality[row.municipality_id].push(row);
    }
  } catch {
    vendors = [];
    packages = [];
    municipalities = [];
    packagesByMunicipality = {};
  }

  return (
    <div className="space-y-6">
      {/* パンくず + ページヘッダー */}
      <Breadcrumb items={[{ label: "パッケージ・ベンダー" }]} />
      <div className="pb-2">
        <h1 className="page-title">パッケージ・ベンダー一覧</h1>
        <p className="page-subtitle">
          標準化対応パッケージを提供するベンダーと業務別パッケージの一覧。
        </p>
        {/* ファーストビューKPIバー */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
          <div>
            <p className="text-2xl font-black tabular-nums leading-none" style={{ color: "var(--color-brand-primary)" }}>
              {vendors.length}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>対応ベンダー数</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums leading-none" style={{ color: "var(--color-brand-primary)" }}>
              {packages.length}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>登録パッケージ数</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums leading-none" style={{ color: "var(--color-brand-primary)" }}>
              {municipalities.length.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>対象自治体数</p>
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums leading-none" style={{ color: "var(--color-brand-primary)" }}>
              {vendors.filter((v) => v.cloud_confirmed).length}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>クラウド対応確認済み</p>
          </div>
        </div>
      </div>

      {/* 自治体名検索 */}
      <MunicipalitySearch
        municipalities={municipalities}
        packagesByMunicipality={packagesByMunicipality}
      />

      {/* ベンダー採用団体ランキング */}
      <VendorRanking vendors={vendors} />

      {/* 業務別パッケージ一覧 */}
      <BusinessPackageList packages={packages} />

      {/* ベンチマーク比較へのクロスリンク */}
      <div className="rounded-xl p-4 flex items-center justify-between gap-4" style={{ backgroundColor: "#f0f5ff", border: "1px solid #bfdbfe" }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1e40af" }}>同規模自治体の導入パッケージを比較</p>
          <p className="text-xs mt-0.5" style={{ color: "#3b82f6" }}>人口帯・都道府県でフィルタして類似団体のベンダー採用状況を確認できます</p>
        </div>
        <Link href="/progress" className="flex-shrink-0 text-xs font-bold px-3 py-2 rounded-lg no-underline" style={{ backgroundColor: "#1e40af", color: "#fff" }}>
          進捗で比較 →
        </Link>
      </div>

      <SourceAttribution sourceIds={PAGE_SOURCES.packages} pageId="packages" />

      <PageNavCards exclude="/packages" />
      <RelatedArticles cluster={CLUSTERS.vendor} />
    </div>
  );
}
