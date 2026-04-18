import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import NewsletterBanner from "@/components/NewsletterBanner";

export const metadata: Metadata = {
  title: "ガバクラ週報 — 無料ニュースレター｜GCInsight",
  description:
    "デジタル庁の移行データ更新を即通知。自治体DX担当者・SIer・コンサルが読む週次ガバメントクラウド実務ダイジェスト。毎週金曜配信・無料。",
  alternates: { canonical: "/newsletter" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "ガバクラ週報 — 無料ニュースレター｜GCInsight",
    description:
      "デジタル庁の移行データ更新を即通知。自治体DX担当者・SIer・コンサルが読む週次ガバメントクラウド実務ダイジェスト。毎週金曜配信・無料。",
    type: "website",
    siteName: "GCInsight",
    locale: "ja_JP",
    images: [
      {
        url: "/og?title=ガバクラ週報&subtitle=毎週金曜配信・無料ニュースレター",
        width: 1200,
        height: 630,
        alt: "GCInsight ガバクラ週報 ニュースレター",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ガバクラ週報 — 無料ニュースレター｜GCInsight",
    description:
      "デジタル庁の移行データ更新を即通知。自治体DX担当者・SIer・コンサルが読む週次実務ダイジェスト。",
    images: ["/og?title=ガバクラ週報&subtitle=毎週金曜配信・無料ニュースレター"],
  },
};

/* ============================================================
   Section 4: サンプル号（ダミー）
   ============================================================ */
const SAMPLE_ISSUE = {
  number: "Vol.3",
  date: "2025年6月20日（金）",
  subject: "デジタル庁、移行完了率が初めて30%超え ／ TKCが新スケジュール発表",
  items: [
    {
      tag: "データ更新",
      tagColor: "#DBEAFE",
      tagText: "#1E40AF",
      title: "移行完了率が30.2%に到達 — 6月第3週デジタル庁データ差分レポート",
      body: "6月17日（月）のデータ更新で、移行完了自治体数が525団体に達し、初めて30%の節目を超えました。北関東・東北ブロックの伸びが顕著で、前週比+18団体。依然として北海道・四国は完了率15%台に留まっています。",
    },
    {
      tag: "ベンダー動向",
      tagColor: "#D1FAE5",
      tagText: "#065F46",
      title: "TKC、住民記録・税務標準化パッケージの移行スケジュールを改訂",
      body: "TKCは2025年6月18日付で、標準準拠パッケージ「e-Gov クラウド」の住民記録・税務モジュールの移行スケジュールを改訂。一部自治体向けの完了目標を2026年3月から同年9月に延期。影響自治体数は非公表。",
    },
    {
      tag: "コスト動向",
      tagColor: "#FEF3C7",
      tagText: "#92400E",
      title: "AWS Government Cloud 調達単価、前四半期比で平均7%上昇",
      body: "総務省の公表資料をもとに集計したところ、2025年4〜6月期のAWS Government Cloud利用費は前四半期比7.1%増。マルチリージョン構成を採用した自治体で割高傾向が目立ちます。GCP・Azureは横ばい。OCIは政府向け固定価格のため変動なし。",
    },
    {
      tag: "実務Tips",
      tagColor: "#F3E8FF",
      tagText: "#6B21A8",
      title: "「特定移行認定」申請を検討する前に確認すべき3点",
      body: "特定移行認定を受けると移行期限の延長が認められますが、申請には証跡書類の整備とデジタル庁への報告義務が伴います。申請前に（1）原因の特定、（2）代替手段の検討記録、（3）住民への影響試算 — の3点を文書化しておくことが審査通過の鍵です。",
    },
    {
      tag: "注目記事",
      tagColor: "#E0F2FE",
      tagText: "#0369A1",
      title: "GCInsight コラム：移行遅延が続く自治体に共通する3つのパターン",
      body: "ダッシュボードデータを分析した結果、移行が計画より6ヶ月以上遅延している自治体には「ベンダーロックイン」「庁内リソース不足」「業務要件の未確定」という3つのパターンが繰り返し確認されました。詳細はコラム記事で。",
    },
  ],
};

/* ============================================================
   Section 2: ペインポイント
   ============================================================ */
const PAIN_POINTS = [
  {
    icon: "📄",
    text: "デジタル庁のデータ更新に気づくのが遅れ、報告資料に古い数字を使ってしまった",
  },
  {
    icon: "🔍",
    text: "TKCや富士通の最新スケジュールをベンダーサイトで探すのに30分かかる",
  },
  {
    icon: "💸",
    text: "AWS・GCP・Azureのコスト動向が分散していて、比較資料を作るのが大変",
  },
  {
    icon: "📰",
    text: "自治体標準化に関するニュースが多すぎて、業務に関係する情報だけ抽出できない",
  },
];

/* ============================================================
   Section 3: バリュー
   ============================================================ */
const VALUE_ITEMS = [
  {
    number: "01",
    title: "デジタル庁データ更新を即通知",
    description:
      "移行進捗データが更新されたタイミングを検知し、前週との差分サマリーをニュースレターに掲載します。「知らないうちに数字が変わっていた」を防ぎます。",
    accent: "#00338D",
  },
  {
    number: "02",
    title: "週1実務ダイジェスト（3〜5本）",
    description:
      "ガバメントクラウド・自治体標準化に関する注目ニュースを厳選して3〜5本まとめ。読む時間は5分以内。業務判断に直結する情報だけを届けます。",
    accent: "#00338D",
  },
  {
    number: "03",
    title: "ベンダー最新動向",
    description:
      "TKC・富士通・NEC・日立・NTTデータ等の標準準拠パッケージに関するリリース情報・スケジュール変更・移行実績をまとめて確認できます。",
    accent: "#00338D",
  },
  {
    number: "04",
    title: "クラウドコスト分析ハイライト",
    description:
      "AWS/GCP/Azure/OCIの調達費用動向・自治体事例に基づくコスト試算のポイントを毎週お届け。FinOps実践のインプットとして活用できます。",
    accent: "#00338D",
  },
];

/* ============================================================
   対象読者
   ============================================================ */
const READER_TYPES = [
  { label: "自治体DX担当者", desc: "標準化・移行スケジュール管理に" },
  { label: "IT企業・SIer", desc: "提案・案件開拓のインプットに" },
  { label: "コンサル・シンクタンク", desc: "調査・分析・レポート作成に" },
  { label: "議員・政策担当者", desc: "行政デジタル化の現状把握に" },
];

export default function NewsletterPage() {
  return (
    <div className="space-y-0">
      <Breadcrumb items={[{ label: "ニュースレター" }]} />

      {/* ============================================================
          Section 1: ヒーロー（Above the Fold）
          ============================================================ */}
      <section
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "1.5rem",
        }}
      >
        {/* ネイビーアクセントライン */}
        <div style={{ height: 4, background: "var(--color-brand-primary)" }} />

        <div
          style={{
            padding: "2.5rem 2rem 2rem",
            maxWidth: 760,
          }}
        >
          {/* Eyebrow */}
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-brand-primary)" }}
          >
            無料ニュースレター — 毎週金曜配信
          </p>

          {/* メインヘッドライン */}
          <h1
            className="font-extrabold leading-tight mb-4"
            style={{
              fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
              color: "var(--color-text-primary)",
              lineHeight: 1.3,
            }}
          >
            ガバメントクラウドの「今週何が動いたか」を
            <br />
            <span style={{ color: "var(--color-brand-primary)" }}>
              5分で把握できるニュースレター
            </span>
          </h1>

          {/* サブコピー */}
          <p
            className="mb-6"
            style={{
              fontSize: "1rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.8,
              maxWidth: 600,
            }}
          >
            デジタル庁データ更新の即通知・ベンダー動向・クラウドコスト分析を毎週金曜にまとめて届けます。
            <strong style={{ color: "var(--color-text-primary)" }}>
              自治体職員・SIer・コンサルタント
            </strong>
            が業務のインプットとして活用しています。スパムなし、いつでも解除可。
          </p>

          {/* フォーム */}
          <div style={{ maxWidth: 620 }}>
            <NewsletterBanner />
          </div>

          {/* 対象読者バッジ */}
          <div className="flex flex-wrap gap-2 mt-4">
            {READER_TYPES.map((r) => (
              <span
                key={r.label}
                className="text-xs font-medium px-3 py-1 rounded-full"
                style={{
                  background: "var(--color-section-bg)",
                  color: "var(--color-text-secondary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          Section 2: ペイン（今の情報収集の大変さ）
          ============================================================ */}
      <section
        style={{
          background: "var(--color-section-bg)",
          borderRadius: 16,
          padding: "2rem",
          marginBottom: "1.5rem",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          こんな経験はありませんか？
        </p>
        <h2
          className="font-bold mb-5"
          style={{
            fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)",
            color: "var(--color-text-primary)",
            lineHeight: 1.4,
          }}
        >
          ガバクラ情報の収集・整理に、週に何時間使っていますか？
        </h2>

        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {PAIN_POINTS.map((p) => (
            <div
              key={p.text}
              className="flex items-start gap-3"
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "1rem 1.125rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: "1.25rem", flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {p.text}
              </p>
            </div>
          ))}
        </div>

        <p
          className="mt-5 font-semibold"
          style={{
            fontSize: "0.9375rem",
            color: "var(--color-brand-primary)",
          }}
        >
          GCInsight ニュースレターは、この情報収集コストをゼロにします。
        </p>
      </section>

      {/* ============================================================
          Section 3: バリュー（4点）
          ============================================================ */}
      <section
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "1.5rem",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-brand-primary)" }}
        >
          毎週届く4つの情報
        </p>
        <h2
          className="font-bold mb-6"
          style={{
            fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)",
            color: "var(--color-text-primary)",
            lineHeight: 1.4,
          }}
        >
          業務判断に直結する情報だけを、厳選してお届け
        </h2>

        <div className="space-y-4">
          {VALUE_ITEMS.map((v) => (
            <div
              key={v.number}
              className="flex gap-4 items-start"
              style={{
                borderLeft: `3px solid ${v.accent}`,
                paddingLeft: "1.25rem",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <span
                  className="font-extrabold tabular-nums"
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--color-text-muted)",
                    display: "block",
                    letterSpacing: "0.05em",
                    marginBottom: 4,
                  }}
                >
                  {v.number}
                </span>
                <h3
                  className="font-bold"
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--color-text-primary)",
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  {v.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.7,
                    margin: "0.375rem 0 0",
                  }}
                >
                  {v.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 頻度・文量の補足 */}
        <div
          className="flex flex-wrap gap-4 mt-6 pt-5"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {[
            { label: "配信頻度", value: "週1回（毎週金曜）" },
            { label: "読む時間", value: "約5分" },
            { label: "料金", value: "無料" },
            { label: "解除", value: "いつでも即時" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col">
              <span
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  color: "var(--color-text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginTop: 2,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          Section 4: サンプル号（ダミー）
          ============================================================ */}
      <section style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {/* サンプルヘッダー */}
          <div
            style={{
              background: "var(--color-section-bg)",
              borderBottom: "1px solid var(--color-border)",
              padding: "1.25rem 1.75rem",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              サンプル号 — 登録前に内容を確認できます
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="font-bold"
                style={{ fontSize: "0.9375rem", color: "var(--color-brand-primary)" }}
              >
                GCInsight ガバクラ週報 {SAMPLE_ISSUE.number}
              </span>
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {SAMPLE_ISSUE.date}
              </span>
            </div>
            <p
              className="font-semibold mt-1"
              style={{
                fontSize: "0.9375rem",
                color: "var(--color-text-primary)",
                lineHeight: 1.5,
              }}
            >
              件名: {SAMPLE_ISSUE.subject}
            </p>
          </div>

          {/* サンプル本文 */}
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {SAMPLE_ISSUE.items.map((item, i) => (
              <div key={i} style={{ padding: "1.25rem 1.75rem" }}>
                <div className="flex items-start gap-3">
                  <div style={{ flexShrink: 0, paddingTop: 2 }}>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: item.tagColor,
                        color: item.tagText,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <div>
                    <h4
                      className="font-bold mb-1"
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--color-text-primary)",
                        lineHeight: 1.45,
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.75,
                        margin: 0,
                      }}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* サンプルフッター */}
          <div
            style={{
              background: "var(--color-section-bg)",
              borderTop: "1px solid var(--color-border)",
              padding: "1rem 1.75rem",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                margin: 0,
              }}
            >
              ※ これはサンプル号です。実際のニュースレターは毎週金曜日に配信されます。登録解除はワンクリックで可能です。
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          Section 5: CTA（再掲）
          ============================================================ */}
      <section
        style={{
          background: "var(--color-brand-primary)",
          borderRadius: 16,
          padding: "2rem",
          marginBottom: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景装飾 */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -20,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.03)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", maxWidth: 640 }}>
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            無料 — スパムなし — いつでも解除可
          </p>
          <h2
            className="font-bold mb-2"
            style={{
              fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
              color: "#FFFFFF",
              lineHeight: 1.35,
            }}
          >
            今すぐ登録して、次の金曜から届き始めます
          </h2>
          <p
            className="mb-5"
            style={{
              fontSize: "0.9375rem",
              color: "rgba(255,255,255,0.8)",
              lineHeight: 1.7,
            }}
          >
            全国1,741自治体のガバメントクラウド移行状況を追い続けるGCInsightが、
            週に1度・5分で読める形に凝縮してお届けします。
          </p>

          {/* フォーム（白背景で反転） */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "1.25rem",
            }}
          >
            <NewsletterBanner />
          </div>

          {/* 対象読者一覧 */}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4">
            {READER_TYPES.map((r) => (
              <div key={r.label} className="flex items-center gap-1.5">
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.5)",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {r.label}向け
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ダッシュボードへの回遊リンク */}
      <div
        className="flex flex-wrap items-center gap-3 pb-2"
        style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem" }}
      >
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
          GCInsight は無料で使えるダッシュボードです。
        </p>
        <a
          href="/"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--color-brand-primary)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          移行状況ダッシュボードを見る
        </a>
      </div>
    </div>
  );
}
