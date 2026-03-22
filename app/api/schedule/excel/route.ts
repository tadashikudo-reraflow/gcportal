/**
 * GET  /api/schedule/excel — 現在のスケジュールをExcelでダウンロード
 * POST /api/schedule/excel — ExcelアップロードでJSONを更新
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import * as XLSX from "xlsx";

const SCHEDULE_PATH = join(process.cwd(), "public/data/schedule.json");

// ---------------------------------------------------------------------------
// GET — Excel ダウンロード
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const raw = await readFile(SCHEDULE_PATH, "utf-8");
    const schedule = JSON.parse(raw);

    const wb = XLSX.utils.book_new();

    // ── Sheet 1: 直近スケジュール ──
    const recentRows = (schedule.recent_schedule || []).map(
      (ev: Record<string, unknown>) => ({
        日付: ev.date as string,
        タイトル: ev.title as string,
        組織: ev.org as string,
        ステータス: ev.status === "done" ? "完了" : "予定",
        重要: ev.important ? "★" : "",
        登録元: ev.source === "auto" ? "AI自動" : "手動",
        備考: (ev.note as string) || "",
        出典URL: (ev.url as string) || "",
      })
    );
    const ws1 = XLSX.utils.json_to_sheet(recentRows);

    // 列幅を設定
    ws1["!cols"] = [
      { wch: 12 }, // 日付
      { wch: 55 }, // タイトル
      { wch: 18 }, // 組織
      { wch: 8 },  // ステータス
      { wch: 5 },  // 重要
      { wch: 8 },  // 登録元
      { wch: 15 }, // 備考
      { wch: 50 }, // 出典URL
    ];
    XLSX.utils.book_append_sheet(wb, ws1, "直近スケジュール");

    // ── Sheet 2: 年度スケジュール ──
    const annualRows: Record<string, string>[] = [];
    const maxEvents = Math.max(
      ...(schedule.annual_schedule || []).map(
        (q: { events: string[] }) => q.events.length
      )
    );
    for (let i = 0; i < maxEvents; i++) {
      const row: Record<string, string> = {};
      for (const q of schedule.annual_schedule || []) {
        row[q.quarter as string] = q.events[i] || "";
      }
      annualRows.push(row);
    }
    const ws2 = XLSX.utils.json_to_sheet(annualRows);
    ws2["!cols"] = (schedule.annual_schedule || []).map(() => ({ wch: 40 }));
    XLSX.utils.book_append_sheet(wb, ws2, "年度スケジュール");

    // ── Sheet 3: 情報ソース ──
    if (schedule.source_pages) {
      const sourceRows = schedule.source_pages.map(
        (sp: Record<string, unknown>) => ({
          ID: sp.id as string,
          名称: sp.name as string,
          組織: sp.org as string,
          URL: sp.url as string,
          説明: sp.description as string,
        })
      );
      const ws3 = XLSX.utils.json_to_sheet(sourceRows);
      ws3["!cols"] = [
        { wch: 25 },
        { wch: 40 },
        { wch: 15 },
        { wch: 50 },
        { wch: 60 },
      ];
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
      ["登録元", "「AI自動」または「手動」。AI自動追加分は確認後そのままでOK", "手動"],
      ["備考", "日程未確定等の補足情報（任意）", "3月下旬予定"],
      ["出典URL", "公式ページのURL（任意）", "https://www.digital.go.jp/..."],
      ["", "", ""],
      ["操作", "説明", ""],
      [
        "新規追加",
        "「直近スケジュール」シートの末尾に行を追加してください",
        "",
      ],
      [
        "削除",
        "不要な行を丸ごと削除してください",
        "",
      ],
      [
        "ステータス変更",
        "終了したイベントの「ステータス」列を「完了」に変更",
        "",
      ],
      [
        "年度スケジュール",
        "各四半期の列にイベント名を追加・修正してください",
        "",
      ],
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(rulesData);
    ws4["!cols"] = [{ wch: 18 }, { wch: 55 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(wb, ws4, "記入ルール");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const today = new Date().toISOString().slice(0, 10);
    return new NextResponse(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
// POST — Excel アップロード → JSON 更新
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

    // Read current schedule for fallback
    const currentRaw = await readFile(SCHEDULE_PATH, "utf-8");
    const currentSchedule = JSON.parse(currentRaw);

    // ── Parse Sheet 1: 直近スケジュール ──
    const recentSheet = wb.Sheets["直近スケジュール"];
    if (!recentSheet) {
      return NextResponse.json(
        { error: "「直近スケジュール」シートが見つかりません" },
        { status: 400 }
      );
    }

    const recentRows = XLSX.utils.sheet_to_json<Record<string, string>>(recentSheet);
    const recentSchedule: Record<string, unknown>[] = [];
    const errors: string[] = [];

    for (let i = 0; i < recentRows.length; i++) {
      const row = recentRows[i];
      const rowNum = i + 2; // 1-indexed + header

      // 日付の処理（Excelの日付型 or 文字列）
      let dateStr = String(row["日付"] || "").trim();

      // Excelシリアル値の場合の変換
      if (/^\d{5}$/.test(dateStr)) {
        const serial = parseInt(dateStr);
        const utcDays = serial - 25569;
        const d = new Date(utcDays * 86400 * 1000);
        dateStr = d.toISOString().slice(0, 10);
      }

      // YYYY/MM/DD → YYYY-MM-DD
      dateStr = dateStr.replace(/\//g, "-");

      if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
        errors.push(`${rowNum}行目: 日付が不正です「${row["日付"]}」`);
        continue;
      }

      // 月日のゼロパディング
      const [y, m, d] = dateStr.split("-");
      dateStr = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;

      const title = String(row["タイトル"] || "").trim();
      if (!title) {
        errors.push(`${rowNum}行目: タイトルが空です`);
        continue;
      }

      const org = String(row["組織"] || "").trim();
      if (!org) {
        errors.push(`${rowNum}行目: 組織が空です`);
        continue;
      }

      const statusRaw = String(row["ステータス"] || "").trim();
      const status = statusRaw === "完了" ? "done" : "upcoming";

      const important =
        String(row["重要"] || "").trim() === "★" ||
        String(row["重要"] || "").trim() === "*";

      const sourceRaw = String(row["登録元"] || "").trim();
      const source = sourceRaw === "AI自動" ? "auto" : "manual";

      const note = String(row["備考"] || "").trim();
      const url = String(row["出典URL"] || "").trim();

      const event: Record<string, unknown> = {
        date: dateStr,
        status,
        title,
        org,
        source,
      };
      if (important) event.important = true;
      if (note) event.note = note;
      if (url) event.url = url;

      recentSchedule.push(event);
    }

    // 日付順ソート
    recentSchedule.sort((a, b) =>
      (a.date as string).localeCompare(b.date as string)
    );

    // ── Parse Sheet 2: 年度スケジュール（任意） ──
    let annualSchedule = currentSchedule.annual_schedule; // fallback
    const annualSheet = wb.Sheets["年度スケジュール"];
    if (annualSheet) {
      const annualRows = XLSX.utils.sheet_to_json<Record<string, string>>(annualSheet);
      if (annualRows.length > 0) {
        const quarters = Object.keys(annualRows[0]);
        annualSchedule = quarters.map((quarter) => ({
          quarter,
          events: annualRows
            .map((row) => String(row[quarter] || "").trim())
            .filter(Boolean),
        }));
      }
    }

    // ── Parse Sheet 3: 情報ソース（任意） ──
    let sourcePages = currentSchedule.source_pages; // fallback
    const sourceSheet = wb.Sheets["情報ソース"];
    if (sourceSheet) {
      const sourceRows = XLSX.utils.sheet_to_json<Record<string, string>>(sourceSheet);
      if (sourceRows.length > 0) {
        sourcePages = sourceRows.map((row) => ({
          id: String(row["ID"] || "").trim(),
          name: String(row["名称"] || "").trim(),
          org: String(row["組織"] || "").trim(),
          url: String(row["URL"] || "").trim(),
          description: String(row["説明"] || "").trim(),
        })).filter((sp) => sp.id && sp.name);
      }
    }

    // Build updated schedule
    const today = new Date().toISOString().slice(0, 10);
    const updatedSchedule = {
      last_updated: today,
      annual_schedule: annualSchedule,
      recent_schedule: recentSchedule,
      source_pages: sourcePages,
    };

    // Write schedule
    await writeFile(
      SCHEDULE_PATH,
      JSON.stringify(updatedSchedule, null, 2) + "\n",
      "utf-8"
    );

    // Write change log
    const LOG_PATH = join(process.cwd(), "public/data/schedule-log.json");
    let log: Record<string, unknown>[] = [];
    try {
      const logRaw = await readFile(LOG_PATH, "utf-8");
      log = JSON.parse(logRaw);
    } catch {
      // 新規作成
    }
    log.push({
      timestamp: new Date().toISOString(),
      action: "excel_upload",
      details: `Excelアップロード: ${recentSchedule.length}件反映${errors.length > 0 ? `、${errors.length}件エラー` : ""}`,
      count: recentSchedule.length,
    });
    if (log.length > 200) log = log.slice(-200);
    await writeFile(LOG_PATH, JSON.stringify(log, null, 2) + "\n", "utf-8");

    return NextResponse.json({
      success: true,
      message: `${recentSchedule.length}件のイベントを反映しました`,
      event_count: recentSchedule.length,
      errors: errors.length > 0 ? errors : undefined,
      warnings:
        errors.length > 0
          ? `${errors.length}件のエラーがありました（該当行はスキップされました）`
          : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: `Excel読み込みに失敗: ${err instanceof Error ? err.message : "unknown"}`,
      },
      { status: 500 }
    );
  }
}
