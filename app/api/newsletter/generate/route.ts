import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { renderNewsletterHtml } from "@/lib/email-template";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function checkAuth(req: NextRequest): Promise<boolean> {
  // 1. JWT cookie（管理画面ブラウザ）
  const cookieToken = req.cookies.get("admin_token")?.value;
  if (cookieToken) {
    const { verifyAdminToken } = await import("@/lib/auth");
    const payload = await verifyAdminToken(cookieToken);
    if (payload) return true;
  }

  const authHeader = req.headers.get("authorization");
  // 2. Basic auth（レガシー・後方互換）
  if (authHeader?.startsWith("Basic ")) {
    const encoded = authHeader.slice(6);
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const [, password] = decoded.split(":");
    if (password === process.env.ADMIN_PASSWORD) return true;
  }
  // 3. Bearer token (Claude / 外部API)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token === process.env.GCINSIGHT_ADMIN_KEY) return true;
  }
  return false;
}

const defaultVoicePicks = [
  {
    source: "x" as const,
    author: "（Claudeが収集・挿入）",
    text: "X投稿ピックアップはClaude実行時に挿入されます",
    url: "#",
  },
  {
    source: "note" as const,
    author: "（Claudeが収集・挿入）",
    text: "note記事ピックアップはClaude実行時に挿入されます",
    url: "#",
  },
];

const defaultOfficialNews = [
  {
    title: "（Claudeが収集・挿入）",
    summary: "公式ニュースはClaude実行時に挿入されます",
    url: "#",
    source: "デジタル庁",
  },
];

// POST /api/newsletter/generate — ニュースレター下書き自動生成
export async function POST(req: NextRequest) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  // 1. issue number: campaignsテーブルの件数+1
  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });
  const issueNumber = (campaignCount ?? 0) + 1;

  // 2. 移行率データを取得（migration_snapshotsテーブルがなければスキップ）
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
  } catch {
    // テーブルが存在しない場合はスキップ
  }

  // 3. Supabaseから最新スナップショットの更新履歴を取得（gcupdates）
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
  } catch {
    // テーブルが存在しない場合はスキップ
  }

  // 4. デジタル庁公式サイトのニュースをfetch（失敗してもスキップ）
  let newsItems = defaultOfficialNews;
  try {
    const res = await fetch("https://www.digital.go.jp/news/", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      // HTMLから簡易的にニュースタイトルを抽出（正規表現）
      const html = await res.text();
      const matches = [...html.matchAll(/<a[^>]+href="([^"]*\/news\/[^"]+)"[^>]*>([^<]{10,})<\/a>/gi)];
      const parsed = matches.slice(0, 3).map((m) => ({
        title: m[2].trim(),
        summary: "詳細はリンク先でご確認ください",
        url: m[1].startsWith("http") ? m[1] : `https://www.digital.go.jp${m[1]}`,
        source: "デジタル庁",
      }));
      if (parsed.length > 0) {
        newsItems = parsed;
      }
    }
  } catch {
    // fetch失敗時はデフォルト値を使用
  }

  // 5. HTMLを生成
  const now = new Date();
  const dateLabel = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const subject = `GCInsight週次レポート #${issueNumber} — ${dateLabel}号`;

  const html = renderNewsletterHtml({
    issueNumber,
    intro: `今週のガバメントクラウド動向をお届けします。`,
    voicePicks: defaultVoicePicks,
    migrationStats,
    gcupdates,
    officialNews: newsItems,
  });

  // 6. campaignsテーブルに下書きとして保存
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
  const previewUrl = `/admin/newsletter/compose?id=${campaignId}`;

  return NextResponse.json({
    campaign_id: campaignId,
    subject,
    preview_url: previewUrl,
  });
}
