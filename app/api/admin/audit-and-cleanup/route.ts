/**
 * 一時的な管理エンドポイント — 2026-05-02 セキュリティインシデント対応
 *
 * 1. テストレコード削除 (schedule_events.title='_authgate_verify_remove_me')
 * 2. DB監査: schedule_events / newsletter_subscribers / disclosure_requests
 *    の直近30日 updated_at DESC を返却
 *
 * 認証: Bearer GCINSIGHT_ADMIN_KEY 必須・fail-closed
 * 用途完了後に削除する一時的なファイル
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const ADMIN_KEY = process.env.GCINSIGHT_ADMIN_KEY;
  if (!ADMIN_KEY) {
    return NextResponse.json({ error: "ADMIN_KEY not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  const providedKey = authHeader?.replace("Bearer ", "") || "";
  if (!providedKey || providedKey !== ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const result: Record<string, unknown> = {};

  const { data: deleted, error: delErr } = await supabase
    .from("schedule_events")
    .delete()
    .or("title.eq._authgate_verify_remove_me,date.eq.2099-12-31")
    .select();
  result.deleted_test_rows = deleted?.length ?? 0;
  if (delErr) result.delete_error = delErr.message;

  const tables = [
    { name: "schedule_events", cols: "date, title, org, created_at, source" },
    { name: "newsletter_subscribers", cols: "id, email, created_at, status" },
    { name: "disclosure_requests", cols: "id, title, created_at, updated_at" },
  ];

  for (const t of tables) {
    const { data, error, count } = await supabase
      .from(t.name)
      .select(t.cols, { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(20);
    result[t.name] = {
      total_count: count,
      recent_20: data ?? [],
      error: error?.message,
    };
  }

  return NextResponse.json(result);
}
