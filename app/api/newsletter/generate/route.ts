import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { renderNewsletterHtml } from "@/lib/email-template";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAuth(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) {
    const { verifyAdminToken } = await import("@/lib/auth");
    const payload = await verifyAdminToken(cookieToken);
    if (payload) return true;
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice(6);
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const [, password] = decoded.split(":");
    if (password === process.env.ADMIN_PASSWORD) return true;
  }
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token === process.env.GCINSIGHT_ADMIN_KEY) return true;
  }
  return false;
}

// ----- ニュース記事収集（複数ソース） -----
interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  date?: string;
}

async function fetchNewsItems(): Promise<NewsItem[]> {
  const results: NewsItem[] = [];

  // Publickey RSS
  try {
    const res = await fetch("https://www.publickey1.jp/atom.xml", {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.ok) {
      const xml = await res.text();
      const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 10);
      for (const e of entries) {
        const body = e[1];
        const title = body.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? "";
        const url = body.match(/<link[^>]+href="([^"]+)"/)?.[1] ?? "";
        const summary = body.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/)?.[1]
          ?.replace(/<[^>]+>/g, "").trim().slice(0, 120) ?? "";
        const date = body.match(/<updated>([\d-]+)/)?.[1] ?? "";
        if (title && url && (title.includes("ガバメント") || title.includes("自治体") || title.includes("標準化") || title.includes("デジタル庁"))) {
          results.push({ title, summary: summary || "詳細はリンク先でご確認ください", url, source: "Publickey", date });
        }
      }
    }
  } catch { /* スキップ */ }

  // 総務省 自治体デジタル化 RSS
  try {
    const res = await fetch("https://www.soumu.go.jp/rss/index.xml", {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.ok) {
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 20);
      for (const item of items) {
        const body = item[1];
        const title = body.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? "";
        const url = body.match(/<link>(https?:[^<]+)<\/link>/)?.[1]?.trim() ?? "";
        const date = body.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.slice(0, 16).trim() ?? "";
        if (title && url && (title.includes("自治体") || title.includes("標準化") || title.includes("ガバメント") || title.includes("デジタル"))) {
          results.push({ title, summary: "総務省発表。詳細はリンク先でご確認ください", url, source: "総務省", date });
        }
      }
    }
  } catch { /* スキップ */ }

  // デジタル庁 RSS（/rss/news.xml）
  const digitalKeywords = ["ガバメント", "自治体", "標準化", "クラウド", "マイナ", "ガバクラ", "DX", "デジタル基盤"];
  try {
    const res = await fetch("https://www.digital.go.jp/rss/news.xml", {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "GCInsight-Newsletter/1.0" },
    });
    if (res.ok) {
      const xml = await res.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 30);
      for (const item of items) {
        const body = item[1];
        const title = body.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? "";
        const url = body.match(/<link>(https?:[^<]+)<\/link>/)?.[1]?.trim() ?? "";
        const date = body.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.slice(0, 16).trim() ?? "";
        if (title && url && digitalKeywords.some(kw => title.includes(kw))) {
          results.push({ title, summary: "デジタル庁からの公式情報です", url, source: "デジタル庁", date });
        }
      }
    }
  } catch { /* スキップ */ }

  // 重複除去 + 最大6件
  const seen = new Set<string>();
  return results.filter(r => {
    if (!r.title || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  }).slice(0, 6);
}

// ----- X API v2 検索 -----
interface XTweet {
  author: string;
  text: string;
  url: string;
  likes: number;
  createdAt: string;
}

async function searchX(keywords: string[]): Promise<XTweet[]> {
  const bearerToken = process.env.X_BEARER_TOKEN;
  if (!bearerToken) return [];

  const results: XTweet[] = [];
  // 複数キーワードをOR結合して1リクエスト（API節約）
  const query = keywords.slice(0, 4).map((k) => `"${k}"`).join(" OR ");

  try {
    const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=20&tweet.fields=created_at,author_id,public_metrics,text&expansions=author_id&user.fields=name,username`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();

    // usersマップ
    const usersMap: Record<string, string> = {};
    for (const u of json?.includes?.users ?? []) {
      usersMap[u.id] = u.username ?? u.name ?? "unknown";
    }

    for (const t of json?.data ?? []) {
      // RT・リプライ・リンクだけのツイートを除外
      if (t.text?.startsWith("RT @")) continue;
      results.push({
        author: usersMap[t.author_id] ?? "unknown",
        text: t.text ?? "",
        url: `https://x.com/i/status/${t.id}`,
        likes: t.public_metrics?.like_count ?? 0,
        createdAt: t.created_at ?? "",
      });
    }
  } catch {
    // API失敗はスキップ
  }

  // いいね数でソート → 上位5件
  return results.sort((a, b) => b.likes - a.likes).slice(0, 5);
}

// ----- note.com API 検索 -----
interface NoteArticle {
  title: string;
  author: string;
  url: string;
  likeCount: number;
  publishedAt: string;
}

