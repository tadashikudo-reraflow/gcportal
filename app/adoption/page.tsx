import type { Metadata } from "next";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import AdoptionExplorer from "@/components/AdoptionExplorer";
import type { MunicipalityPackageRow, VendorRow } from "@/components/AdoptionExplorer";

export const metadata: Metadata = {
  title: "ガバメントクラウド対応パッケージ 導入実績マップ | ガバメントクラウド移行状況ダッシュボード",
  description: "自治体がどのガバメントクラウド対応パッケージを導入しているかを地域・業務別に可視化。ベンダーシェアと導入年の実績一覧。",
};

export default async function AdoptionPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let rows: MunicipalityPackageRow[] = [];
  let vendors: VendorRow[] = [];

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      const [mpRes, vRes] = await Promise.all([
        supabase
          .from("municipality_packages")
          .select(`
            id, municipality_id, package_id, business, adoption_year, source, confidence,
            municipalities(prefecture, city, overall_rate),
            packages(package_name, vendors(name, short_name, cloud_platform, cloud_confirmed))
          `)
          .order("municipality_id"),
        supabase.from("vendors").select("*").order("name"),
      ]);

      rows = (mpRes.data ?? []) as unknown as MunicipalityPackageRow[];
      vendors = (vRes.data ?? []) as VendorRow[];
    } catch {
      rows = [];
      vendors = [];
    }
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="page-title">パッケージ導入実績マップ</h1>
        <p className="page-subtitle">
          自治体規模別の導入パッケージとベンダーシェアを可視化。
          <span className="text-xs text-gray-400 ml-1">※独自調査・公開情報に基づく。順次拡充予定。</span>
        </p>
      </div>

      {/* Client-side interactive explorer */}
      <AdoptionExplorer rows={rows} vendors={vendors} />

      {/* 出典・データソース */}
      <SourceAttribution sourceIds={PAGE_SOURCES.adoption} pageId="adoption" />

      {/* 注記 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-700">
          <strong>データについて：</strong>
          このページのデータは、各ベンダーのプレスリリース・各自治体の公開資料・議会議事録等を独自調査したものです。
          順次精度向上・件数拡充を行っています。情報の訂正・追加はGitHubのIssueでご報告ください。
        </p>
      </div>
    </div>
  );
}
