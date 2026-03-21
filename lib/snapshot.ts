/**
 * 時系列スナップショット管理
 *
 * standardization.json の月次データを progress_snapshots テーブルに保存し、
 * 時系列トレンド分析を可能にする。
 */

import { createClient } from "@supabase/supabase-js";

type SnapshotInput = {
  dataMonth: string;
  municipalityCount: number;
  avgRate: number;
  completedCount: number;
  criticalCount: number;
  snapshotData?: Record<string, unknown>;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  return createClient(url, key);
}

/** スナップショットを保存（UPSERT） */
export async function saveSnapshot(input: SnapshotInput): Promise<void> {
  const supabase = getServiceClient();

  const { error } = await supabase.from("progress_snapshots").upsert(
    {
      data_month: input.dataMonth,
      municipality_count: input.municipalityCount,
      avg_rate: input.avgRate,
      completed_count: input.completedCount,
      critical_count: input.criticalCount,
      snapshot_data: input.snapshotData ?? {},
    },
    { onConflict: "data_month" }
  );

  if (error) throw new Error(`Failed to save snapshot: ${error.message}`);
}

/** 全スナップショットを時系列順に取得 */
export async function getSnapshots(): Promise<
  {
    data_month: string;
    municipality_count: number;
    avg_rate: number;
    completed_count: number;
    critical_count: number;
    snapshot_data: Record<string, unknown>;
    created_at: string;
  }[]
> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("progress_snapshots")
    .select("*")
    .order("data_month", { ascending: true });

  if (error) throw new Error(`Failed to get snapshots: ${error.message}`);
  return data ?? [];
}

/**
 * 初期スナップショットをシーディング
 * progress_snapshots が空の場合のみ、standardization.json の現在値を1件保存する。
 * 既に同 data_month のレコードがある場合はスキップ（UPSERT で安全）。
 */
export async function seedInitialSnapshot(): Promise<{
  seeded: boolean;
  dataMonth?: string;
  reason?: string;
}> {
  const supabase = getServiceClient();

  // 既存レコード数を確認
  const { count, error: countError } = await supabase
    .from("progress_snapshots")
    .select("*", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Failed to count snapshots: ${countError.message}`);
  }

  if ((count ?? 0) > 0) {
    return { seeded: false, reason: "snapshots already exist" };
  }

  // テーブルが空 → standardization.json から初期レコードを作成
  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  const filePath = join(process.cwd(), "public/data/standardization.json");
  const raw = await readFile(filePath, "utf-8");
  const json = JSON.parse(raw);

  await createSnapshotFromJson(json);

  return { seeded: true, dataMonth: json.summary.data_month };
}

/** standardization.json からスナップショットを自動生成 */
export async function createSnapshotFromJson(
  json: {
    summary: {
      data_month: string;
      total: number;
      avg_rate: number;
      completed_count: number;
      critical_count: number;
      at_risk_count?: number;
      on_track_count?: number;
    };
    prefectures: Array<{
      prefecture: string;
      avg_rate: number;
      count: number;
      completed: number;
      critical: number;
    }>;
  }
): Promise<void> {
  await saveSnapshot({
    dataMonth: json.summary.data_month,
    municipalityCount: json.summary.total,
    avgRate: json.summary.avg_rate,
    completedCount: json.summary.completed_count,
    criticalCount: json.summary.critical_count,
    snapshotData: {
      at_risk_count: json.summary.at_risk_count,
      on_track_count: json.summary.on_track_count,
      prefecture_summary: json.prefectures.map((p) => ({
        prefecture: p.prefecture,
        avg_rate: p.avg_rate,
        count: p.count,
        completed: p.completed,
        critical: p.critical,
      })),
    },
  });
}
