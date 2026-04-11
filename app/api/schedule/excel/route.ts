/**
 * GET  /api/schedule/excel — スケジュールをExcelでダウンロード（Supabase版）
 * POST /api/schedule/excel — ExcelアップロードでSupabaseを更新
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import scheduleStaticData from "@/public/data/schedule.json";
import * as XLSX from "xlsx";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ---------------------------------------------------------------------------
// GET — Excel ダウンロード（Supabaseから取得）
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data: events, error } = await supabase
      .from("schedule_events")
      .select("*")
      .order("date", { ascending: true });

    if (error) throw error;

    const staticData = scheduleStaticData as Record<string, unknown>;
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: 直近スケジュール ──
    const recentRows = (events ?? []).map((ev) => ({
      日付: ev.date as string,
      タイトル: ev.title as string,
      組織: ev.org as string,
      ステータス: ev.status === "done" ? "完了" : "予定",
      重要: ev.important ? "★" : "",
      登録元: ev.source === "auto" ? "AI自動" : "手動",
      備考: (ev.note as string) || "",
      出典URL: (ev.url as string) || "",
    }));
    const ws1 = XLSX.utils.json_to_sheet(recentRows);
    ws1["!cols"] = [
      { wch: 12 }, { wch: 55 }, { wch: 18 }, { wch: 8 },
      { wch: 5 }, { wch: 8 }, { wch: 15 }, { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "直近スケジュール");

    // ── Sheet 2: 年度スケジュール（JSON静的）──
    const annualSchedule = (staticData.annual_schedule as { quarter: string; events: string[] }[]) ?? [];
    const annualRows: Record<string, string>[] = [];
    const maxEvents = Math.max(...annualSchedule.map((q) => q.events.length), 0);
    for (let i = 0; i < maxEvents; i++) {
      const row: Record<string, string> = {};
      for (const q of annualSchedule) {
        row[q.quarter] = q.events[i] || "";
      }
      annualRows.push(row);
    }
    const ws2 = XLSX.utils.json_to_sheet(annualRows);
    ws2["!cols"] = annualSchedule.map(() => ({ wch: 40 }));
    XLSX.utils.book_append_sheet(wb, ws2, "年度スケジュール");

    // ── Sheet 3: 情報ソース（JSON静的）──
    const sourcePages = (staticData.source_pages as Record<string, string>[]) ?? [];
    if (sourcePages.length > 0) {
      const sourceRows = sourcePages.map((sp) => ({
        ID: sp.id, 名称: sp.name, 組織: sp.org, URL: sp.url, 説明: sp.description,
      }));
      const ws3 = XLSX.utils.json_to_sheet(sourceRows);
      ws3["!cols"] = [{ wch: 25 }, { wch: 40 }, { wch: 15 }, { wch: 50 }, { wch: 60 }];
      XLSX.utils.book_append_sheet(wb, ws3, "情報ソース");
    }

    // ── Sheet 4: 記入ルール ──
    const rulesData = [
      ["項目", "入力ルール", "例"],
      ["日付", "YYYY-MM-DD形式で入力", "2026-04-15"],
      ["タイトル", "イベント名を入力", "標準仕様書改定（介護保険）"],
      ["組織", "所管省庁・機関名", "デジタル庁"],
      ["ステータス", "「完了」または「予定」", "予定"],
      ["重要", "重要なら「★」、それ以外は空欄", "★"],
      ["登録元", "「AI自動」または「手動」", "手動"],
      ["備考", "補足情報（任意）", "3月下旬予定"],
      ["出典URL", "公式ページのURL（任意）", "https://www.digital.go.jp/..."],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(rulesData);
    ws4["!cols"] = [{ wch: 18 }, { wch: 55 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws4, "記入ルール");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const today = new Date().toISOString().slice(0, 10);

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gcinsight-schedule-${today}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Excel生成に失敗: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Excel アップロード → Supabase 全件置換
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const wb = XLSX.read(arrayBuf, { type: "array" });

    const recentSheet = wb.Sheets["直近スケジュール"];
    if (!recentSheet) {
      return NextResponse.json(
        { error: "「直近スケジュール」シートが見つかりません" },
        { status: 400 }
      );
    }

    const recentRows = XLSX.utils.sheet_to_json<Record<string, string>>(recentSheet);
    const errors: string[] = [];

    interface ParsedEvent {
      date: string;
      status: "done" | "upcoming";
      title: string;
      org: string;
      important: boolean;
      note: string | null;
      url: string | null;
      source: string;
    }

    const parsedEvents: ParsedEvent[] = [];

    for (let i = 0; i < recentRows.length; i++) {
      const row = recentRows[i];
      const rowNum = i + 2;

      let dateStr = String(row["日付"] || "").trim();
      if (/^\d{5}$/.test(dateStr)) {
        const serial = parseInt(dateStr);
        const utcDays = serial - 25569;
        const d = new Date(utcDays * 86400 * 1000);
        dateStr = d.toISOString().slice(0, 10);
      }
      dateStr = dateStr.replace(/\//g, "-");
      if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        errors.push(`${rowNum}行目: 日付が不正「${row["日付"]}」`);
        continue;
      }
      const [y, m, d] = dateStr.split("-");
      dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

      const title = String(row["タイトル"] || "").trim();
      if (!title) { errors.push(`${rowNum}行目: タイトルが空`); continue; }

      const org = String(row["組織"] || "").trim();
      if (!org) { errors.push(`${rowNum}行目: 組織が空`); continue; }

      parsedEvents.push({
        date: dateStr,
        status: String(row["ステータス"] || "").trim() === "完了" ? "done" : "upcoming",
        title,
        org,
        important: ["★", "*"].includes(String(row["重要"] || "").trim()),
        note: String(row["備考"] || "").trim() || null,
        url: String(row["出典URL"] || "").trim() || null,
        source: String(row["登録元"] || "").trim() === "AI自動" ? "auto" : "manual",
      });
    }

    if (parsedEvents.length === 0) {
      return NextResponse.json({ error: "有効なイベントが0件です", errors }, { status: 400 });
    }

    // Supabase: 全件削除→再挿入（Excel内容で完全置換）
    const supabase = getSupabase();
    const { error: deleteError } = await supabase
      .from("schedule_events")
      .delete()
      .neq("id", 0); // 全件削除

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("schedule_events")
      .insert(parsedEvents);

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: `${parsedEvents.length}件のイベントを反映しました`,
      event_count: parsedEvents.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Excel読み込みに失敗: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}
