"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// --- Types ---
type ScrapeJob = {
  id: string;
  source_name: string | null;
  source_id: string | null;
  url: string;
  status: "pending" | "processing" | "completed" | "error";
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
  documents_count: number | null;
};

type JobsResponse = {
  jobs: ScrapeJob[];
  total: number;
};

// --- Status badge config ---
const STATUS_CONFIG: Record<
  string,
  { bg: string; color: string; border: string; label: string }
> = {
  pending: {
    bg: "#f8f9fb",
    color: "#64748b",
    border: "#e2e8f0",
    label: "待機中",
  },
  processing: {
    bg: "#eff6ff",
    color: "#2563eb",
    border: "#bfdbfe",
    label: "処理中",
  },
  completed: {
    bg: "#f0fdf4",
    color: "#16a34a",
    border: "#bbf7d0",
    label: "完了",
  },
  error: {
    bg: "#fef2f2",
    color: "#dc2626",
    border: "#fecaca",
    label: "エラー",
  },
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedJob, setSelectedJob] = useState<ScrapeJob | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchJobs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/scrape/jobs?${params.toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data: JobsResponse = await res.json();
        setJobs(data.jobs ?? []);
        setTotal(data.total ?? 0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [filterStatus]);

  // Initial fetch + auto-refresh every 30s
  useEffect(() => {
    fetchJobs();
    intervalRef.current = setInterval(fetchJobs, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchJobs]);

  const handleRetry = async (jobId: string) => {
    setRetrying((prev) => ({ ...prev, [jobId]: true }));
    try {
      const res = await fetch(`/api/scrape/jobs/${jobId}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        showMessage("success", `ジョブ ${jobId} をリトライキューに追加しました`);
        fetchJobs();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage(
          "error",
          (data as { message?: string }).message ||
            "リトライに失敗しました"
        );
      }
    } catch {
      showMessage("error", "リトライリクエストに失敗しました");
    } finally {
      setRetrying((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  // Stats
  const statusCounts = {
    pending: jobs.filter((j) => j.status === "pending").length,
    processing: jobs.filter((j) => j.status === "processing").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    error: jobs.filter((j) => j.status === "error").length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f9fb" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 shadow-sm"
        style={{ backgroundColor: "#002D72" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-extrabold text-sm tracking-wide">
            GCInsight Admin
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#ffffff20", color: "#fff" }}
          >
            ジョブ管理
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            最終更新:{" "}
            {lastRefresh.toLocaleTimeString("ja-JP", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
          <button
            onClick={fetchJobs}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: "#ffffff20", color: "#fff" }}
          >
            更新
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Message toast */}
        {message && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor:
                message.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: message.type === "success" ? "#16a34a" : "#dc2626",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            <span>{message.type === "success" ? "\u2713" : "\u2717"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Status summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "#f0f4ff", border: "1px solid #e2e8f0" }}
          >
            <p
              className="text-2xl font-extrabold tabular-nums"
              style={{ color: "#002D72" }}
            >
              {total}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "#64748b" }}>
              総ジョブ数
            </p>
          </div>
          {(
            ["pending", "processing", "completed", "error"] as const
          ).map((status) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <button
                key={status}
                onClick={() =>
                  setFilterStatus(filterStatus === status ? "all" : status)
                }
                className="rounded-xl p-4 text-center transition-all"
                style={{
                  backgroundColor: cfg.bg,
                  border: `2px solid ${filterStatus === status ? cfg.color : "#e2e8f0"}`,
                }}
              >
                <p
                  className="text-2xl font-extrabold tabular-nums"
                  style={{ color: cfg.color }}
                >
                  {statusCounts[status]}
                </p>
                <p
                  className="text-xs mt-1 font-medium"
                  style={{ color: "#64748b" }}
                >
                  {cfg.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label
              className="text-xs font-semibold"
              style={{ color: "#64748b" }}
            >
              フィルター:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border"
              style={{ border: "1.5px solid #e2e8f0" }}
            >
              <option value="all">すべて</option>
              <option value="pending">待機中</option>
              <option value="processing">処理中</option>
              <option value="completed">完了</option>
              <option value="error">エラー</option>
            </select>
          </div>
          <a
            href="/admin/scrape"
            className="text-xs font-medium"
            style={{ color: "#0066FF" }}
          >
            ← データ収集へ戻る
          </a>
        </div>

        {/* Jobs table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
        >
          {loading ? (
            <div className="p-12 text-center">
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                読み込み中...
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm" style={{ color: "#94a3b8" }}>
                {filterStatus === "all"
                  ? "ジョブがありません。APIエンドポイント /api/scrape/jobs が未構築の可能性があります。"
                  : "条件に一致するジョブがありません"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#f8f9fb" }}>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold"
                      style={{ color: "#64748b" }}
                    >
                      ID
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold hidden sm:table-cell"
                      style={{ color: "#64748b" }}
                    >
                      ソース
                    </th>
                    <th
                      className="text-left px-4 py-3 text-xs font-semibold hidden lg:table-cell"
                      style={{ color: "#64748b" }}
                    >
                      URL
                    </th>
                    <th
                      className="text-center px-4 py-3 text-xs font-semibold"
                      style={{ color: "#64748b" }}
                    >
                      状態
                    </th>
                    <th
                      className="text-center px-4 py-3 text-xs font-semibold hidden md:table-cell"
                      style={{ color: "#64748b" }}
                    >
                      作成日時
                    </th>
                    <th
                      className="text-center px-4 py-3 text-xs font-semibold hidden md:table-cell"
                      style={{ color: "#64748b" }}
                    >
                      処理日時
                    </th>
                    <th
                      className="text-center px-4 py-3 text-xs font-semibold hidden sm:table-cell"
                      style={{ color: "#64748b" }}
                    >
                      取得件数
                    </th>
                    <th
                      className="text-center px-4 py-3 text-xs font-semibold"
                      style={{ color: "#64748b" }}
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
                    return (
                      <tr
                        key={job.id}
                        className="border-t transition-colors hover:bg-gray-50 cursor-pointer"
                        style={{ borderColor: "#f1f5f9" }}
                        onClick={() => setSelectedJob(job)}
                      >
                        <td className="px-4 py-3">
                          <span
                            className="text-xs font-mono"
                            style={{ color: "#64748b" }}
                          >
                            {job.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span
                            className="text-sm font-medium"
                            style={{ color: "#333" }}
                          >
                            {job.source_name ?? "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                          <span
                            className="text-xs truncate block"
                            style={{ color: "#64748b" }}
                            title={job.url}
                          >
                            {job.url}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="text-xs px-2.5 py-1 rounded-full font-semibold inline-block"
                            style={{
                              backgroundColor: cfg.bg,
                              color: cfg.color,
                              border: `1px solid ${cfg.border}`,
                            }}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span
                            className="text-xs"
                            style={{ color: "#94a3b8" }}
                          >
                            {formatDate(job.created_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span
                            className="text-xs"
                            style={{ color: "#94a3b8" }}
                          >
                            {formatDate(job.processed_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span
                            className="text-xs font-medium tabular-nums"
                            style={{ color: "#333" }}
                          >
                            {job.documents_count ?? "-"}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.status === "error" && (
                            <button
                              onClick={() => handleRetry(job.id)}
                              disabled={retrying[job.id]}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold text-white transition-opacity disabled:opacity-50"
                              style={{ backgroundColor: "#d97706" }}
                            >
                              {retrying[job.id] ? "..." : "リトライ"}
                            </button>
                          )}
                          {job.status === "processing" && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: "#2563eb" }}
                            >
                              実行中
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="text-center">
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            30秒ごとに自動更新されます
          </p>
        </div>
      </div>

      {/* Job detail modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-xl"
            style={{ backgroundColor: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-base font-bold"
                style={{ color: "#333" }}
              >
                ジョブ詳細
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-lg leading-none px-2 py-1 rounded hover:bg-gray-100"
                style={{ color: "#94a3b8" }}
              >
                x
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: "ジョブID", value: selectedJob.id },
                {
                  label: "ソース",
                  value: selectedJob.source_name ?? "-",
                },
                { label: "URL", value: selectedJob.url },
                {
                  label: "状態",
                  value:
                    STATUS_CONFIG[selectedJob.status]?.label ??
                    selectedJob.status,
                },
                {
                  label: "作成日時",
                  value: selectedJob.created_at
                    ? new Date(selectedJob.created_at).toLocaleString("ja-JP")
                    : "-",
                },
                {
                  label: "処理日時",
                  value: selectedJob.processed_at
                    ? new Date(selectedJob.processed_at).toLocaleString("ja-JP")
                    : "-",
                },
                {
                  label: "取得件数",
                  value:
                    selectedJob.documents_count != null
                      ? String(selectedJob.documents_count)
                      : "-",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-start gap-3 py-2 border-b"
                  style={{ borderColor: "#f1f5f9" }}
                >
                  <span
                    className="text-xs font-semibold flex-shrink-0"
                    style={{ color: "#64748b", width: "80px" }}
                  >
                    {row.label}
                  </span>
                  <span
                    className="text-sm break-all"
                    style={{ color: "#333" }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}

              {selectedJob.error_message && (
                <div className="space-y-1">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#dc2626" }}
                  >
                    エラー内容
                  </span>
                  <div
                    className="rounded-lg p-3 text-xs font-mono whitespace-pre-wrap"
                    style={{
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                    }}
                  >
                    {selectedJob.error_message}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {selectedJob.status === "error" && (
                <button
                  onClick={() => {
                    handleRetry(selectedJob.id);
                    setSelectedJob(null);
                  }}
                  className="text-xs px-4 py-2 rounded-lg font-bold text-white"
                  style={{ backgroundColor: "#d97706" }}
                >
                  リトライ
                </button>
              )}
              <button
                onClick={() => setSelectedJob(null)}
                className="text-xs px-4 py-2 rounded-lg font-bold"
                style={{
                  backgroundColor: "#f1f5f9",
                  color: "#64748b",
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
