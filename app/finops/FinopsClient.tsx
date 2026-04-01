"use client";

import Link from "next/link";
import { COST_CONSTANTS } from "@/lib/constants";
import type { ArticleMeta } from "@/lib/articles";
import PdfLeadForm from "@/components/PdfLeadForm";

const FINOPS_COST_TABLE: {
  popLabel: string;
  vendors: { name: string; afterMin: number; afterMax: number }[];
}[] = [
  { popLabel: "1万人未満", vendors: [
    { name: "TKC",   afterMin: 3300,  afterMax: 4800 },
    { name: "RKKCS", afterMin: 3000,  afterMax: 4500 },
    { name: "富士通", afterMin: 6000,  afterMax: 12000 },
    { name: "NEC",   afterMin: 4550,  afterMax: 8750 },
  ]},
  { popLabel: "1〜5万人", vendors: [
    { name: "TKC",   afterMin: 8800,  afterMax: 12800 },
    { name: "RKKCS", afterMin: 8000,  afterMax: 12000 },
    { name: "富士通", afterMin: 15000, afterMax: 30000 },
    { name: "NEC",   afterMin: 11700, afterMax: 22500 },
  ]},
  { popLabel: "5〜10万人", vendors: [
    { name: "TKC",   afterMin: 16500, afterMax: 24000 },
    { name: "RKKCS", afterMin: 15000, afterMax: 22500 },
    { name: "富士通", afterMin: 30000, afterMax: 60000 },
    { name: "NEC",   afterMin: 23400, afterMax: 45000 },
  ]},
  { popLabel: "10〜30万人", vendors: [
    { name: "TKC",   afterMin: 33000, afterMax: 48000 },
    { name: "RKKCS", afterMin: 30000, afterMax: 45000 },
    { name: "富士通", afterMin: 60000, afterMax: 120000 },
    { name: "NEC",   afterMin: 45500, afterMax: 87500 },
  ]},
  { popLabel: "30万人以上", vendors: [
    { name: "TKC",   afterMin: 66000,  afterMax: 96000 },
    { name: "RKKCS", afterMin: 60000,  afterMax: 90000 },
    { name: "富士通", afterMin: 120000, afterMax: 240000 },
    { name: "NEC",   afterMin: 91000,  afterMax: 175000 },
  ]},
];

