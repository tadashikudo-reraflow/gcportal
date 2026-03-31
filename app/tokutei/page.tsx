import type { Metadata } from "next";
import tokuteiData from "@/public/data/tokutei_municipalities.json";
import standardData from "@/public/data/standardization.json";
import Link from "next/link";
import TokuteiHeatmap from "@/components/TokuteiHeatmap";
import RelatedArticles from "@/components/RelatedArticles";
import PageNavCards from "@/components/PageNavCards";
import { CLUSTERS } from "@/lib/clusters";
import FreshnessBanner from "@/components/FreshnessBanner";
import SourceAttribution from "@/components/SourceAttribution";
import { PAGE_SOURCES } from "@/lib/sources";
import Breadcrumb from "@/components/Breadcrumb";

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

  const TOTAL_MUNICIPALITIES = 1741;
  const tokuteiCount = rows.length;
  const tokuteiTotalCount = tokuteiData.total_count as number;
  const systemCount = tokuteiData.system_count as number;
  const tokuteiRatio = (tokuteiTotalCount / TOTAL_MUNICIPALITIES) * 100;

  const withRate = rows.filter((r) => r.overall_rate !== null);
  const avgRate = withRate.length > 0
    ? withRate.reduce((s, r) => s + (r.overall_rate ?? 0), 0) / withRate.length
    : 0;
  const below50 = withRate.filter((r) => (r.overall_rate ?? 0) < 0.5).length;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "特定移行" }]} />
      <div className="pb-2">
        <h1 className="page-title">特定移行支援システム認定 自治体一覧</h1>
        <p className="page-subtitle">
          デジタル庁認定の特定移行支援システム対象自治体一覧（期限延長対象）
        </p>
      </div>

      {/* 重要注記 */}
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
          <p className="text-xs mt-1 text-green-700">
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
            技術的・運用的に移行困難なシステムをデジタル庁が認定。認定自治体は<strong>期限延長</strong>のうえ別途移行計画を策定するため「遅延」とは異なるステータスです。<a href="/articles" className="underline ml-1" style={{ color: "var(--color-brand-secondary)" }}>詳しくはコラム記事で</a>
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
        <h2 className="text-sm font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
          特定移行認定 事由別内訳
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          8,956システム / 935団体（令和7年12月末時点）
        </p>

        {(() => {
          const items = [
            { label: "SEリソース不足", pct: 95.3, color: "#b91c1c", systems: 8539, orgs: 907 },
            { label: "ベンダー撤退",   pct: 2.1,  color: "#94a3b8", systems: 184,  orgs: 97  },
            { label: "個別開発",       pct: 2.1,  color: "#cbd5e1", systems: 189,  orgs: 26  },
            { label: "メインフレーム", pct: 0.5,  color: "#e2e8f0", systems: 44,   orgs: 7   },
          ];
          const r = 45;
          const circ = 2 * Math.PI * r;
          let cum = 0;
          return (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {/* ドーナツグラフ */}
              <svg width="140" height="140" viewBox="0 0 120 120" className="flex-shrink-0">
                <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
                {items.map((item) => {
                  const dash = (item.pct / 100) * circ;
                  const offset = -cum;
                  cum += dash;
                  return (
                    <circle
                      key={item.label}
                      cx="60" cy="60" r={r}
                      fill="none"
                      stroke={item.color}
                      strokeWidth="18"
                      strokeDasharray={`${dash} ${circ}`}
                      strokeDashoffset={offset}
                      style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
                    />
                  );
                })}
                <text x="60" y="53" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#b91c1c">95.3%</text>
                <text x="60" y="67" textAnchor="middle" fontSize="8" fill="#475569">SEリソース不足</text>
              </svg>

              {/* 凡例リスト */}
              <div className="flex-1 space-y-2.5">
                {items.map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className={`w-28 flex-shrink-0 ${item.pct > 5 ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                      {item.label}
                    </span>
                    <span className="tabular-nums font-bold w-10 flex-shrink-0" style={{ color: item.pct > 5 ? item.color : "#94a3b8" }}>
                      {item.pct}%
                    </span>
                    <span className="text-xs text-gray-400">{item.orgs}団体</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 都道府県別集計（ヒートマップ） */}
      <TokuteiHeatmap
        data={prefectures.map((pref) => ({
          prefecture: pref,
          count: tokuteiList.filter((m) => m.prefecture === pref).length,
        }))}
      />

      <FreshnessBanner dataMonth={(tokuteiData as { updated_at: string }).updated_at.slice(0, 7)} pageLabel="特定移行" />
      <SourceAttribution sourceIds={PAGE_SOURCES.tokutei} pageId="tokutei" />

      <PageNavCards exclude="/tokutei" />
      <RelatedArticles cluster={CLUSTERS.tokutei} />
    </div>
  );
}