async function searchNote(keywords: string[]): Promise<NoteArticle[]> {
  const results: NoteArticle[] = [];
  for (const kw of keywords.slice(0, 3)) {
    try {
      const res = await fetch(
        `https://note.com/api/v3/searches?q=${encodeURIComponent(kw)}&size=5&sort=new&context=note`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) continue;
      const json = await res.json();
      const notes = json?.data?.notes?.contents ?? [];
      for (const n of notes) {
        if (n.price > 0 && !n.can_read) continue;
        results.push({
          title: n.name ?? "",
          author: n.user?.nickname ?? n.user?.urlname ?? "unknown",
          url: `https://note.com/${n.user?.urlname}/n/${n.key}`,
          likeCount: n.like_count ?? 0,
          publishedAt: n.publish_at ?? "",
        });
      }
    } catch {
      // 個別キーワードの失敗はスキップ
    }
  }
  const seen = new Set<string>();
  return results
    .filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 5);
}

// POST /api/newsletter/generate — ニュースレター下書き自動生成
// body（任意）: { voicePicks?: [...], intro?: string, ragNews?: [...] }
// → voicePicksを直接渡せばClaude収集分を使用、なければnote自動収集
// → ragNewsを渡すとOracle RAG経由のニュース記事をofficialNewsにマージ
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // リクエストbody（任意）
  let bodyData: {
    voicePicks?: Array<{ source: "x" | "note"; author: string; text: string; url: string }>;
    intro?: string;
    officialNews?: Array<{ title: string; summary: string; url: string; source: string }>;
    /**
     * ragNews は source によって自動振り分け:
     * - "PR Times" → newsItems（ガバクラニュース）
     * - "Qiita" | "Zenn" → relatedArticles（関連記事）
     * - その他 → officialNews
     */
    ragNews?: Array<{
      title: string;
      summary: string;
      url: string;
      source: string;
      published_at?: string;
    }>;
  } = {};
  try {
    bodyData = await req.json();
  } catch {
    // bodyなしでも動作
  }

  const supabase = getSupabase();

  // 0. 同日重複防止ガード
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: existingDrafts } = await supabase
    .from("campaigns")
    .select("id, subject")
    .eq("status", "draft")
    .gte("created_at", todayStart.toISOString())
    .limit(1);
  if (existingDrafts && existingDrafts.length > 0) {
    return NextResponse.json(
      { error: "今日の下書きが既に存在します", existing: existingDrafts[0] },
      { status: 409 }
    );
  }

  // 1. newsletter_config取得
  const { data: config } = await supabase
    .from("newsletter_config")
    .select("*")
    .eq("id", 1)
    .single();

  const xKeywords = config?.x_keywords?.split(",").map((k: string) => k.trim()) ?? ["ガバメントクラウド"];
  const noteKeywords = config?.note_keywords?.split(",").map((k: string) => k.trim()) ?? ["ガバメントクラウド"];

  // 2. issue number
  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });
  const issueNumber = (campaignCount ?? 0) + 1;

  // 3. 移行率データ
  let migrationStats: { rate: string; completed: string; total: string } | undefined;
  try {
    const { data: snapshots } = await supabase
      .from("migration_snapshots")
      .select("migration_rate, completed_count, total_count")
      .order("snapshot_date", { ascending: false })
      .limit(1);
    if (snapshots && snapshots.length > 0) {
      const snap = snapshots[0];
      migrationStats = {
        rate: `${snap.migration_rate ?? 0}%`,
        completed: `${snap.completed_count ?? 0}団体`,
        total: `${snap.total_count ?? 0}団体`,
      };
    }
  } catch { /* スキップ */ }

  // 4. GCInsightアップデート（スナップショット履歴）
  let gcupdates: Array<{ date: string; title: string; detail: string }> = [];
  try {
    const { data: snaps } = await supabase
      .from("migration_snapshots")
      .select("snapshot_date, migration_rate, completed_count")
      .order("snapshot_date", { ascending: false })
      .limit(3);
    if (snaps && snaps.length > 0) {
      gcupdates = snaps.map((s) => ({
        date: s.snapshot_date?.slice(0, 10) ?? "",
        title: "移行状況データ更新",
        detail: `移行率 ${s.migration_rate ?? 0}% / 完了 ${s.completed_count ?? 0}団体`,
      }));
    }
  } catch { /* スキップ */ }

  // 5a. ニュース記事収集（常に実行）
  const newsItems = await fetchNewsItems();

  // 5. X + note 自動収集（bodyでvoicePicksが渡されていなければ）
  let voicePicks = bodyData.voicePicks ?? [];
  let xTweets: XTweet[] = [];
  let noteArticles: NoteArticle[] = [];

  if (voicePicks.length === 0) {
    // X API v2 と note.com を並列収集
    [xTweets, noteArticles] = await Promise.all([
      searchX(xKeywords),
      searchNote(noteKeywords),
    ]);

    // X投稿をvoicePicksに変換
    for (const t of xTweets) {
      voicePicks.push({
        source: "x" as const,
        author: t.author,
        text: t.text.length > 200 ? t.text.slice(0, 197) + "…" : t.text,
        url: t.url,
      });
    }

    // note記事をvoicePicksに変換
    for (const a of noteArticles) {
      voicePicks.push({
        source: "note" as const,
        author: a.author,
        text: a.title,
        url: a.url,
      });
    }

    // フォールバック: 両方とも0件の場合
    if (voicePicks.length === 0) {
      voicePicks = [{
        source: "x" as const,
        author: "GCInsight",
        text: "今週は大きな動きはありませんでした。引き続きガバメントクラウド移行の最新動向をウォッチしていきます。",
        url: "https://gcinsight.jp",
      }];
    }
  }

  // 6. ragNews をソース種別で振り分け
  // - PR Times → newsItems（ガバクラニュース）
  // - Qiita / Zenn → relatedArticles（関連記事）
  // - その他（産経・日経等）→ officialNews
  const RELATED_SOURCES = new Set(["Qiita", "Zenn"]);
  const NEWS_SOURCES = new Set(["PR Times"]);

  const ragNewsItems: typeof newsItems = [];
  const ragRelated: Array<{ title: string; summary: string; url: string; source: string }> = [];
  const ragOfficial: Array<{ title: string; summary: string; url: string; source: string }> = [];

  for (const r of bodyData.ragNews ?? []) {
    const item = { title: r.title, summary: r.summary, url: r.url, source: r.source };
    if (NEWS_SOURCES.has(r.source)) {
      ragNewsItems.push({ ...item, date: r.published_at?.slice(0, 10) });
    } else if (RELATED_SOURCES.has(r.source)) {
      ragRelated.push(item);
    } else {
      ragOfficial.push(item);
    }
  }

  // newsItems に PR Times をマージ（末尾に追加）
  const mergedNewsItems = [...newsItems, ...ragNewsItems];

  // relatedArticles（Qiita・Zenn）
  const relatedArticles = ragRelated;

  // officialNews
  let officialNews = bodyData.officialNews ?? [];
  if (ragOfficial.length > 0) {
    officialNews = [...ragOfficial, ...officialNews];
  }

  // officialNews が空ならnewsItemsから公式情報（デジタル庁）を流用
  if (officialNews.length === 0) {
    officialNews = mergedNewsItems
      .filter(n => n.source === "デジタル庁")
      .slice(0, 3)
      .map(n => ({ title: n.title, summary: n.summary, url: n.url, source: n.source }));
  }

  // 7. system_prompt生成
  const systemPrompt = config
    ? `あなたは「${config.author_name}」としてニュースレターを執筆します。

【著者】${config.author_title}
【スタイル】${config.author_style}
【想定読者】${config.reader_persona}
【トーン】${config.reader_tone}
【関心トピック】${config.reader_topics}

イントロは上記のペルソナで書いてください。現場感のある一人称で、読者に語りかけるように。`
    : "";

  // 8. イントロ
  const intro = bodyData.intro ?? "今週のガバメントクラウド動向をお届けします。現場で何が起きているのか、部外者の目線でズバッと斬ります。";

  // 9. HTML生成
  const now = new Date();
  const dateLabel = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const subject = `GCInsight週次レポート #${issueNumber} — ${dateLabel}号`;

  const html = renderNewsletterHtml({
    issueNumber,
    intro,
    newsItems: mergedNewsItems,
    voicePicks,
    migrationStats,
    gcupdates,
    officialNews,
    relatedArticles,
    authorName: config?.author_name,
    authorTitle: config?.author_title,
    authorSignatureHtml: config?.author_signature_html,
  });

  // 10. 下書き保存
  const { data: campaign, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      subject,
      body_html: html,
      status: "draft",
      created_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const campaignId: number = campaign.id;

  // 収集結果の警告生成
  const warnings: string[] = [];
  if (officialNews.length === 0) {
    warnings.push("公式ニュースの取得に失敗しました。デジタル庁サイトの構造が変更された可能性があります。手動で公式情報を追加してください。");
  }
  if (xTweets.length === 0 && noteArticles.length === 0 && !bodyData.voicePicks?.length) {
    warnings.push("X・noteともに情報収集できませんでした。voicePicksセクションはフォールバック内容になっています。");
  }

  return NextResponse.json({
    campaign_id: campaignId,
    subject,
    preview_url: `/admin/newsletter/compose?id=${campaignId}`,
    system_prompt: systemPrompt,
    x_keywords: xKeywords,
    note_keywords: noteKeywords,
    collected: {
      news_items: mergedNewsItems.length,
      x_tweets: xTweets.length,
      note_articles: noteArticles.length,
      official_news: officialNews.length,
      related_articles: relatedArticles.length,
      voice_picks: voicePicks.length,
      gcupdates: gcupdates.length,
      rag_news: bodyData.ragNews?.length ?? 0,
    },
    ...(warnings.length > 0 && { warnings }),
  });
}
