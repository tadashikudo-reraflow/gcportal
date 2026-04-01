export interface NewsletterSections {
  issueNumber: number;
  intro: string;
  newsItems?: Array<{ title: string; summary: string; url: string; source: string; date?: string }>;
  voicePicks: Array<{
    source: "x" | "note";
    author: string;
    text: string;
    url: string;
  }>;
  migrationStats?: { rate: string; completed: string; total: string };
  gcupdates: Array<{ date: string; title: string; detail: string }>;
  officialNews: Array<{ title: string; summary: string; url: string; source: string }>;
  authorName?: string;
  authorTitle?: string;
  authorStyle?: string;
  authorSignatureHtml?: string;
}

export function renderNewsletterHtml(sections: NewsletterSections): string {
  const {
    issueNumber,
    intro,
    newsItems,
    migrationStats,
    voicePicks,
    gcupdates,
    officialNews,
    authorName,
    authorTitle,
    authorSignatureHtml,
  } = sections;

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  // ---- News cards ----
  const newsItemsHtml = (newsItems ?? [])
    .map((n) => `
      <tr>
        <td style="padding:0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-bottom:8px;">
                      <span style="font-size:10px;font-weight:700;background:#0f172a;color:#ffffff;padding:3px 8px;border-radius:3px;letter-spacing:0.5px;text-transform:uppercase;">${e(n.source)}</span>
                      ${n.date ? `<span style="font-size:11px;color:#94a3b8;margin-left:8px;">${e(n.date)}</span>` : ""}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px;">
                      <a href="${n.url}" style="font-size:15px;font-weight:700;color:#0f172a;text-decoration:none;line-height:1.5;">${e(n.title)}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;">
                      <span style="font-size:13px;color:#475569;line-height:1.7;">${e(n.summary)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${n.url}" style="font-size:12px;color:#2563eb;font-weight:600;text-decoration:none;">続きを読む &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`)
    .join("");

  // ---- Voice picks ----
  const xVoices = voicePicks.filter((p) => p.source === "x");
  const noteVoices = voicePicks.filter((p) => p.source === "note");

  const xVoicesHtml = xVoices.map((p) => `
      <tr>
        <td style="padding:0 0 12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-bottom:10px;">
                      <table cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="width:36px;height:36px;background:#e7f3ff;border-radius:50%;text-align:center;vertical-align:middle;">
                            <span style="font-size:18px;line-height:36px;">𝕏</span>
                          </td>
                          <td style="padding-left:10px;">
                            <div style="font-size:13px;font-weight:700;color:#0f172a;">@${e(p.author)}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:12px;">
                      <span style="font-size:14px;color:#1e293b;line-height:1.7;">${e(p.text)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${p.url}" style="font-size:12px;color:#1d9bf0;font-weight:600;text-decoration:none;">ポストを見る &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("");

  const noteVoicesHtml = noteVoices.map((p) => `
      <tr>
        <td style="padding:0 0 12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #d1fae5;border-radius:12px;overflow:hidden;border-left:4px solid #10b981;">
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-bottom:6px;">
                      <span style="font-size:10px;font-weight:700;background:#10b981;color:#ffffff;padding:2px 8px;border-radius:3px;">note</span>
                      <span style="font-size:13px;font-weight:600;color:#0f172a;margin-left:8px;">${e(p.author)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:10px;">
                      <span style="font-size:14px;color:#1e293b;line-height:1.7;">${e(p.text)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${p.url}" style="font-size:12px;color:#10b981;font-weight:600;text-decoration:none;">記事を読む &rarr;</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("");

  // ---- Migration stats ----
  const migrationBlock = migrationStats ? `
      <tr>
        <td style="padding:0 0 36px 0;">
          ${sectionHeader("📊", "移行状況サマリー")}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-top:16px;">
            <tr>
              <td style="padding:20px 24px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:40px;text-align:center;">
                      <div style="font-size:11px;color:#64748b;margin-bottom:4px;letter-spacing:0.5px;text-transform:uppercase;">移行率</div>
                      <div style="font-size:28px;font-weight:800;color:#0f172a;">${e(migrationStats.rate)}</div>
                    </td>
                    <td style="padding-right:40px;text-align:center;border-left:1px solid #e2e8f0;padding-left:40px;">
                      <div style="font-size:11px;color:#64748b;margin-bottom:4px;letter-spacing:0.5px;text-transform:uppercase;">完了団体</div>
                      <div style="font-size:28px;font-weight:800;color:#0f172a;">${e(migrationStats.completed)}</div>
                    </td>
                    <td style="text-align:center;border-left:1px solid #e2e8f0;padding-left:40px;">
                      <div style="font-size:11px;color:#64748b;margin-bottom:4px;letter-spacing:0.5px;text-transform:uppercase;">対象総数</div>
                      <div style="font-size:28px;font-weight:800;color:#0f172a;">${e(migrationStats.total)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>` : "";

  // ---- GC updates ----
  const gcupdatesHtml = gcupdates.map((s) => `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
        <tr>
          <td style="width:90px;vertical-align:top;padding-right:12px;">
            <span style="font-size:10px;font-weight:700;background:#0f172a;color:#ffffff;padding:3px 7px;border-radius:3px;white-space:nowrap;">${e(s.date)}</span>
          </td>
          <td>
            <div style="font-size:14px;font-weight:600;color:#0f172a;">${e(s.title)}</div>
            <div style="font-size:13px;color:#64748b;margin-top:2px;">${e(s.detail)}</div>
          </td>
        </tr>
      </table>`).join("");

  // ---- Official news ----
  const officialNewsHtml = officialNews.map((n, i) => `
      <tr>
        <td style="padding:${i === 0 ? "0" : "16px"} 0 16px 0;${i > 0 ? "border-top:1px solid #f1f5f9;" : ""}">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-bottom:4px;">
                <a href="${n.url}" style="font-size:14px;font-weight:600;color:#0f172a;text-decoration:none;line-height:1.5;">${e(n.title)}</a>
                <span style="display:inline-block;margin-left:6px;font-size:10px;font-weight:600;background:#f1f5f9;color:#64748b;padding:2px 7px;border-radius:3px;">${e(n.source)}</span>
              </td>
            </tr>
            <tr>
              <td>
                <span style="font-size:13px;color:#475569;line-height:1.6;">${e(n.summary)}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("");

  // ---- Author block ----
  const authorBlock = authorSignatureHtml ?? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid #0f172a;margin-top:32px;padding-top:24px;">
      <tr>
        <td style="padding-top:24px;">
          <div style="font-size:15px;font-weight:700;color:#0f172a;">${e(authorName ?? "GCInsight編集部")}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px;line-height:1.5;">${e(authorTitle ?? "元JTC自治体担当 × 外資IT営業 × 政策ウォッチャー × 地方在住")}</div>
          <div style="margin-top:12px;">
            <a href="https://gcinsight.jp" style="font-size:13px;color:#2563eb;text-decoration:none;">gcinsight.jp</a>
            <span style="font-size:13px;color:#94a3b8;margin:0 8px;">|</span>
            <a href="https://gcinsight.jp/unsubscribe" style="font-size:13px;color:#94a3b8;text-decoration:none;">配信停止</a>
          </div>
        </td>
      </tr>
    </table>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GCInsight 週次レポート #${issueNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:24px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- ヘッダー -->
        <tr>
          <td style="background:#0f172a;border-radius:12px 12px 0 0;padding:32px 32px 28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <div style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">GCINSIGHT WEEKLY</div>
                  <div style="font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">ガバメントクラウド最前線<br><span style="font-size:14px;font-weight:500;color:#94a3b8;">#${issueNumber} — ${dateStr}号</span></div>
                </td>
                <td align="right" valign="top">
                  <div style="background:#1e3a5f;border-radius:8px;padding:8px 14px;display:inline-block;">
                    <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;">ISSUE</div>
                    <div style="font-size:24px;font-weight:900;color:#ffffff;line-height:1;">#${issueNumber}</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 本文 -->
        <tr>
          <td style="background:#ffffff;padding:32px 32px 8px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">

            <!-- イントロ -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:36px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;">
                    <tr>
                      <td style="padding:20px 24px;">
                        <div style="font-size:11px;font-weight:700;color:#92400e;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">✍️ 今週のまとめ</div>
                        <div style="font-size:14px;color:#1c1917;line-height:1.9;">${e(intro).replace(/\n/g, "<br>")}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- 今週のニュース -->
              ${(newsItems ?? []).length > 0 ? `
              <tr>
                <td style="padding-bottom:36px;">
                  ${sectionHeader("📰", "今週のガバクラニュース")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                    ${newsItemsHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- X の声 -->
              ${xVoices.length > 0 ? `
              <tr>
                <td style="padding-bottom:24px;">
                  ${sectionHeader("𝕏", "X（Twitter）の声")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                    ${xVoicesHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- note の声 -->
              ${noteVoices.length > 0 ? `
              <tr>
                <td style="padding-bottom:36px;">
                  ${sectionHeader("📝", "note 専門家コラム")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                    ${noteVoicesHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- 移行状況 -->
              ${migrationBlock}

              <!-- GCInsightアップデート -->
              ${gcupdates.length > 0 ? `
              <tr>
                <td style="padding-bottom:36px;">
                  ${sectionHeader("📅", "GCInsightデータ更新")}
                  <div style="margin-top:16px;">${gcupdatesHtml}</div>
                </td>
              </tr>` : ""}

              <!-- 公式情報 -->
              ${officialNews.length > 0 ? `
              <tr>
                <td style="padding-bottom:36px;">
                  ${sectionHeader("🏛", "公式情報・業界動向")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                    ${officialNewsHtml}
                  </table>
                </td>
              </tr>` : ""}

            </table>
          </td>
        </tr>

        <!-- フッター -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px 32px 32px 32px;">
            ${authorBlock}
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

function sectionHeader(icon: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="border-bottom:2px solid #0f172a;padding-bottom:10px;">
        <span style="font-size:16px;font-weight:800;color:#0f172a;">${icon} ${e(label)}</span>
      </td>
    </tr>
  </table>`;
}

function e(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
