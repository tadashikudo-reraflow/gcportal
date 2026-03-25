export const dynamic = "force-dynamic";
export const metadata = { title: "設定 | GCInsight Admin" };

type EnvItem = {
  label: string;
  value: string | undefined;
  mask?: boolean;
};

export default function SettingsPage() {
  const items: EnvItem[] = [
    { label: "サイトURL", value: "https://gcinsight.jp" },
    { label: "GA4 Measurement ID", value: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID },
    { label: "Supabase URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { label: "Resend APIキー", value: process.env.RESEND_API_KEY, mask: true },
    { label: "Beehiiv Publication ID", value: process.env.BEEHIIV_PUBLICATION_ID },
    { label: "Beehiiv APIキー", value: process.env.BEEHIIV_API_KEY, mask: true },
    { label: "Telegram Bot Token", value: process.env.TELEGRAM_BOT_TOKEN, mask: true },
    { label: "Telegram Chat ID", value: process.env.TELEGRAM_CHAT_ID },
    { label: "Cron Secret", value: process.env.CRON_SECRET, mask: true },
  ];

  function display(item: EnvItem): { text: string; set: boolean } {
    if (!item.value) return { text: "未設定", set: false };
    if (item.mask) return { text: item.value.slice(0, 6) + "••••••••", set: true };
    return { text: item.value, set: true };
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      <div className="px-6 py-5 border-b" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
        <h1 className="text-xl font-extrabold" style={{ color: "#002D72" }}>設定</h1>
        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
          環境変数の設定状況を確認できます。変更はVercelの環境変数で行ってください。
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#e5e7eb" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}>
            <h2 className="font-bold text-sm" style={{ color: "#002D72" }}>環境変数ステータス</h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
            {items.map((item) => {
              const { text, set } = display(item);
              return (
                <div key={item.label} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: set ? "#16a34a" : "#d1d5db" }}
                    />
                    <span className="text-sm font-medium" style={{ color: "#374151" }}>{item.label}</span>
                  </div>
                  <span
                    className="text-xs font-mono truncate max-w-xs"
                    style={{ color: set ? "#6b7280" : "#ef4444" }}
                  >
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs mt-4 text-center" style={{ color: "#9ca3af" }}>
          変更は <a href="https://vercel.com" target="_blank" className="underline">Vercel Dashboard</a> の Environment Variables で行ってください。
        </p>
      </div>
    </div>
  );
}
