"use client";

type Props = {
  source: string;
  title?: string;
  description?: string;
  compact?: boolean;
};

function openNewsletterModal(source: string) {
  window.dispatchEvent(
    new CustomEvent("openLeadModal", { detail: { source: `newsletter_${source}` } })
  );
}

export default function ReportLeadCta({
  source,
  title = "ガバメントクラウド最新動向をメールでお届け",
  description = "総務省・デジタル庁の動向、全国1,741自治体の移行進捗、ベンダー動向を毎週まとめてお届けします。",
  compact = false,
}: Props) {
  if (compact) {
    return (
      <div
        className="rounded-xl border px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}
      >
        <div>
          <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>
            ニュースレター登録（無料）
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "#111827" }}>
            {title}
          </p>
          <p className="mt-1 text-xs leading-6" style={{ color: "#475569" }}>
            {description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openNewsletterModal(source)}
          className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "#1d4ed8", color: "#ffffff", border: "none", cursor: "pointer" }}
        >
          無料で登録する
        </button>
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border p-6"
      style={{ borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>
            ニュースレター登録（無料）
          </p>
          <h2 className="mt-2 text-xl font-bold" style={{ color: "#111827" }}>
            {title}
          </h2>
          <p className="mt-2 text-sm leading-7" style={{ color: "#475569" }}>
            {description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {[
              "週次でデータ更新情報を配信",
              "政策・ベンダー動向の分析",
              "登録者限定レポートあり",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full px-3 py-1 font-medium"
                style={{ backgroundColor: "#ffffff", color: "#1e3a8a", border: "1px solid #bfdbfe" }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[240px]">
          <button
            type="button"
            onClick={() => openNewsletterModal(source)}
            className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
            style={{ backgroundColor: "#1d4ed8", color: "#ffffff", border: "none", cursor: "pointer" }}
          >
            無料でニュースレターに登録する
          </button>
          <p className="text-xs text-center" style={{ color: "#475569" }}>
            入力はメールアドレスとご所属のみ
          </p>
        </div>
      </div>
    </section>
  );
}
