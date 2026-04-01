/**
 * GCInsight ニュースレター HTML テンプレート
 *
 * ── 設計ルール ──────────────────────────────────────────────────────────────
 *
 * 【段落の使い方】
 *   - イントロは \n\n で段落を分ける（1段落 = 1トピック）
 *   - 推奨構成: 冒頭断言（1文）→ 背景・状況（2-3文）→ 読者への含意（1-2文）
 *   - 1段落あたり60〜120字。それ以上は分割する
 *   - 本文内に絵文字を使わない（セクション見出しのみ可）
 *
 * 【セクション順序（重要度順）】
 *   1. ヘッダー（ブランド + 号数 + 日付 + 読了時間）
 *   2. イントロ（今週の核心を断言・3段落構成）
 *   3. 現場の声（X + note を1セクションに統合）← 最もエンゲージメントを引くコンテンツを前に
 *   4. 今週のニュース（詳細記事へのリンク）
 *   5. 移行状況サマリー（データがある場合）
 *   6. 公式情報・業界動向（補足）
 *   7. メインCTA（末尾1本）
 *   8. フッター
 *
 * 【CTA ルール】
 *   - メインCTAは末尾1本のみ
 *   - 記事リンクは「全文を読む」小テキストリンクで維持（セカンダリ）
 *   - 「続きを読む」「詳細はこちら」が乱立しない
 *
 * 【メーラー互換】
 *   - table-based レイアウト（Flexbox/Grid 不使用）
 *   - インラインstyleのみ（CSSクラス・Webフォント不使用）
 *   - 600px固定幅
 *   - SVG不使用（絵文字テキストで代替）
 *
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface NewsletterSections {
  issueNumber: number;
  /** 段落区切りは \n\n で。推奨: 3段落（断言→背景→含意） */
  intro: string;
  newsItems?: Array<{ title: string; summary: string; url: string; source: string; date?: string }>;
  /** X: max 3件 / note: max 3件。合計6件まで。それ以上は自動で切り捨て */
  voicePicks: Array<{
    source: "x" | "note";
    author: string;
    text: string;
    url: string;
  }>;
  migrationStats?: { rate: string; completed: string; total: string };
  gcupdates: Array<{ date: string; title: string; detail: string }>;
  /** 公式情報: デジタル庁・総務省・ベンダー公式PRのみ */
  officialNews: Array<{ title: string; summary: string; url: string; source: string }>;
  /**
   * 関連記事: Qiita・Zenn・PR Times等のUGC・技術記事・寄稿
   * officialNews と明確に区別する（公式≠UGC）
   */
  relatedArticles?: Array<{ title: string; summary: string; url: string; source: string }>;
  authorName?: string;
  authorTitle?: string;
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
    relatedArticles = [],
    authorName,
    authorTitle,
    authorSignatureHtml,
  } = sections;

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

  // 読了時間（コンテンツ量から自動算出、最低2分）
  const estMinutes = Math.max(2, Math.round(
    voicePicks.length * 0.5 + newsItems.length * 0.4 +
    officialNews.length * 0.2 + relatedArticles.length * 0.2
  ));

  // プレヘッダー: イントロ先頭80字（メーラーで件名の次に表示）
  const preheader = intro.replace(/\n/g, " ").slice(0, 80);

  // ── イントロ段落化 ────────────────────────────────────────────────────────
  // \n\n で段落分割 → 各段落を <p> タグで包む
  const introParagraphsHtml = intro
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((p) =>
      `<p style="margin:0 0 20px 0;font-size:16px;color:#1c1917;line-height:1.85;">${e(p.trim()).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  // ── 現場の声（X + note を統合） ──────────────────────────────────────────
  // X は max 3件、note は max 3件
  const xVoices = voicePicks.filter((p) => p.source === "x").slice(0, 3);
  const noteVoices = voicePicks.filter((p) => p.source === "note").slice(0, 3);
  // X → note の順で表示
  const allVoices = [...xVoices, ...noteVoices];

  const voicePicksHtml = allVoices.map((p) => {
    const isX = p.source === "x";
    const accentColor = isX ? "#1d9bf0" : "#16a34a";
    const bgColor = isX ? "#f0f7ff" : "#f0fdf4";
    const borderColor = isX ? "#bfdbfe" : "#bbf7d0";
    const badgeLabel = isX ? "X" : "note";
    const badgeBg = isX ? "#1d9bf0" : "#16a34a";
    const linkLabel = isX ? "元のポストを見る" : "記事を読む";

    return `
    <tr>
      <td style="padding:0 0 10px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:${bgColor};border:1px solid ${borderColor};border-radius:8px;">
          <tr>
            <td style="padding:14px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:7px;">
                    <span style="font-size:10px;font-weight:700;background:${badgeBg};color:#ffffff;
                      padding:2px 8px;border-radius:3px;letter-spacing:0.3px;">${badgeLabel}</span>
                    <span style="font-size:12px;font-weight:600;color:#0f172a;margin-left:8px;">
                      ${isX ? "@" : ""}${e(p.author)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:9px;">
                    <span style="font-size:15px;color:#1e293b;line-height:1.8;">${e(p.text)}</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <a href="${p.url}"
                      style="font-size:11px;color:${accentColor};text-decoration:underline;">${linkLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("");

  // ── ニュースカード ────────────────────────────────────────────────────────
  const newsItemsHtml = newsItems.map((n) => `
    <tr>
      <td style="padding:0 0 12px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="border-left:3px solid #0f172a;padding-left:14px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:5px;">
                    <span style="font-size:10px;font-weight:700;background:#0f172a;color:#fff;
                      padding:2px 7px;border-radius:2px;letter-spacing:0.5px;">${e(n.source)}</span>
                    ${n.date ? `<span style="font-size:11px;color:#94a3b8;margin-left:6px;">${e(n.date)}</span>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:5px;">
                    <a href="${n.url}"
                      style="font-size:15px;font-weight:700;color:#0f172a;text-decoration:none;line-height:1.5;">
                      ${e(n.title)}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:6px;">
                    <span style="font-size:14px;color:#475569;line-height:1.7;">${e(n.summary)}</span>
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
    </tr>`).join("");

  // ── 移行状況サマリー ──────────────────────────────────────────────────────
  const migrationBlock = migrationStats ? `
    <tr>
      <td style="padding:0 0 32px 0;">
        ${sectionHeader("📊", "移行状況サマリー", "全国1,741自治体の標準化移行進捗です。")}
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="margin-top:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;">
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

  // ── GCInsightアップデート ─────────────────────────────────────────────────
  const gcupdatesHtml = gcupdates.map((s) => `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
      <tr>
        <td style="width:80px;vertical-align:top;padding-top:2px;">
          <span style="font-size:10px;font-weight:700;background:#0f172a;color:#fff;
            padding:2px 6px;border-radius:2px;white-space:nowrap;">${e(s.date)}</span>
        </td>
        <td style="padding-left:10px;">
          <div style="font-size:13px;font-weight:600;color:#0f172a;line-height:1.4;">${e(s.title)}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${e(s.detail)}</div>
        </td>
      </tr>
    </table>`).join("");

  // ── 公式情報（デジタル庁・総務省・ベンダー公式PRのみ） ───────────────────
  const officialNewsHtml = officialNews.map((n, i) => `
    <tr>
      <td style="padding:${i === 0 ? "10px" : "12px"} 0 12px 0;
        ${i > 0 ? "border-top:1px solid #f1f5f9;" : ""}">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:3px;">
              <a href="${n.url}"
                style="font-size:14px;font-weight:600;color:#0f172a;text-decoration:none;line-height:1.5;">
                ${e(n.title)}
              </a>
              <span style="font-size:10px;font-weight:600;background:#f1f5f9;color:#64748b;
                padding:1px 6px;border-radius:2px;margin-left:6px;">${e(n.source)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:4px;">
              <span style="font-size:13px;color:#64748b;line-height:1.65;">${e(n.summary)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  // ── 関連記事（Qiita・Zenn・PR Times等 UGC・技術記事） ───────────────────
  const relatedArticlesHtml = relatedArticles.map((n, i) => `
    <tr>
      <td style="padding:${i === 0 ? "10px" : "12px"} 0 12px 0;
        ${i > 0 ? "border-top:1px solid #f1f5f9;" : ""}">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom:3px;">
              <a href="${n.url}"
                style="font-size:14px;font-weight:600;color:#0f172a;text-decoration:none;line-height:1.5;">
                ${e(n.title)}
              </a>
              <span style="font-size:10px;font-weight:600;background:#ede9fe;color:#6d28d9;
                padding:1px 6px;border-radius:2px;margin-left:6px;">${e(n.source)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding-top:4px;">
              <span style="font-size:13px;color:#64748b;line-height:1.65;">${e(n.summary)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join("");

  // ── 著者ブロック ─────────────────────────────────────────────────────────
  const authorBlock = authorSignatureHtml ?? `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-bottom:4px;">
          <span style="font-size:14px;font-weight:700;color:#0f172a;">
            ${e(authorName ?? "GCInsight編集部")}
          </span>
        </td>
      </tr>
      <tr>
        <td style="padding-bottom:14px;">
          <span style="font-size:12px;color:#64748b;line-height:1.5;">
            ${e(authorTitle ?? "元JTC自治体担当 × 外資IT営業 × 政策ウォッチャー × 地方在住")}
          </span>
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

  // ── メインCTA（末尾1本） ──────────────────────────────────────────────────
  const mainCta = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px 0;">
      <tr>
        <td align="center">
          <a href="https://gcinsight.jp"
            style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:700;
              text-decoration:none;padding:14px 36px;border-radius:6px;letter-spacing:0.3px;">
            GCInsightで今週の詳細を見る &rarr;
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
<body style="margin:0;padding:0;background:#f1f5f9;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

<!-- プレヘッダー（メーラーで件名の次に表示・本文には不可視） -->
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9;">
  ${e(preheader)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0"
  style="background:#f1f5f9;padding:20px 0 32px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0"
        style="width:100%;max-width:600px;">

        <!-- ヘッダー -->
        <tr>
          <td style="background:#0f172a;border-radius:10px 10px 0 0;padding:28px 32px;">
            <div style="font-size:10px;font-weight:700;color:#64748b;letter-spacing:2px;
              text-transform:uppercase;margin-bottom:10px;">GCINSIGHT WEEKLY #${issueNumber}</div>
            <div style="font-size:20px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:6px;">
              ガバメントクラウド最前線
            </div>
            <div style="font-size:13px;color:#94a3b8;">
              ${dateStr}号 &nbsp;&#183;&nbsp; &#128214; 約${estMinutes}分で読めます
            </div>
          </td>
        </tr>

        <!-- 本文 -->
        <tr>
          <td style="background:#ffffff;padding:28px 32px;
            border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">

              <!-- 1. イントロ（段落化） -->
              <tr>
                <td style="padding-bottom:32px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0"
                    style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <div style="font-size:10px;font-weight:700;color:#92400e;
                          letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">
                          今週のポイント
                        </div>
                        ${introParagraphsHtml}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- 2. 現場の声（X + note 統合） -->
              ${allVoices.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("💬", "現場の声", "X・noteから今週のリアルな反応をピックアップ。")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                    ${voicePicksHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- 3. 今週のガバクラニュース -->
              ${newsItems.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("📰", "今週のガバクラニュース", "公式・メディアの注目記事をまとめました。")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                    ${newsItemsHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- 4. 移行状況サマリー -->
              ${migrationBlock}

              <!-- 5. GCInsightアップデート -->
              ${gcupdates.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("📅", "GCInsightデータ更新", "ダッシュボードのデータ更新履歴です。")}
                  <div style="margin-top:14px;">${gcupdatesHtml}</div>
                </td>
              </tr>` : ""}

              <!-- 6. 公式情報（デジタル庁・総務省・ベンダー公式PR） -->
              ${officialNews.length > 0 ? `
              <tr>
                <td style="padding-bottom:32px;">
                  ${sectionHeader("🏛", "公式情報", "デジタル庁・総務省・ベンダー各社の公式発表です。")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
                    ${officialNewsHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- 7. 関連記事（Qiita・Zenn・PR Times等） -->
              ${relatedArticles.length > 0 ? `
              <tr>
                <td style="padding-bottom:8px;">
                  ${sectionHeader("📖", "関連記事", "エンジニア・実務者によるQiita・Zenn等の技術記事です。")}
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
                    ${relatedArticlesHtml}
                  </table>
                </td>
              </tr>` : ""}

              <!-- 8. メインCTA（末尾1本） -->
              <tr>
                <td>${mainCta}</td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- フッター -->
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;
            border-radius:0 0 10px 10px;padding:20px 32px 24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="border-top:1px solid #e2e8f0;padding-top:20px;">
              <tr>
                <td>${authorBlock}</td>
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

/**
 * セクション見出し（絵文字アイコン + ラベル + 1行リード文）
 * リード文を入れることで各セクションの目的が明確になる
 */
function sectionHeader(emoji: string, label: string, lead: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="border-bottom:2px solid #0f172a;padding-bottom:10px;">
        <span style="font-size:15px;font-weight:800;color:#0f172a;">${emoji} ${e(label)}</span>
      </td>
    </tr>
    ${lead ? `<tr>
      <td style="padding-top:8px;">
        <span style="font-size:13px;color:#64748b;">${e(lead)}</span>
      </td>
    </tr>` : ""}
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
