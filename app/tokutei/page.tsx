import type { Metadata } from "next";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import standardData from "@/public/data/standardization.json";
import TokuteiFilter from "./TokuteiFilter";
import Link from "next/link";
import RelatedArticles from "@/components/RelatedArticles";
import { CLUSTERS } from "@/lib/clusters";
import FreshnessBanner from "@/components/FreshnessBanner";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";

export const metadata: Metadata = {
  title: "特定移行支援システム認定 自治体一覧 | ガバメントクラウド移行状況ダッシュボード",
  description: `デジタル庁が認定した特定移行支援システムの対象となった${tokuteiData.total_count}団体（うち市区町村${(tokuteiData as Record<string, unknown>).municipality_count ?? tokuteiData.municipalities.length}）の一覧。ガバメントクラウド移行の2026年3月末期限延長対象。`,
  alternates: { canonical: "/tokutei" },
};

type TokuteiMunicipality = { prefecture: string; city: string };
type StandardMunicipality = {
  prefecture: string;
  city: string;
  overall_rate: number;
  business_rates: Record<string, number>;
};

export default function TokuteiPage() {
  const tokuteiList = tokuteiData.municipalities as TokuteiMunicipality[];
  const allMunis = (standardData as { municipalities: StandardMunicipality[] }).municipalities;

  // standardization.jsonとのJOIN（完了率を付与）
  const rateMap = new Map<string, number>();
  for (const m of allMunis) {
    rateMap.set(`${m.prefecture}/${m.city}`, m.overall_rate);
  }

  const rows = tokuteiList.map((m, i) => ({
    no: i + 1,
    prefecture: m.prefecture,
    city: m.city,
    overall_rate: rateMap.get(`${m.prefecture}/${m.city}`) ?? null,
  }));

  // 都道府県一覧
  // JIS X 0401 都道府県コード順
  const PREF_ORDER = [
    "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
    "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
    "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
    "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
    "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
    "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
    "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
  ];
  const prefSet = new Set(tokuteiList.map((m) => m.prefecture));
  const prefectures = PREF_ORDER.filter((p) => prefSet.has(p));

  // 統計
  const TOTAL_MUNICIPALITIES = 1741;
  const tokuteiCount = rows.length; // 市区町村のみ（898件）
  const tokuteiTotalCount = tokuteiData.total_count as number; // 都道府県含む公式総数（935団体）
  const systemCount = tokuteiData.system_count as number;
  const tokuteiRatio = (tokuteiTotalCount / TOTAL_MUNICIPALITIES) * 100;

  // 完了率の分布（参考）
  const withRate = rows.filter((r) => r.overall_rate !== null);
  const avgRate = withRate.length > 0
    ? withRate.reduce((s, r) => s + (r.overall_rate ?? 0), 0) / withRate.length
    : 0;
  const below50 = withRate.filter((r) => (r.overall_rate ?? 0) < 0.5).length;

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="pb-2">
        <h1 className="page-title">特定移行支援システム認定 自治体一覧</h1>
        <p className="page-subtitle">
          デジタル庁が認定した特定移行支援システムの対象自治体。2026年3月末の標準期限とは別途移行計画が策定されます。
        </p>
      </div>

      {/* 出典バナー */}
      <div
        className="flex items-start gap-3 rounded-lg px-4 py-3 text-xs"
        style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <path d="M13 16h-1v-4h-1m1-4h.01" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span style={{ color: "#1e40af" }}>
          <strong>出典:</strong>{" "}
          <a
            href={tokuteiData.source_url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-700"
          >
            {tokuteiData.source as string}
          </a>
          {" "}（令和7年12月末時点）。
          本データは公開情報に基づく調査情報であり、最新の認定状況は公式資料をご確認ください。
        </span>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 text-center" style={{ borderTop: "3px solid #7c3aed" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#7c3aed" }}>
            {tokuteiTotalCount.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>認定団体数</p>
          <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            全体の {tokuteiRatio.toFixed(1)}%（うち市区町村{tokuteiCount.toLocaleString()}）
          </p>
        </div>
        <div className="card p-5 text-center" style={{ borderTop: "3px solid #7c3aed" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#7c3aed" }}>
            {systemCount.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>認定システム数</p>
        </div>
        <div className="card p-5 text-center" style={{ borderTop: "3px solid #d97706" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#d97706" }}>
            {(avgRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>平均完了率（参考）</p>
        </div>
        <div className="card p-5 text-center" style={{ borderTop: "3px solid #b91c1c" }}>
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#b91c1c" }}>
            {below50}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>完了率50%未満</p>
        </div>
      </div>

      {/* 特定移行とは */}
      <div className="card p-5" style={{ borderLeft: "4px solid #7c3aed" }}>
        <h2 className="text-sm font-bold mb-2" style={{ color: "#6d28d9" }}>
          特定移行支援システム認定とは
        </h2>
        <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--color-text-secondary)" }}>
          <p>
            デジタル庁は、自治体が利用するシステムのうち、標準仕様への移行が技術的・運用的に困難なものを
            「特定移行支援システム」として認定しています。
          </p>
          <p>
            認定を受けた自治体は<strong>2026年3月末の標準的な移行期限の延長</strong>が認められ、
            デジタル庁との協議のうえで別途移行計画を策定します。
            このため「遅延」とは本質的に異なるステータスです。
          </p>
          <p>
            認定の背景には、既存システムの技術的移行困難性に加え、
            <strong>共同利用型の地域クラウド基盤</strong>（北海道HARP等）を運用している自治体群も含まれます。
            これらは標準準拠システムへの移行とガバメントクラウドへの移行を段階的に進める必要があり、
            一律の期限適用が困難なケースです。
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ※ 完了率は「標準準拠システムのガバメントクラウドへの移行進捗」を示します（令和8年1月時点の推計値）。
            標準化（標準仕様への準拠）とガバクラ移行（クラウド基盤への載せ替え）は別の工程であり、
            認定は業務システム単位のため、自治体全体の完了率とは必ずしも連動しません。
          </p>
        </div>
      </div>

      {/* 都道府県別集計 */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          都道府県別 認定自治体数
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {prefectures.map((pref) => {
            const count = tokuteiList.filter((m) => m.prefecture === pref).length;
            return (
              <div key={pref} className="text-center p-2 rounded-lg" style={{ backgroundColor: "#f3e8ff" }}>
                <p className="text-xs font-medium whitespace-nowrap" style={{ color: "#6d28d9" }}>{pref}</p>
                <p className="text-lg font-extrabold tabular-nums" style={{ color: "#7c3aed" }}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 自治体一覧（都道府県別アコーディオン） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            認定自治体 一覧
            <span className="ml-2 text-xs font-normal text-gray-400">（令和7年12月末時点・市区町村{tokuteiCount.toLocaleString()}団体）</span>
          </h2>
          <Link
            href="/risks"
            className="text-xs hover:underline"
            style={{ color: "var(--color-brand-secondary)" }}
          >
            遅延リスク自治体を見る →
          </Link>
        </div>
        <TokuteiFilter rows={rows} prefectures={prefectures} />
      </div>

      <FreshnessBanner dataMonth={(tokuteiData as { updated_at: string }).updated_at.slice(0, 7)} pageLabel="特定移行" />
      <SourceAttribution sourceIds={PAGE_SOURCES.tokutei} pageId="tokutei" />

      <RelatedArticles cluster={CLUSTERS.tokutei} />
    </div>
  );
}
