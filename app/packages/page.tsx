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
  title: "ガバメントクラウド対応パッケージ比較｜TKC・富士通・NEC・日立・NTTデータ 採用自治体数・選び方【2026年】",
  description: "TKC・富士通・NEC・日立・NTTデータなど主要ベンダーのガバメントクラウド対応パッケージを標準化20業務別に比較。採用自治体数・クラウド基盤（AWS/GCP/Azure）・共同利用の有無を一覧で確認。自治体担当者向けの選び方ガイド付き。",
  alternates: { canonical: "/packages" },
  openGraph: {
    title: "ガバメントクラウド対応パッケージ比較｜TKC・富士通・NEC・日立 採用自治体数【2026年】",
    description: "自治体標準化20業務のパッケージをベンダー別に比較。TKC・富士通・NEC・日立・NTTデータ等の採用自治体数・クラウドプラットフォームと選び方ガイドを網羅。",
  },
};

type MunicipalityPackageWithPackage = MunicipalityPackageRow & {
  packages?: Package & { vendors?: Vendor };
};

// FAQ共通データ（JSX表示とFAQPage JSON-LDの単一ソース）
const FAQ_ITEMS = [
  {
    q: "ガバメントクラウド対応パッケージとは何ですか？",
    a: "デジタル庁が定めた「自治体情報システムの標準化・共通化」に準拠し、ガバメントクラウド（AWS・GCP・Azure・OCI・さくらのクラウド）上で稼働することが確認されたシステムパッケージです。住民基本台帳や税務など20業務が対象で、全国の自治体に移行が求められています（2026年度以降は運用フェーズへ移行）。",
  },
  {
    q: "TKCと富士通Japanはどちらが多くの自治体に採用されていますか？",
    a: "GCInsightのデータベースに基づく採用団体数ランキングで確認できます。上記「ベンダー 採用団体ランキング」セクションをご覧ください。2026年4月時点の実績を反映しています。",
  },
  {
    q: "自分の自治体が使っているパッケージを調べられますか？",
    a: "はい。このページ上部の「自治体名で検索」から市区町村名を入力すると、当該自治体の導入パッケージ一覧を確認できます。都道府県・人口規模での横断比較は「進捗で比較」ページをご利用ください。",
  },
  {
    q: "COKAS-R・RKKCS などのパッケージはどのベンダーですか？",
    a: "COKAS-Rは株式会社両備システムズが提供するガバメントクラウド対応パッケージです。RKKCSは株式会社リコーが提供しており、九州・西日本の自治体への採用が多い製品です。いずれも業務別パッケージ一覧からご確認いただけます。",
  },
  {
    q: "パッケージ移行にかかるコストはどのくらいですか？",
    a: "自治体規模やベンダー、業務数によって大きく異なりますが、中規模自治体（人口10万人程度）で数千万〜数億円規模の初期費用がかかるケースが報告されています。「コスト試算」ページではGCInsightが集計した自治体別のコスト動向を確認できます。",
  },
  {
    q: "デジタル庁の「適合確認」とパッケージ一覧の違いは何ですか？",
    a: "デジタル庁の適合確認は、パッケージが標準仕様書に準拠していることを公式に認定したリストです。GCInsightのパッケージ一覧は適合確認情報に加え、採用自治体数・クラウド基盤・共同利用の有無など実運用データを組み合わせた独自のデータベースです。",
  },
] as const;

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
          自治体標準化20業務に対応したパッケージをベンダー別に比較。TKC・富士通・NEC・日立・NTTデータなど主要ベンダーのクラウド対応状況・採用自治体数・クラウド基盤（AWS/GCP/Azure/OCI）を一覧で確認できます。標準移行完了後の2026年度運用フェーズに向けた最新情報を随時更新。
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

      {/* パッケージ選定ガイドセクション */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          ガバメントクラウド対応パッケージの選び方
        </h2>
        <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          自治体がパッケージを選定する際に確認すべき4つのポイントです。
        </p>
        <div className="space-y-3">
          {[
            {
              num: "01",
              title: "クラウド基盤の適合性",
              body: "ガバメントクラウドはAWS・GCP・Azure・OCI・さくらのクラウドの5基盤が認定されています。自治体の既存インフラや調達方針に合わせてベンダーのクラウド基盤を確認しましょう。AWSシェアが約97%と圧倒的ですが、2026年度からさくらのクラウドも加わり選択肢が広がりました。",
            },
            {
              num: "02",
              title: "共同利用（マルチテナント）の有無",
              body: "共同利用型パッケージは複数自治体でインフラを共有するため、単独型より運用コストを抑えられます。TKC・NEC・日立・NTTデータは共同利用に対応。規模の小さい自治体ほど共同利用型を選ぶ傾向があります。",
            },
            {
              num: "03",
              title: "採用自治体数と実績",
              body: "採用自治体数が多いパッケージはノウハウの蓄積や移行支援体制が充実しています。同規模・同都道府県の自治体での採用実績も参考にしてください。上記「ベンダー採用団体ランキング」で最新の実績を確認できます。",
            },
            {
              num: "04",
              title: "20業務の対応範囲",
              body: "標準化対象の20業務すべてに対応しているベンダーは限られます。既存システムのベンダーが未対応の業務については、別ベンダーのパッケージを組み合わせる「マルチベンダー構成」も選択肢です。上記「業務別パッケージ一覧」で業務ごとの対応状況を確認できます。",
            },
          ].map((item) => (
            <div key={item.num} className="flex gap-3" style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "0.75rem" }}>
              <span className="flex-shrink-0 text-xs font-black tabular-nums" style={{ color: "var(--color-brand-primary)", minWidth: "1.5rem" }}>{item.num}</span>
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQセクション */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
          <span className="w-1 h-5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: "var(--color-gov-primary)" }} />
          よくある質問
        </h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={i > 0 ? { borderTop: "1px solid #f1f5f9", paddingTop: "1rem" } : {}}>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Q. {item.q}
              </p>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                A. {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ JSON-LD — FAQ_ITEMS と共通ソースで自動同期 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              "name": item.q,
              "acceptedAnswer": { "@type": "Answer", "text": item.a },
            })),
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
      <ReportLeadCta source="packages" compact title="移行コスト・ベンダー選定の判断材料を確認" description="全国自治体の移行状況・コスト構造・ベンダー動向をまとめた無料レポートです。" />
      <PageNavCards exclude="/packages" />
      <RelatedArticles cluster={CLUSTERS.vendor} />
    </div>
  );
}
