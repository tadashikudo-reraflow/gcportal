import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { REPORTS } from "../reports";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const report = REPORTS[slug];
  if (!report) return { title: "Not Found" };

  return {
    title: report.title,
    description: report.subtitle,
    robots: { index: false, follow: false },
  };
}

/** **太字** と改行を簡易レンダリング */
function renderBody(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const parts = line.split(/\*\*([^*]+)\*\*/g);
    return (
      <span key={i}>
        {parts.map((p, j) =>
          j % 2 === 1 ? <strong key={j}>{p}</strong> : p
        )}
        {i < lines.length - 1 && <br />}
      </span>
    );
  });
}

/** "Step N" ヘッディングかどうか判定 */
function parseStep(heading: string): { step: string; title: string; effect: string } | null {
  const m = heading.match(/^(Step\s*\d+)[：:]\s*(.+?)(?:（(.+?)）)?$/);
  if (!m) return null;
  return { step: m[1], title: m[2], effect: m[3] ?? "" };
}

const STEP_COLORS = [
  { bg: "#EFF6FF", border: "#BFDBFE", badge: "#1D4ED8", text: "#1E3A5F" },
  { bg: "#F0FDF4", border: "#BBF7D0", badge: "#15803D", text: "#14532D" },
  { bg: "#FFF7ED", border: "#FED7AA", badge: "#C2410C", text: "#7C2D12" },
];

export default async function MemberReportPage({ params }: Props) {
  const { slug } = await params;
  const report = REPORTS[slug];
  if (!report) notFound();

  const [year, month, day] = report.publishedAt.split("-");
  const dateLabel = `${year}年${parseInt(month)}月${parseInt(day)}日`;

  let stepCount = 0;

  return (
    <main style={{ background: "var(--color-surface)", minHeight: "100vh" }}>

      {/* ── Hero ── */}
      <section style={{ backgroundColor: "#00338D", padding: "48px 16px 40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94b4d8", marginBottom: 12 }}>
            GCInsight 会員限定レポート · {dateLabel}
          </p>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.3, color: "#FFFFFF", marginBottom: 12 }}>
            {report.title}
          </h1>
          <p style={{ fontSize: "1rem", color: "#c8d8f0", lineHeight: 1.6 }}>
            {report.subtitle}
          </p>
        </div>
      </section>

      {/* ── 本文 ── */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 16px 80px" }}>
        {report.sections.map((section, i) => {
          const stepInfo = parseStep(section.heading);

          /* Step セクション */
          if (stepInfo) {
            const color = STEP_COLORS[stepCount % STEP_COLORS.length];
            stepCount++;
            return (
              <section
                key={i}
                style={{
                  marginBottom: 24,
                  borderRadius: 16,
                  border: `1px solid ${color.border}`,
                  backgroundColor: color.bg,
                  padding: "24px 24px 20px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
                      backgroundColor: color.badge, color: "#fff",
                      padding: "3px 10px", borderRadius: 999,
                    }}
                  >
                    {stepInfo.step}
                  </span>
                  {stepInfo.effect && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: color.badge }}>
                      {stepInfo.effect}
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: color.text, marginBottom: 12 }}>
                  {stepInfo.title}
                </h2>
                <div style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.85 }}>
                  {renderBody(section.body)}
                </div>
              </section>
            );
          }

          /* はじめに — グレーボックス */
          if (section.heading === "はじめに") {
            return (
              <section
                key={i}
                style={{
                  marginBottom: 32,
                  borderRadius: 12,
                  backgroundColor: "#F3F4F6",
                  border: "1px solid #E5E7EB",
                  padding: "20px 24px",
                }}
              >
                <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B7280", marginBottom: 8 }}>
                  {section.heading}
                </h2>
                <div style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.8 }}>
                  {renderBody(section.body)}
                </div>
              </section>
            );
          }

          /* 現状 — 強調ボックス */
          if (section.heading.includes("現状")) {
            return (
              <section
                key={i}
                style={{
                  marginBottom: 32,
                  borderRadius: 12,
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  padding: "20px 24px",
                }}
              >
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#991B1B", marginBottom: 12 }}>
                  {section.heading}
                </h2>
                <div style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.85 }}>
                  {renderBody(section.body)}
                </div>
              </section>
            );
          }

          /* 次号予告・その他 */
          return (
            <section
              key={i}
              style={{
                marginBottom: 32,
                borderBottom: i < report.sections.length - 1 ? "1px solid #E5E7EB" : "none",
                paddingBottom: 32,
              }}
            >
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 10,
                  paddingBottom: 6,
                  borderBottom: "2px solid #E5E7EB",
                }}
              >
                {section.heading}
              </h2>
              <div style={{ fontSize: "0.9rem", color: "#374151", lineHeight: 1.85 }}>
                {renderBody(section.body)}
              </div>
            </section>
          );
        })}

        {/* ── フッターCTA ── */}
        <div
          style={{
            marginTop: 48,
            borderRadius: 16,
            backgroundColor: "#00338D",
            padding: "32px 28px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: "#94b4d8", marginBottom: 8 }}>
            会員限定コンテンツ
          </p>
          <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8 }}>
            毎月のレポートをニュースレターでお届けしています
          </p>
          <p style={{ fontSize: "0.85rem", color: "#c8d8f0", marginBottom: 20 }}>
            未登録の方は右上の「ニュースレター登録」から無料でご参加ください。
          </p>
          <p style={{ fontSize: "0.75rem", color: "#94b4d8" }}>
            このレポートの第三者への転送・SNS掲載はご遠慮ください。
          </p>
        </div>
      </div>
    </main>
  );
}
