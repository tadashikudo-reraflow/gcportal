export interface NewsletterSections {
  issueNumber: number;
  intro: string;
  // 市民・現場の声（メイン）
  voicePicks: Array<{
    source: "x" | "note";
    author: string;
    text: string;
    url: string;
  }>;
  // GCInsightデータ更新
  migrationStats?: { rate: string; completed: string; total: string };
  // GCInsight上のアップデート（資料公開・データ更新など）
  gcupdates: Array<{ date: string; title: string; detail: string }>;
  // 公式情報（補足）
  officialNews: Array<{ title: string; summary: string; url: string; source: string }>;
}

export function renderNewsletterHtml(sections: NewsletterSections): string {
  const { issueNumber, intro, migrationStats, voicePicks, gcupdates, officialNews } = sections;

  const migrationBlock = migrationStats
    ? `
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px;margin:16px 0;">
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px;">移行率</div>
          <div style="font-size:24px;font-weight:700;color:#111;">${migrationStats.rate}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px;">完了団体</div>
          <div style="font-size:24px;font-weight:700;color:#111;">${migrationStats.completed}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:4px;">対象総数</div>
          <div style="font-size:24px;font-weight:700;color:#111;">${migrationStats.total}</div>
        </div>
      </div>
    </div>`
    : "";

  const voicePicksHtml = voicePicks
    .map((p) => {
      if (p.source === "x") {
        return `
    <div style="border-left:3px solid #1d9bf0;background:#f0f9ff;padding:12px;margin-bottom:12px;border-radius:0 4px 4px 0;">
      <div style="font-size:11px;font-weight:600;color:#1d9bf0;margin-bottom:4px;">&#x1D54F; @${escapeHtml(p.author)}</div>
      <div style="font-size:14px;color:#111;line-height:1.6;">${escapeHtml(p.text)}</div>
      ${p.url && p.url !== "#" ? `<a href="${p.url}" style="font-size:12px;color:#1d9bf0;margin-top:6px;display:inline-block;">ポストを見る &rarr;</a>` : ""}
    </div>`;
      } else {
        return `
    <div style="border-left:3px solid #41c9b4;background:#f0fdfb;padding:12px;margin-bottom:12px;border-radius:0 4px 4px 0;">
      <div style="font-size:11px;font-weight:600;color:#41c9b4;margin-bottom:4px;">note ${escapeHtml(p.author)}</div>
      <div style="font-size:14px;color:#111;line-height:1.6;">${escapeHtml(p.text)}</div>
      ${p.url && p.url !== "#" ? `<a href="${p.url}" style="font-size:12px;color:#41c9b4;margin-top:6px;display:inline-block;">記事を読む &rarr;</a>` : ""}
    </div>`;
      }
    })
    .join("");

  const gcupdatesHtml = gcupdates
    .map(
      (s) => `
    <div style="display:flex;gap:12px;margin-bottom:12px;align-items:flex-start;">
      <div style="flex-shrink:0;background:#111;color:#fff;font-size:11px;padding:3px 8px;border-radius:4px;white-space:nowrap;">${escapeHtml(s.date)}</div>
      <div>
        <div style="font-size:14px;font-weight:600;color:#111;">${escapeHtml(s.title)}</div>
        <div style="font-size:13px;color:#6b7280;">${escapeHtml(s.detail)}</div>
      </div>
    </div>`
    )
    .join("");

  const officialNewsHtml = officialNews
    .map(
      (n) => `
    <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f3f4f6;">
      <div style="margin-bottom:4px;">
        <a href="${n.url}" style="font-size:14px;font-weight:600;color:#111;text-decoration:none;">${escapeHtml(n.title)}</a>
        <span style="display:inline-block;margin-left:8px;font-size:11px;background:#f3f4f6;color:#6b7280;padding:2px 6px;border-radius:3px;">${escapeHtml(n.source)}</span>
      </div>
      <div style="font-size:13px;color:#4b5563;line-height:1.6;">${escapeHtml(n.summary)}</div>
    </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GCInsight 週次レポート #${issueNumber}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;">

  <!-- ヘッダー -->
  <div style="background:#111;padding:32px 24px;text-align:center;">
    <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
      GCInsight 週次レポート #${issueNumber}
    </div>
    <div style="font-size:13px;color:#9ca3af;margin-top:6px;">ガバメントクラウド最前線</div>
  </div>

  <!-- 本文 -->
  <div style="padding:32px 24px;">

    <!-- イントロ -->
    <div style="font-size:14px;line-height:1.8;color:#374151;margin-bottom:32px;">
      ${escapeHtml(intro).replace(/\n/g, "<br>")}
    </div>

    <!-- 現場・市民の声 -->
    <div style="margin-bottom:32px;">
      <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:12px;">&#x1F5E3; 現場・市民の声</div>
      ${voicePicksHtml}
    </div>

    <!-- 移行状況 -->
    ${migrationBlock ? `
    <div style="margin-bottom:32px;">
      <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:12px;">&#x1F4CA; 移行状況サマリー</div>
      ${migrationBlock}
    </div>` : ""}

    <!-- GCInsightアップデート -->
    ${gcupdates.length > 0 ? `
    <div style="margin-bottom:32px;">
      <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:12px;">&#x1F4C5; GCInsightアップデート</div>
      ${gcupdatesHtml}
    </div>` : ""}

    <!-- 公式情報（補足） -->
    ${officialNews.length > 0 ? `
    <div style="margin-bottom:32px;">
      <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:12px;">&#x1F4F0; 公式情報</div>
      ${officialNewsHtml}
    </div>` : ""}

  </div>

</div>
</body>
</html>`;
}

/** HTMLエスケープ */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
