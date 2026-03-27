import type { Metadata } from "next";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import standardData from "@/public/data/standardization.json";
import TokuteiFilter from "./TokuteiFilter";
import Link from "next/link";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
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
          デジタル庁認定の特定移行支援システム対象自治体一覧（期限延長対象）
        </p>
      </div>

      {/* 重要注記: 標準化とガバクラ移行は別工程 */}
      <div
        className="flex items-start gap-3 rounded-lg px-5 py-4"
        style={{ backgroundColor: "#eff6ff", border: "1px solid #93c5fd" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <path d="M13 16h-1v-4h-1m1-4h.01" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <div style={{ color: "#1e40af" }}>
          <p className="font-bold text-sm mb-1">標準化とガバクラ移行は別の工程です</p>
          <p className="text-xs leading-relaxed">
            認定は業務システム単位のため、自治体全体の手続き進捗率とは連動しません。
          </p>
        </div>
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
          最新の認定状況は公式資料をご確認ください。
        </span>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#475569" }}>
            {tokuteiTotalCount.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>認定団体数</p>
          <p className="text-xs tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            全体の {tokuteiRatio.toFixed(1)}%（うち市区町村{tokuteiCount.toLocaleString()}）
          </p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#475569" }}>
            {systemCount.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>認定システム数</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#d97706" }}>
            {(avgRate * 100).toFixed(1)}%
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>平均 手続き進捗率（参考）</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-extrabold tabular-nums" style={{ color: "#b91c1c" }}>
            {below50}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>進捗率50%未満</p>
        </div>
      </div>

      {/* システム移行完了率 */}
      <div
        className="flex items-start gap-3 rounded-lg px-5 py-4"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="flex-shrink-0 mt-0.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <div style={{ color: "#14532d" }}>
          <p className="font-bold text-sm mb-0.5">
            システム移行完了率: <span className="text-green-700">38.4%</span>（令和8年1月末時点）
          </p>
          <p className="text-xs leading-relaxed">
            13,283システムが本番移行完了（全34,594システム中）。
            手続き進捗率（82%）とのギャップが実態を示しています。
          </p>
          <p className="text-[11px] mt-1 text-green-700">
            出典: デジタル庁 2026年2月27日公表
          </p>
        </div>
      </div>

      {/* 特定移行とは */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-2" style={{ color: "#475569" }}>
          特定移行支援システム認定とは
        </h2>
        <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--color-text-secondary)" }}>
          <p>
            技術的・運用的に移行困難なシステムをデジタル庁が認定。認定自治体は<strong>期限延長</strong>のうえ別途移行計画を策定するため「遅延」とは異なるステータスです。
            共同利用型クラウド基盤（北海道HARP等）の自治体群も含まれます。<a href="/articles" className="underline" style={{ color: "var(--color-brand-secondary)" }}>詳しくはコラム記事で</a>
          </p>
          <div
            className="rounded-md px-4 py-3 mt-3"
            style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1" }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "#475569" }}>移行継続スケジュール</p>
            <p className="text-xs leading-relaxed" style={{ color: "#334155" }}>
              特定移行支援システム対象の<strong>{tokuteiTotalCount.toLocaleString()}団体</strong>は2026年度以降も移行を継続します。
              <strong>概ね5年以内（〜2030年度目安）</strong>の完了を目指す方針が示されており、
              2026〜2030年度にかけて段階的に移行が進む見込みです。
            </p>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
            ※ 手続き進捗率はガバクラ移行進捗の推計値（令和8年1月時点）。認定は業務単位のため自治体全体の手続き進捗率と連動しない場合あり。
          </p>
        </div>
      </div>

      {/* 特定移行 事由別内訳 */}
      <div className="card p-5">
        <h2 className="text-sm font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
          特定移行認定 事由別内訳
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left py-2 px-3 font-semibold border-b text-gray-600">事由</th>
                <th className="text-right py-2 px-3 font-semibold border-b text-gray-600">システム数</th>
                <th className="text-right py-2 px-3 font-semibold border-b text-gray-600">団体数</th>
                <th className="text-left py-2 px-3 font-semibold border-b text-gray-600">内容</th>
              </tr>
            </thead>
            <tbody>
              {[
                { jiyuu: "事由1", systems: 44, orgs: 7, desc: "メインフレーム", highlight: false },
                { jiyuu: "事由2", systems: 189, orgs: 26, desc: "個別開発", highlight: false },
                { jiyuu: "事由3", systems: 184, orgs: 97, desc: "ベンダー撤退", highlight: false },
                { jiyuu: "事由4", systems: 8539, orgs: 907, desc: "SEリソース不足（95.3%）", highlight: true },
              ].map((row) => (
                <tr key={row.jiyuu} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3 font-medium text-gray-700">{row.jiyuu}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-gray-700">{row.systems.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-gray-700">{row.orgs.toLocaleString()}</td>
                  <td className={`py-2 px-3 ${row.highlight ? "font-semibold text-red-700" : "text-gray-500"}`}>{row.desc}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: "#f1f5f9" }}>
                <td className="py-2 px-3 font-bold text-gray-700">合計</td>
                <td className="py-2 px-3 text-right tabular-nums font-bold text-gray-700">8,956</td>
                <td className="py-2 px-3 text-right tabular-nums font-bold text-gray-700">935</td>
                <td className="py-2 px-3 text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          ※ 事由4（SEリソース不足）が全体の95.3%を占める。出典: デジタル庁（令和7年12月末時点）
        </p>
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
              <div key={pref} className="text-center p-2 rounded-lg" style={{ backgroundColor: "#f1f5f9" }}>
                <p className="text-xs font-medium whitespace-nowrap" style={{ color: "#475569" }}>{pref}</p>
                <p className="text-lg font-extrabold tabular-nums" style={{ color: "#475569" }}>{count}</p>
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

      <PageNavCards exclude="/tokutei" />
      <RelatedArticles cluster={CLUSTERS.tokutei} />
    </div>
  );
}