function formatManYen(v: number): string {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}億円`;
  return `${v.toLocaleString()}万円`;
}

// ===================================================================

export default function FinopsClient({ articles }: { articles: ArticleMeta[] }) {
  return (
    <main className="min-h-screen" style={{ background: "var(--color-surface)" }}>

      {/* ================================================================
          1. HERO — 痛みを突く（Attention）
      ================================================================ */}
      <section className="px-4 pt-6 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl px-8 py-10 space-y-5" style={{ backgroundColor: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid var(--color-border)" }}>
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              FinOps — ガバクラコスト最適化
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight" style={{ color: "var(--color-text-primary)" }}>
              FinOpsだけでは10%止まり。<br />
              <span style={{ color: "var(--color-brand-primary)" }}>3割削減への3つの階段</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              全国1,741自治体の移行後データを分析。コスト増の構造的原因と、
              今すぐ着手できる最適化の打ち手を無料PDFでお届けします。
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/finops#pdf"
                className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl transition-colors text-sm w-full sm:w-auto"
                style={{ backgroundColor: "var(--color-brand-primary)", color: "#FFFFFF", boxShadow: "0 2px 4px rgba(0,51,141,0.2)" }}
              >
                📄 無料PDFを受け取る（メールのみ）
              </a>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>スパムなし・いつでも配信解除できます</p>
          </div>
        </div>
      </section>

      {/* ================================================================
          2. 衝撃の数字（Interest — 自分事化）
      ================================================================ */}
      <section className="py-12 px-4" style={{ backgroundColor: "#F0F4F8" }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm mb-8" style={{ color: "#6B7280" }}>
            出典: 中核市市長会調査（2025年1月）・デジタル庁先行事業TCO検証
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: `${COST_CONSTANTS.avgCostIncrease}倍`, label: "移行後の平均コスト増加", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
              { num: `${COST_CONSTANTS.maxCostIncrease}倍`, label: "最大で増加した事例あり", color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
              { num: "935団体", label: "期限延長を余儀なくされた自治体", color: "#00338D", bg: "#EFF6FF", border: "#BFDBFE" },
            ].map((item) => (
              <div key={item.label} className="px-6 py-8 text-center space-y-2 rounded-2xl border" style={{ backgroundColor: item.bg, borderColor: item.border }}>
                <div className="text-5xl font-extrabold" style={{ color: item.color }}>{item.num}</div>
                <div className="text-sm font-medium" style={{ color: "#444652" }}>{item.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm mt-6" style={{ color: "#6B7280" }}>
            「移行すれば安くなる」という前提が、データでは崩れています。
          </p>
        </div>
      </section>

      {/* ================================================================
          3. 問題の本質（Interest — 共感・原因の明示）
      ================================================================ */}
      <section className="py-16 px-4" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              コストが下がらない、3つの構造的原因
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              運用最適化（FinOps）だけでは追いつかないケースがあります
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                no: "01",
                title: "基盤選定ミスが後から効いてくる",
                body: "移行前のベンダー・クラウド選定が固まると、回線費・転送費・ライセンス構造も決まります。移行後に最適化できる余地は限られます。",
              },
              {
                no: "02",
                title: "回線費・二重負担が積み上がる",
                body: "庁内完結から東京リージョン集約に変わると通信費が増加。移行期間中はオンプレとクラウドの二重負担が続きます。",
              },
              {
                no: "03",
                title: "競争不足で単価が下がらない",
                body: "ベンダーロックインと一律要件のまま進むと、再選定の機会が失われ、残存システムでも高コストが再生産されます。",
              },
            ].map((item) => (
              <div key={item.no} className="flex gap-5 p-5 rounded-xl" style={{ border: "1px solid var(--color-border)", backgroundColor: "#F6FAFE" }}>
                <div className="text-3xl font-extrabold leading-none shrink-0 pt-1" style={{ color: "var(--color-border-strong)" }}>{item.no}</div>
                <div>
                  <h3 className="font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          4. FinOps とは（解決策の提示）
      ================================================================ */}
      <section className="py-16 px-4" style={{ backgroundColor: "#F0F4F8", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-brand-primary)" }}>FinOps とは</div>
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
              クラウド支出を「見える化→最適化→継続改善」する仕組み
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              FinOps（Financial Operations）は、クラウドコストを継続的に可視化・分析・最適化するプラクティスです。
              デジタル庁も2024年に「FinOpsガイド 1.0版」を策定し、ガバメントクラウドの運用標準として位置付けています。
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "STEP 1", title: "見える化", body: "タグ整備・コストダッシュボードでリソース別の支出を把握する" },
              { step: "STEP 2", title: "最適化",   body: "サイズ見直し・停止ルール・ストレージ階層化で無駄を削る" },
              { step: "STEP 3", title: "継続改善", body: "月次レビューで効果を測定し、翌年度の予算・契約に反映する" },
            ].map((item) => (
              <div key={item.step} className="rounded-xl p-5 space-y-2 shadow-sm" style={{ backgroundColor: "#FFFFFF", border: "1px solid var(--color-border)" }}>
                <div className="text-xs font-bold" style={{ color: "var(--color-brand-primary)" }}>{item.step}</div>
                <div className="font-bold" style={{ color: "var(--color-text-primary)" }}>{item.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4 text-sm leading-relaxed" style={{ backgroundColor: "#FEF3C7", border: "1px solid #F59E0B", color: "#92400E" }}>
            ⚠️ <strong>FinOps は「移行後の運用最適化」に効く手法です。</strong>
            移行前の基盤選定ミスや回線費の構造問題は、FinOps だけでは解決できません。
            このページでは、<strong>移行済み・未移行それぞれの打ち手</strong>を整理しています。
          </div>
        </div>
      </section>

      {/* ================================================================
          5. 具体的な打ち手（Desire — 行動可能感）
      ================================================================ */}
      <section className="py-16 px-4" style={{ backgroundColor: "#FFFFFF" }}>
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>今すぐ着手できる、2つの打ち手</h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>移行状況に合わせて、やるべきことが変わります</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6 space-y-4" style={{ border: "2px solid #BFDBFE", backgroundColor: "#EFF6FF" }}>
              <div className="inline-block text-xs font-bold text-white px-3 py-1 rounded-full" style={{ backgroundColor: "var(--color-brand-primary)" }}>
                移行済みシステム
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--color-brand-secondary)" }}>運用最適化（FinOps）</h3>
              <ul className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {[
                  "サイズ見直し・停止ルール・タグ整備",
                  "ストレージ階層化・保存期間ポリシー",
                  "通信経路の整理と転送量の見える化",
                  "月次コストレビューの仕組み化",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0" style={{ color: "var(--color-brand-primary)" }}>✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-6 space-y-4" style={{ border: "2px solid #BBF7D0", backgroundColor: "#F0FDF4" }}>
              <div className="inline-block text-xs font-bold text-white px-3 py-1 rounded-full" style={{ backgroundColor: "#16A34A" }}>
                未移行システム
              </div>
              <h3 className="text-lg font-bold" style={{ color: "#14532D" }}>基盤再選定</h3>
              <ul className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {[
                  "ベンダー・クラウド基盤の再選定を協議",
                  "回線設計と外部連携の前提を見直す",
                  "人口規模に応じた要件の適正化",
                  "同規模自治体のコスト実績と比較",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0" style={{ color: "#16A34A" }}>✓</span>{t}
                  </li>
                ))}
              </ul>
              <a href="/cloud" className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#16A34A" }}>
                クラウド基盤比較を見る →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          6. PDF CTA（Action — メイン転換点）
      ================================================================ */}
      <section id="pdf" className="py-16 px-4" style={{ backgroundColor: "#00338D" }}>
        <div className="max-w-3xl mx-auto space-y-10 text-white">
          {/* ヘッダー */}
          <div className="text-center space-y-4">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#94b4d8" }}>無料レポート（PDF）2026年版</p>
            <h2 className="text-2xl md:text-3xl font-bold leading-snug">
              FinOpsだけでは10%止まり。<br />
              <span style={{ color: "#F5B500" }}>3割削減への3つの階段</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-xl mx-auto" style={{ color: "#c8d8f0" }}>
              全国1,741自治体のデータをもとに、コスト増の構造的原因と段階的な打ち手を整理した実務レポートです。庁内説明・事業者との協議材料にそのまま使えます。
            </p>
          </div>

          {/* 3ステップ アジェンダ */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                step: "Step 1",
                chapter: "第3章",
                title: "FinOps——まずできることから",
                effect: "削減効果：約10%",
                desc: "見える化・リサイジング・自動停止。今年度内に着手できる低リスクの第一歩。",
                checks: ["未使用リソース棚卸し", "過剰スペック見直し", "夜間・休日の自動停止"],
              },
              {
                step: "Step 2",
                chapter: "第4章",
                title: "基盤変更と共同利用——構造を変える",
                effect: "Step1と合わせて約30%",
                desc: "OCI等への移行、または近隣自治体との共同利用でコスト構造そのものを転換。",
                checks: ["CSP別コスト試算（5基盤比較）", "共同利用の前提条件", "規模別の現実的なゴール"],
              },
              {
                step: "Step 3",
                chapter: "終章",
                title: "SaaS化——2031年を見据えて",
                effect: "さらなる削減の可能性",
                desc: "業務プロセスをSaaSに合わせて変える決断。今から準備できる3つのアクション。",
                checks: ["独自カスタマイズの棚卸し", "業務プロセスの可視化", "帳票様式の統一計画"],
              },
            ].map(({ step, chapter, title, effect, desc, checks }) => (
              <div key={step} className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: "#F5B500", color: "#00205F" }}>{step}</span>
                  <span className="text-xs" style={{ color: "#94b4d8" }}>{chapter}</span>
                </div>
                <div>
                  <p className="font-bold text-sm leading-snug">{title}</p>
                  <p className="text-xs mt-1 font-semibold" style={{ color: "#F5B500" }}>{effect}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#c8d8f0" }}>{desc}</p>
                <ul className="space-y-1">
                  {checks.map((c) => (
                    <li key={c} className="text-xs flex items-start gap-1.5" style={{ color: "#c8d8f0" }}>
                      <span className="mt-0.5 shrink-0" style={{ color: "#F5B500" }}>☑</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* インラインフォーム */}
          <div className="max-w-md mx-auto">
            <PdfLeadForm source="finops_pdf" />
          </div>
        </div>
      </section>

      {/* ================================================================
          8. 関連記事（信頼醸成）
      ================================================================ */}
      {articles.length > 0 && (
        <section className="py-16 px-4" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>FinOps 関連コラム</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="rounded-xl p-5 space-y-3 hover:shadow-md transition-all block"
                  style={{ border: "1px solid var(--color-border)", backgroundColor: "#F6FAFE" }}
                >
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "var(--color-brand-primary)" }}>{tag}</span>
                    ))}
                  </div>
                  <p className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "var(--color-text-primary)" }}>{article.title}</p>
                  <p className="text-xs line-clamp-2" style={{ color: "var(--color-text-muted)" }}>{article.description}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{article.date}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}


    </main>
  );
}
