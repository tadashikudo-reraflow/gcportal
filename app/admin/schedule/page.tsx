"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface LogEntry {
  timestamp: string;
  action: string;
  details: string;
  count: number;
}

interface ScanResult {
  summary?: {
    status_auto_completed: number;
    events_auto_added: number;
    events_pending_review: number;
    total_events: number;
  };
  auto_added?: string[];
  pending_review?: { date: string; title: string; org: string; confidence: string }[];
  message?: string;
  error?: string;
}

export default function AdminSchedulePage() {
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success?: boolean;
    message?: string;
    event_count?: number;
    errors?: string[];
    warnings?: string;
    error?: string;
  } | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load change log
  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/schedule/log", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.slice(-20).reverse());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleDownload = () => {
    window.location.href = "/api/schedule/excel";
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadResult({ error: "ファイルを選択してください" });
      return;
    }
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setUploadResult({ error: "Excelファイル（.xlsx）を選択してください" });
      return;
    }
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/schedule/excel", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();
      setUploadResult(data);
      loadLogs();
    } catch (err) {
      setUploadResult({
        error: `アップロード失敗: ${err instanceof Error ? err.message : "不明"}`,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setScanResult(data);
      loadLogs();
    } catch (err) {
      setScanResult({
        error: `スキャン失敗: ${err instanceof Error ? err.message : "不明"}`,
      });
    } finally {
      setScanning(false);
    }
  };

  const actionLabels: Record<string, { label: string; color: string; bg: string }> = {
    auto_add: { label: "AI追加", color: "#0066FF", bg: "#EFF6FF" },
    auto_complete: { label: "自動完了", color: "#10B981", bg: "#F0FDF4" },
    excel_upload: { label: "Excel", color: "#D97706", bg: "#FFFBEB" },
    manual_add: { label: "手動追加", color: "#6B7280", bg: "#F9FAFB" },
    manual_edit: { label: "手動編集", color: "#6B7280", bg: "#F9FAFB" },
  };

  return (
    <div
      className="max-w-4xl mx-auto py-8 px-4 space-y-8"
      style={{ fontFamily: "'Public Sans', 'Noto Sans JP', sans-serif" }}
    >
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#002D72" }}>
          スケジュール管理
        </h1>
        <p className="text-sm" style={{ color: "#64748b" }}>
          AIが毎日AM5時に自動スキャン → 新規イベントを検出・追加。人間はExcelで確認・修正。
        </p>
      </div>

      {/* AI Auto-scan */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
            style={{ backgroundColor: "#0066FF", color: "#fff" }}
          >
            AI
          </span>
          <h2 className="text-lg font-bold" style={{ color: "#002D72" }}>
            AI自動スキャン
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#0066FF" }}>
            毎日AM5:00自動実行
          </span>
        </div>
        <p className="text-sm ml-11" style={{ color: "#64748b" }}>
          デジタル庁・総務省・内閣官房のページをスクレイプし、ガバクラ関連の新着イベントを検出します。
          信頼度「高」のイベントは自動追加、「中・低」は要確認リストに表示されます。
        </p>
        <div className="ml-11">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: scanning ? "#94A3B8" : "#0066FF",
              color: "#fff",
              cursor: scanning ? "not-allowed" : "pointer",
            }}
          >
            {scanning ? "スキャン中..." : "今すぐスキャン実行"}
          </button>
        </div>

        {/* Scan Result */}
        {scanResult && (
          <div className="ml-11 space-y-3">
            {scanResult.error ? (
              <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", color: "#DC2626" }}>
                {scanResult.error}
              </div>
            ) : (
              <>
                <div className="rounded-lg p-4 text-sm" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC", color: "#15803D" }}>
                  <p className="font-bold">{scanResult.message}</p>
                </div>

                {/* Auto-added events */}
                {scanResult.auto_added && scanResult.auto_added.length > 0 && (
                  <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#EFF6FF", border: "1px solid #93C5FD" }}>
                    <p className="font-bold mb-1" style={{ color: "#0066FF" }}>
                      自動追加されたイベント:
                    </p>
                    <ul className="text-xs space-y-0.5" style={{ color: "#1E40AF" }}>
                      {scanResult.auto_added.map((title, i) => (
                        <li key={i}>・{title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pending review */}
                {scanResult.pending_review && scanResult.pending_review.length > 0 && (
                  <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FCD34D" }}>
                    <p className="font-bold mb-1" style={{ color: "#92400E" }}>
                      要確認イベント（Excelで追加してください）:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr style={{ color: "#92400E" }}>
                            <th className="text-left py-1 px-2">日付</th>
                            <th className="text-left py-1 px-2">タイトル</th>
                            <th className="text-left py-1 px-2">組織</th>
                            <th className="text-left py-1 px-2">信頼度</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scanResult.pending_review.map((ev, i) => (
                            <tr key={i} style={{ color: "#78350F" }}>
                              <td className="py-1 px-2 font-mono">{ev.date}</td>
                              <td className="py-1 px-2">{ev.title}</td>
                              <td className="py-1 px-2">{ev.org}</td>
                              <td className="py-1 px-2">
                                <span
                                  className="px-1.5 py-0.5 rounded text-xs"
                                  style={{
                                    backgroundColor: ev.confidence === "medium" ? "#FDE68A" : "#FCA5A5",
                                    color: ev.confidence === "medium" ? "#78350F" : "#7F1D1D",
                                  }}
                                >
                                  {ev.confidence === "medium" ? "中" : "低"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Excel workflow */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            XL
          </span>
          <h2 className="text-lg font-bold" style={{ color: "#002D72" }}>
            Excel編集
          </h2>
        </div>

        <div className="ml-11 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Download */}
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ backgroundColor: "#F8F9FA", border: "1px solid #E2E8F0" }}
          >
            <h3 className="text-sm font-bold" style={{ color: "#002D72" }}>
              1. ダウンロード
            </h3>
            <p className="text-xs" style={{ color: "#64748b" }}>
              現在のスケジュールをExcelで取得。
              AI自動追加分は「登録元」列に「AI自動」と表示されます。
            </p>
            <button
              onClick={handleDownload}
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "#0066FF", color: "#fff", cursor: "pointer" }}
            >
              Excelダウンロード
            </button>
          </div>

          {/* Upload */}
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ backgroundColor: "#F8F9FA", border: "1px solid #E2E8F0" }}
          >
            <h3 className="text-sm font-bold" style={{ color: "#002D72" }}>
              2. 編集してアップロード
            </h3>
            <p className="text-xs" style={{ color: "#64748b" }}>
              行の追加・削除・修正後、Excelをアップロードして反映。
            </p>
            <div className="space-y-2">
              <input
                type="file"
                ref={fileRef}
                accept=".xlsx,.xls"
                className="text-xs w-full"
                style={{ color: "#333" }}
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-lg px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: uploading ? "#94A3B8" : "#10B981",
                  color: "#fff",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "処理中..." : "アップロード"}
              </button>
            </div>
          </div>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className="ml-11">
            <div
              className="rounded-lg p-4 text-sm"
              style={{
                backgroundColor: uploadResult.success ? "#F0FDF4" : "#FEF2F2",
                border: `1px solid ${uploadResult.success ? "#86EFAC" : "#FCA5A5"}`,
                color: uploadResult.success ? "#15803D" : "#DC2626",
              }}
            >
              {uploadResult.success && (
                <p className="font-bold">{uploadResult.message}（{uploadResult.event_count}件）</p>
              )}
              {uploadResult.error && <p className="font-bold">{uploadResult.error}</p>}
              {uploadResult.warnings && <p className="mt-1">{uploadResult.warnings}</p>}
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs">
                  {uploadResult.errors.map((err, i) => (
                    <li key={i}>・{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="ml-11">
          <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FCD34D", color: "#92400E" }}>
            ※ AI自動追加分の確認・修正もExcelで行えます。不要なら行削除、修正ならそのまま編集してアップロード。
          </div>
        </div>
      </div>

      {/* Change Log */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "#002D72" }}>
          変更ログ
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm" style={{ color: "#94A3B8" }}>
            変更ログはまだありません
          </p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, i) => {
              const style = actionLabels[log.action] || { label: log.action, color: "#6B7280", bg: "#F9FAFB" };
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: style.bg }}
                >
                  <span
                    className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded mt-0.5"
                    style={{ backgroundColor: style.color + "20", color: style.color }}
                  >
                    {style.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "#333" }}>
                      {log.details}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {new Date(log.timestamp).toLocaleString("ja-JP")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Link */}
      <div className="text-center pt-4">
        <a
          href="/timeline"
          className="text-sm font-medium hover:underline"
          style={{ color: "#0066FF" }}
        >
          公開ページで確認する →
        </a>
      </div>
    </div>
  );
}
