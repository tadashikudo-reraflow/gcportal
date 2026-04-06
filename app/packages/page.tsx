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
import ReportLeadCta from "@/components/ReportLeadCta";
import MunicipalitySearch from "@/components/MunicipalitySearch";
import Breadcrumb from "@/components/Breadcrumb";

// ISR: デジタル庁データは日次更新のため1時間キャッシュで十分
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ガバメントクラウド対応パッケージ一覧【2026年最新】ベンダー比較・導入実績｜GCInsight",
  description: "TKC・富士通・NEC・日立・NTTデータなど主要ベンダーのガバメントクラウド対応パッケージを自治体標準化20業務別に比較。2026年3月移行期限を踏まえた最新の導入実績・クラウド対応状況を一覧で確認できます。",
  alternates: { canonical: "/packages" },
  openGraph: {
    title: "ガバメントクラウド対応パッケージ一覧【2026年最新】",
    description: "自治体標準化20業務のパッケージをベンダー別に比較。TKC・富士通・NEC・日立・NTTデータ等の採用実績・クラウドプラットフォームを網羅。",
  },
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
        <h1 className="page-title">ガバメントクラウド対応パッケージ・ベンダー一覧</h1>
        <p className="page-subtitle">
          自治体標準化20業務に対応したパッケージをベンダー別に掲載。TKC・富士通・NEC・日立・NTTデータなど主要ベンダーのクラウド対応状況と採用自治体数を比較できます。2026年3月移行期限に向けた最新情報を随時更新。
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

      {/* 主要ベンダー比較テーブル */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-1 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          主要ベンダー比較（2026年）
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          ガバメントクラウド対応・クラウドプラットフォーム・共同利用（マルチテナント）の有無を比較
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th className="text-left py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>ベンダー</th>
                <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>クラウド基盤</th>
                <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>共同利用</th>
                <th className="text-center py-2 px-3 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>対応確認</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "TKC", cloud: "AWS", multi: true, confirmed: true },
                { name: "富士通Japan", cloud: "AWS", multi: false, confirmed: true },
                { name: "NEC", cloud: "AWS / GCP", multi: true, confirmed: true },
                { name: "日立製作所", cloud: "Azure", multi: true, confirmed: true },
                { name: "NTTデータ", cloud: "GCP", multi: true, confirmed: true },
                { name: "さくらインターネット", cloud: "Sakura", multi: false, confirmed: true },
              ].map((v, i) => (
                <tr key={v.name} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: i % 2 === 0 ? "transparent" : "#fafafa" }}>
                  <td className="py-2.5 px-3 font-medium" style={{ color: "var(--color-text-primary)" }}>{v.name}</td>
                  <td className="py-2.5 px-3 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>{v.cloud}</td>
                  <td className="py-2.5 px-3 text-center">
                    {v.multi
                      ? <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: "#d1fae5", color: "#166534" }}>あり</span>
                      : <span className="inline-block px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>なし</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {v.confirmed
                      ? <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}>確認済み</span>
                      : <span className="inline-block px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>調査中</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--color-text-muted)" }}>
          ※ 表は代表的なパッケージの掲載情報をもとに作成。詳細はデジタル庁「適合確認」一覧を参照。
        </p>
      </div>

      {/* FAQセクション */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          よくある質問
        </h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Q. ガバメントクラウド対応パッケージとは何ですか？
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              A. デジタル庁が定めた「自治体情報システムの標準化・共通化」に準拠し、ガバメントクラウド（AWS・GCP・Azure・OCI・さくらのクラウド）上で稼働することが確認されたシステムパッケージです。住民基本台帳や税務など20業務が対象で、2026年3月までに全国の自治体が移行を求められています。
            </p>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Q. TKCと富士通Japanはどちらが多くの自治体に採用されていますか？
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              A. GCInsightのデータベースに基づく採用団体数ランキングで確認できます。上記「ベンダー 採用団体ランキング」セクションをご覧ください。2026年4月時点の実績を反映しています。
            </p>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Q. 自分の自治体が使っているパッケージを調べられますか？
            </p>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              A. はい。このページ上部の「自治体名で検索」から市区町村名を入力すると、当該自治体の導入パッケージ一覧を確認できます。都道府県・人口規模での横断比較は「進捗で比較」ページをご利用ください。
            </p>
          </div>
        </div>
      </div>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "ガバメントクラウド対応パッケージとは何ですか？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "デジタル庁が定めた「自治体情報システムの標準化・共通化」に準拠し、ガバメントクラウド（AWS・GCP・Azure・OCI・さくらのクラウド）上で稼働することが確認されたシステムパッケージです。住民基本台帳や税務など20業務が対象で、2026年3月までに全国の自治体が移行を求められています。"
                }
              },
              {
                "@type": "Question",
                "name": "TKCと富士通Japanはどちらが多くの自治体に採用されていますか？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "GCInsightのデータベースに基づく採用団体数ランキングで確認できます。ベンダー採用団体ランキングセクションで2026年4月時点の最新実績を確認できます。"
                }
              },
              {
                "@type": "Question",
                "name": "自分の自治体が使っているパッケージを調べられますか？",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "はい。ページ上部の「自治体名で検索」から市区町村名を入力すると、当該自治体の導入パッケージ一覧を確認できます。都道府県・人口規模での横断比較は「進捗で比較」ページをご利用ください。"
                }
              }
            ]
          })
        }}
      />

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
      <ReportLeadCta source="packages" compact title="ベンダー別パッケージ採用状況をPDFで確認" description="全17業務の標準パッケージ採用率・ベンダー別シェアをまとめたレポートです。" />
      <PageNavCards exclude="/packages" />
      <RelatedArticles cluster={CLUSTERS.vendor} />
    </div>
  );
}
