import type { Metadata } from "next";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import AdoptionExplorer from "@/components/AdoptionExplorer";
import type { MunicipalityPackageRow, VendorRow } from "@/components/AdoptionExplorer";

export const metadata: Metadata = {
  title: "ガバメントクラウド対応パッケージ 導入実績マップ | ガバメントクラウド移行状況ダッシュボード",
  description: "自治体がどのガバメントクラウド対応パッケージを導入しているかを地域・業務別に可視化。ベンダーシェアと導入年の実績一覧。",
  alternates: { canonical: "/adoption" },
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-xs text-blue-700">
          <strong>対象業務：</strong>
          地方公共団体情報システムの標準化に関する法律で定める20業務（住民記録・戸籍・税務・福祉・国保・介護等）が対象です。
        </p>
        <p className="text-xs text-blue-700">
          <strong>データソース：</strong>
          各ベンダーのプレスリリース・各自治体の公開資料・議会議事録・予算書・調達情報等を独自調査したものです。
          全1,741自治体の網羅を目指し順次拡充中です。
        </p>
        <p className="text-xs text-blue-700">
          <strong>情報提供のお願い：</strong>
          自治体職員・ベンダー関係者の方からの情報提供を歓迎します。
          訂正・追加は <a href="https://github.com" className="underline font-semibold">GitHubのIssue</a> でご報告ください。
        </p>
      </div>
    </div>
  );
}
