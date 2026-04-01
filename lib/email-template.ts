/**
 * GCInsight ニュースレター HTML テンプレート
 *
 * ベストプラクティス準拠:
 * - 600px固定 table-based レイアウト（Outlook/Gmail/Apple Mail対応）
 * - プレヘッダーテキスト設定済み
 * - CTA は末尾1本に集約（記事リンクは小さいテキストリンクで維持）
 * - 読了時間表示
 * - 絵文字はセクション見出しのみ（本文内は使わない）
 * - インラインstyleのみ（CSSクラス・Webフォント不使用）
 * - border-radius はモバイル/Webmail向け装飾のみ（Outlookでは無視される前提）
 */

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
    newsItems = [],
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

  // 読了時間: 記事数 × 0.5分 + ニュース数 × 0.3分、最低2分
  const estMinutes = Math.max(2, Math.round(voicePicks.length * 0.5 + newsItems.length * 0.3 + officialNews.length * 0.2));

  // プレヘッダー用テキスト: イントロ先頭80字
  const preheader = intro.replace(/\n/g, " ").slice(0, 80);

  // ---- ニュースカード（タイトル + 1行要約 + 小リンク） ----
  const newsItemsHtml = newsItems
    .map((n) => `
    <tr>
      <td style="padding:0 0 12px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="border-left:3px solid #0f172a;padding:0 0 0 14px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:4px;">
                    <span style="font-size:10px;font-weight:700;background:#0f172a;color:#ffffff;padding:2px 7px;border-radius:2px;letter-spacing:0.5px;">${e(n.source)}</span>
                    ${n.date ? `<span style="font-size:11px;color:#94a3b8;margin-left:6px;">${e(n.date)}</span>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:5px;">
                    <a href="${n.url}" style="font-size:14px;font-weight:700;color:#0f172a;text-decoration:none;line-height:1.5;">${e(n.title)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:6px;">
                    <span style="font-size:13px;color:#475569;line-height:1.6;">${e(n.summary)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${n.url}" style="font-size:11px;color:#64748b;text-decoration:underline;">全文を読む</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`)
    .join("");

  // ---- X の声（ツイートカード風、3件まで） ----
  const xVoices = voicePicks.filter((p) => p.source === "x").slice(0, 3);
  const noteVoices = voicePicks.filter((p) => p.source === "note").slice(0, 3);

  const xVoicesHtml = xVoices.map((p) => `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
          <tr>
            <td style="padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:8px;">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:8px;background:#1d9bf0;border-radius:2px;">&nbsp;</td>
                        <td style="padding-left:10px;">
                          <span style="font-size:12px;font-weight:700;color:#0f172a;">@${e(p.author)}</span>
                          <span style="font-size:11px;color:#94a3b8;margin-left:6px;">on X</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="font-size:13px;color:#1e293b;line-height:1.7;">${e(p.text)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${p.url}" style="font-size:11px;color:#64748b;text-decoration:underline;">元のポストを見る</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  // ---- note コラム（左ライン付きカード） ----
  const noteVoicesHtml = noteVoices.map((p) => `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
          <tr>
            <td style="padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:6px;">
                    <span style="font-size:10px;font-weight:700;background:#16a34a;color:#ffffff;padding:2px 7px;border-radius:2px;">note</span>
                    <span style="font-size:12px;font-weight:600;color:#0f172a;margin-left:8px;">${e(p.author)}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="font-size:13px;color:#1e293b;line-height:1.7;">${e(p.text)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${p.url}" style="font-size:11px;color:#64748b;text-decoration:underline;">記事を読む</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  // ---- 移行状況サマリー ----
  const migrationBlock = migrationStats ? `
    <tr>
      <td style="padding:0 0 32px 0;">
        ${sectionHeader("📊", "移行状況サマリー")}
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
          <tr>
            <td style="padding:20px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" style="text-align:center;border-right:1px solid #e2e8f0;">
                    <div style="font-size:10px;color:#64748b;letter-spacing:0.5px;margin-bottom:4px;">移行率</div>
                    <div style="font-size:26px;font-weight:800;color:#0f172a;">${e(migrationStats.rate)}</div>
                  </td>
                  <td width="33%" style="text-align:center;border-right:1px solid #e2e8f0;">
                    <div style="font-size:10px;color:#64748b;letter-spacing:0.5px;margin-bottom:4px;">完了団体</div>
                    <div style="font-size:26px;font-weight:800;color:#0f172a;">${e(migrationStats.completed)}</div>
                  </td>
                  <td width="33%" style="text-align:center;">
                    <div style="font-size:10px;color:#64748b;letter-spacing:0.5px;margin-bottom:4px;">対象総数</div>
                    <div style="font-size:26px;font-weight:800;color:#0f172a;">${e(migrationStats.total)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : "";

  // ---- GCInsightアップデート ----
  const gcupdatesHtml = gcupdates.map((s) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
      <tr>
        <td style="width:80px;vertical-align:top;padding-top:2px;">
          <span style="font-size:10px;font-weight:700;background:#0f172a;color:#ffffff;padding:2px 6px;border-radius:2px;white-space:nowrap;">${e(s.date)}</span>
        </td>
        <td style="padding-left:10px;">
          <div style="font-size:13px;font-weight:600;color:#0f172a;line-height:1.4;">${e(s.title)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${e(s.detail)}</div>
        </td>
      </tr>
    </table>`).join("");

  // ---- 公式情報・業界動向（コンパクト一覧） ----
  const officialNewsHtml = officialNews.map((n, i) => `
    <tr>
      <td style="padding:${i === 0 ? "12px" : "10px"} 0 10px 0;${i > 0 ? "border-top:1px solid #f1f5f9;" : ""}">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:3px;">
              <a href="${n.url}" style="font-size:13px;font-weight:600;color:#0f172a;text-decoration:none;line-height:1.4;">${e(n.title)}</a>
              <span style="font-size:10px;font-weight:600;background:#f1f5f9;color:#64748b;padding:1px 6px;border-radius:2px;margin-left:6px;">${e(n.source)}</span>
            </td>
          </tr>
          <tr>
            <td>
              <span style="font-size:12px;color:#64748b;line-height:1.5;">${e(n.summary)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  // ---- 著者・フッター ----
  const authorBlock = authorSignatureHtml ?? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-bottom:4px;">
          <span style="font-size:14px;font-weight:700;color:#0f172a;">${e(authorName ?? "GCInsight編集部")}</span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:14px;">
          <span style="font-size:12px;color:#64748b;line-height:1.5;">${e(authorTitle ?? "元JTC自治体担当 × 外資IT営業 × 政策ウォッチャー × 地方在住")}</span>
        </td>
      </tr>
      <tr>
        <td>
          <a href="https://gcinsight.jp" style="font-size:12px;color:#2563eb;text-decoration:none;">gcinsight.jp</a>
          <span style="font-size:12px;color:#cbd5e1;margin:0 8px;">|</span>
          <a href="https://gcinsight.jp/unsubscribe" style="font-size:12px;color:#94a3b8;text-decoration:none;">配信停止</a>
        </td>
      </tr>
    </table>`;

  // ---- メインCTAボタン（末尾1本） ----
  const mainCta = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px 0;">
      <tr>
        <td align="center">
          <a href="https://gcinsight.jp" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:6px;letter-spacing:0.3px;">
            GCInsightダッシュボードで詳細を見る &rarr;
          </a>
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
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

<!-- プレヘッダー（メーラーで件名の次に表示・本文には不可視） -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#ffffff;">${e(preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:20px 0 32px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">

        <!-- ヘッダー -->
        <tr>
          <td style="background:#0f172a;border-radius:10px 10px 0 0;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">GCINSIGHT WEEKLY #${issueNumber}</div>
                  <div style="font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:6px;">ガバメントクラウド最前線</div>
                  <div style="font-size:13px;color:#94a3b8;">${dateStr}号 &nbsp;&#183;&nbsp; &#128214; 約${estMinutes}分で読めます</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 本文 -->
        <tr>
          <td style="background:#ffffff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- イントロ -->
              <tr>
                <td style="padding-bottom:32px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <div style="font-size:10px;font-weight:700;color:#92400e;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">今週のポイント</div>
                        <div style="font-size:14px;color:#1c1917;line-height:1.9;">${e(intro).replace(/\n\n/g, '</div><div style="font-size:14px;color:#1c1917;line-height:1.9;margin-top:12px;">').replace(/\n/g, "<br>")}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- 今週のニュース -->
              ${newsItems.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("📰", "今週のガバクラニュース")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                    ${newsItemsHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- X の声（最大3件） -->
              ${xVoices.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("💬", "現場の声（X より）")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                    ${xVoicesHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- note コラム -->
              ${noteVoices.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("📝", "専門家コラム（note より）")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                    ${noteVoicesHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- 移行状況 -->
              ${migrationBlock}

              <!-- GCInsightアップデート -->
              ${gcupdates.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("📅", "GCInsightデータ更新")}
                  <div style="margin-top:14px;">${gcupdatesHtml}</div>
                </td>
              </tr>` : ""}

              <!-- 公式情報・業界動向 -->
              ${officialNews.length > 0 ? `
              <tr>
                <td style="padding-bottom:8px;">
                  ${sectionHeader("🏛", "公式情報・業界動向")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
                    ${officialNewsHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- メインCTA（末尾1本） -->
              <tr>
                <td>
                  ${mainCta}
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- フッター -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:20px 32px 24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e2e8f0;padding-top:20px;">
              <tr>
                <td>
                  ${authorBlock}
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

function sectionHeader(emoji: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="border-bottom:2px solid #0f172a;padding-bottom:10px;">
        <span style="font-size:15px;font-weight:800;color:#0f172a;">${emoji} ${e(label)}</span>
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
