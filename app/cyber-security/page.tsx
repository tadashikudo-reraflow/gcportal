import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Clock, Building2, ChevronRight, ExternalLink, AlertTriangle } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import RelatedArticles from "@/components/RelatedArticles";
import NewsletterBanner from "@/components/NewsletterBanner";
import CountdownBanner from "./CountdownBanner";
import { CLUSTERS } from "@/lib/clusters";

export const metadata: Metadata = {
  title: "重要インフラ統一基準と地方公共団体への影響【2026年10月施行】｜GCInsight",
  description:
    "2026年10月施行予定の重要インフラ統一基準（案）解説。地方公共団体の行政サービスが「重要インフラ」に位置づけられ、サイバーセキュリティ対策の統一基準への対応が求められる。パブコメ締切5月17日。",
  alternates: { canonical: "/cyber-security" },
  openGraph: {
    title: "重要インフラ統一基準と地方公共団体への影響【2026年10月施行】｜GCInsight",
    description:
      "地方公共団体の行政サービスが「重要インフラ」に位置づけられ、サイバーセキュリティ統一基準への対応が義務化。2026年10月施行・パブコメ5月17日締切。",
    images: [
      {
        url: `/og?title=${encodeURIComponent("重要インフラ統一基準 地方公共団体への影響")}&subtitle=${encodeURIComponent("2026年10月施行 パブコメ5月17日締切")}&type=article`,
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

const TIMELINE_ITEMS = [
  {
    date: "2026年4月21日",
    label: "パブリックコメント開始",
    desc: "内閣官房 国家サイバー統括室（NCO）がパブコメ受付を開始",
    status: "done",
  },
  {
    date: "2026年5月17日",
    label: "パブコメ締め切り",
    desc: "意見提出の受付終了（23:59）",
    status: "active",
    link: "https://public-comment.e-gov.go.jp/pcm/detail?CLASSNAME=PCMMSTDETAIL&id=060260421&Mode=0",
  },
  {
    date: "2026年10月（予定）",
    label: "重要インフラ統一基準 施行",
    desc: "サイバーセキュリティ基本法改正に基づく統一基準が発効。各政府機関は実施計画の策定へ",
    status: "upcoming",
  },
  {
    date: "2027年夏（目処）",
    label: "各分野 実施計画 策定",
    desc: "政府・行政サービス分野（地方公共団体含む）の実施計画が確定",
    status: "upcoming",
  },
];

const SECTORS = [
  { name: "電力", detail: "一般送配電事業、発電事業" },
  { name: "ガス", detail: "一般ガス導管事業、ガス製造事業" },
  { name: "石油", detail: "石油の供給" },
  { name: "水道", detail: "水道による水の供給" },
  { name: "鉄道", detail: "旅客輸送サービス、発券、入出場手続" },
  { name: "物流", detail: "貨物自動車運送事業、船舶運航事業、倉庫業" },
  { name: "港湾", detail: "TOSによるターミナルオペレーション" },
  { name: "航空", detail: "旅客・貨物の航空輸送サービス、予約・発券等" },
  { name: "空港", detail: "空港におけるセキュリティの確保・利便性の向上" },
  { name: "情報通信", detail: "電気通信役務、放送、ケーブルテレビ" },
  { name: "金融", detail: "銀行等、生命保険、損害保険等" },
  { name: "クレジット", detail: "クレジットサービス" },
  { name: "医療", detail: "診療" },
  { name: "化学", detail: "石油化学工業" },
  { name: "政府・行政サービス", detail: "地方公共団体の行政サービス", highlight: true },
];

const IMPACT_CARDS = [
  {
    icon: Shield,
    title: "何が変わるか",
    body: "分野・事業者横断的に講ずべきサイバーセキュリティ対策のベースラインが初めて統一基準として法定化される。地方公共団体も対象。",
    color: "#00338D",
    bg: "#EFF6FF",
  },
  {
    icon: Building2,
    title: "誰が対象か",
    body: "重要インフラ15分野の事業者等。「政府・行政サービス」分野として地方公共団体の行政サービスが明示的に位置づけられた。",
    color: "#047857",
    bg: "#ECFDF5",
  },
  {
    icon: Clock,
    title: "いつまでに何をするか",
    body: "2026年10月の施行後、各所管省庁・政府機関が実施計画を2027年夏を目処に策定。PDCAサイクルによる継続的な評価・改善が求められる。",
    color: "#92400E",
    bg: "#FEF3C7",
  },
];

const PDCA_STEPS = [
  { label: "P：実施計画策定", desc: "統一基準に基づく施策の実施計画を策定（分野横断・各分野）" },
  { label: "D：施策の実施", desc: "実施計画に基づき、セキュリティ施策を実行" },
  { label: "C：把握・分析", desc: "国家サイバー統括室が調査を実施し、状況を分野横断で把握" },
  { label: "A：評価・改善", desc: "CS戦略本部が評価・決定し、実施計画を改善。サイクルを継続" },
];

export default function CyberSecurityPage() {
  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "重要インフラ統一基準" }]} />

      {/* ヒーローバナー */}
      <section
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #00205F 0%, #00338D 60%, #1D4ED8 100%)",
          padding: "clamp(28px, 5vw, 48px) clamp(20px, 4vw, 40px)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装飾 */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -60,
            right: 80,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(245,181,0,0.08)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 720 }}>
          <CountdownBanner />

          <h1
            style={{
              fontSize: "clamp(1.375rem, 3.5vw, 1.875rem)",
              fontWeight: 800,
              lineHeight: 1.3,
              marginTop: 16,
              marginBottom: 12,
              letterSpacing: "-0.02em",
            }}
          >
            重要インフラ統一基準（案）
            <br />
            <span style={{ color: "#F5B500" }}>地方公共団体も対象</span>に — 2026年10月施行予定
          </h1>

          <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, opacity: 0.88, marginBottom: 20 }}>
            内閣官房 国家サイバー統括室（NCO）が2026年4月21日に公表した「重要インフラ統一基準（案）」では、
            <strong style={{ color: "#FDE68A" }}>「政府・行政サービス（地方公共団体の行政サービス）」</strong>が
            重要インフラの1分野として明記。自治体IT担当者は施行前の準備が求められる。
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              href="https://public-comment.e-gov.go.jp/pcm/detail?CLASSNAME=PCMMSTDETAIL&id=060260421&Mode=0"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 8,
                backgroundColor: "#F5B500",
                color: "#00205F",
                fontWeight: 700,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              パブコメを提出する
              <ExternalLink size={14} />
            </Link>
            <Link
              href="/articles"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 8,
                backgroundColor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              関連コラムを読む
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 概要カード 3枚 */}
      <section>
        <h2 className="section-title" style={{ marginBottom: 16 }}>概要：何が変わるか</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {IMPACT_CARDS.map(({ icon: Icon, title, body, color, bg }) => (
            <div
              key={title}
              className="card"
              style={{ padding: "20px 22px", borderTop: `3px solid ${color}` }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: bg,
                  marginBottom: 12,
                }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 8, color: "var(--color-text-primary)" }}>
                {title}
              </h3>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--color-text-secondary)", margin: 0 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* タイムライン */}
      <section className="card" style={{ padding: "24px 28px" }}>
        <h2 className="section-title" style={{ marginBottom: 20 }}>対応タイムライン</h2>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 0 }}>
          {TIMELINE_ITEMS.map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 16, position: "relative" }}>
              {/* 縦線 */}
              {i < TIMELINE_ITEMS.length - 1 && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 11,
                    top: 26,
                    bottom: 0,
                    width: 2,
                    backgroundColor: item.status === "done" ? "#10B981" : "#E4E9ED",
                  }}
                />
              )}
              {/* ドット */}
              <div style={{ flexShrink: 0, marginTop: 4 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor:
                      item.status === "done" ? "#10B981" :
                      item.status === "active" ? "#F5B500" : "#E4E9ED",
                    border: item.status === "active" ? "3px solid #92400E" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {item.status === "done" && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.status === "active" && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#92400E" }} />
                  )}
                </div>
              </div>
              {/* コンテンツ */}
              <div style={{ paddingBottom: 24 }}>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 2, fontWeight: 500 }}>
                  {item.date}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
                    {item.label}
                  </p>
                  {item.status === "active" && (
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                      }}
                    >
                      受付中
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                  {item.link && (
                    <>
                      {" "}
                      <Link
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontWeight: 600 }}
                      >
                        e-Gov で意見提出 <ExternalLink size={10} style={{ display: "inline", verticalAlign: "middle" }} />
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 重要インフラ分野マップ */}
      <section className="card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>重要インフラ15分野（統一基準の対象）</h2>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: "#FEF3C7",
              color: "#92400E",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={12} />
            ハイライトが自治体関連
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 8,
          }}
        >
          {SECTORS.map((sector) => (
            <div
              key={sector.name}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: sector.highlight
                  ? "2px solid #F5B500"
                  : "1px solid var(--color-border)",
                backgroundColor: sector.highlight ? "#FFFBEB" : "var(--color-surface)",
                position: "relative",
              }}
            >
              {sector.highlight && (
                <span
                  style={{
                    position: "absolute",
                    top: -1,
                    right: 10,
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    padding: "1px 6px",
                    backgroundColor: "#F5B500",
                    color: "#00205F",
                    borderRadius: "0 0 4px 4px",
                  }}
                >
                  自治体対象
                </span>
              )}
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: sector.highlight ? 800 : 600,
                  color: sector.highlight ? "#92400E" : "var(--color-text-primary)",
                  marginBottom: 4,
                }}
              >
                {sector.name}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: sector.highlight ? "#B45309" : "var(--color-text-muted)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {sector.detail}
              </p>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: 14,
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
          }}
        >
          出典: 重要インフラ統一基準（案）の概要 / 内閣官房 国家サイバー統括室（2026年4月21日公表）
        </p>
      </section>

      {/* PDCAサイクル解説 */}
      <section className="card" style={{ padding: "24px 28px" }}>
        <h2 className="section-title" style={{ marginBottom: 16 }}>統一基準に基づくPDCAサイクル</h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.7,
            marginBottom: 20,
          }}
        >
          CS戦略本部・国家サイバー統括室・重要インフラ所管省庁の三層構造で、
          計画策定（P）→施策実施（D）→把握・分析（C）→評価・改善（A）のサイクルを回す。
          地方公共団体は「政府・行政サービス」分野の施策対象として実施計画の適用を受ける。
        </p>
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {PDCA_STEPS.map(({ label, desc }, i) => (
            <li
              key={i}
              style={{
                padding: "14px 16px",
                borderRadius: 10,
                backgroundColor: "var(--color-surface-container-low)",
                borderLeft: `4px solid var(--color-brand-primary)`,
              }}
            >
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-brand-primary)", marginBottom: 6 }}>
                {label}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
                {desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 注記 */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 10,
          backgroundColor: "var(--color-surface-container-low)",
          fontSize: "0.8125rem",
          color: "var(--color-text-muted)",
          lineHeight: 1.7,
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: 4, color: "var(--color-text-secondary)" }}>出典・注記</p>
        <ul style={{ paddingLeft: "1.2em", margin: 0 }}>
          <li>内閣官房 国家サイバー統括室「重要インフラ統一基準（案）の概要」（令和8年4月21日）</li>
          <li>サイバーセキュリティ基本法第26条第1項第3号に基づく意見公募手続</li>
          <li>施行日・実施計画の策定スケジュールは今後の政令等により変更される可能性があります</li>
          <li>本ページの情報は2026年4月27日時点。最新情報は<Link href="https://public-comment.e-gov.go.jp/pcm/detail?CLASSNAME=PCMMSTDETAIL&id=060260421&Mode=0" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-brand-primary)" }}>e-Gov</Link>をご確認ください</li>
        </ul>
      </div>

      {/* ニュースレター */}
      <NewsletterBanner source="cyber_security_standards" />

      {/* 関連コラム */}
      <RelatedArticles cluster={CLUSTERS.tech} />
    </div>
  );
}
