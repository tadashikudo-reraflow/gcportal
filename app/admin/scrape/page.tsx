"use client";

import { useState, useEffect, useCallback } from "react";

// --- Types ---
type DataSource = {
  id: string;
  name: string;
  organization: string;
  url: string;
  type: "PDF" | "Excel" | "HTML" | "CSV";
  priority: "S" | "A" | "B";
  last_checked: string | null;
  status: "active" | "inactive" | "error";
};

type ScanResult = {
  success: boolean;
  message: string;
  job_id?: string;
};

// --- Priority badge colors ---
const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  S: { bg: "#fef2f2", color: "#dc2626" },
  A: { bg: "#fffbeb", color: "#d97706" },
  B: { bg: "#f0f4ff", color: "#3b82f6" },
};

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  PDF: { bg: "#fef2f2", color: "#dc2626" },
  Excel: { bg: "#f0fdf4", color: "#16a34a" },
  HTML: { bg: "#f0f4ff", color: "#3b82f6" },
  CSV: { bg: "#faf5ff", color: "#7c3aed" },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "#f0fdf4", color: "#16a34a", label: "正常" },
  inactive: { bg: "#f8f9fb", color: "#94a3b8", label: "停止中" },
  error: { bg: "#fef2f2", color: "#dc2626", label: "エラー" },
};

export default function ScrapePage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<Record<string, boolean>>({});
  const [batchScanning, setBatchScanning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Manual URL form state
  const [manualUrl, setManualUrl] = useState("");
  const [manualType, setManualType] = useState<"PDF" | "Excel" | "HTML" | "CSV">("HTML");
  const [manualName, setManualName] = useState("");
  const [manualOrg, setManualOrg] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Filter
  const [filterPriority, setFilterPriority] = useState<"all" | "S" | "A" | "B">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "error">("all");

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch("/api/scrape/sources", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSources(data.sources ?? data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleScan = async (sourceId: string) => {
    setScanning((prev) => ({ ...prev, [sourceId]: true }));
    try {
      const res = await fetch("/api/scrape/trigger", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: sourceId }),
      });
      const data: ScanResult = await res.json();
      if (data.success) {
        showMessage("success", `スキャンジョブを開始しました (ID: ${data.job_id ?? "N/A"})`);
      } else {
        showMessage("error", data.message || "スキャンの開始に失敗しました");
      }
    } catch {
      showMessage("error", "スキャンリクエストに失敗しました");
    } finally {
      setScanning((prev) => ({ ...prev, [sourceId]: false }));
    }
  };

  const handleBatchScan = async () => {
    setBatchScanning(true);
    try {
      const res = await fetch("/api/scrape/trigger", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "S" }),
      });
      const data: ScanResult = await res.json();
      if (data.success) {
        showMessage("success", "全Sソースのスキャンを開始しました");
      } else {
        showMessage("error", data.message || "バッチスキャンの開始に失敗しました");
      }
    } catch {
      showMessage("error", "バッチスキャンリクエストに失敗しました");
    } finally {
      setBatchScanning(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setManualSubmitting(true);
    try {
      const res = await fetch("/api/scrape/trigger", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: manualUrl.trim(),
          type: manualType,
          name: manualName.trim() || undefined,
          organization: manualOrg.trim() || undefined,
        }),
      });
      const data: ScanResult = await res.json();
      if (data.success) {
        showMessage("success", `手動スキャンを開始しました (ID: ${data.job_id ?? "N/A"})`);
        setManualUrl("");
        setManualName("");
        setManualOrg("");
      } else {
        showMessage("error", data.message || "手動スキャンの開始に失敗しました");
      }
    } catch {
      showMessage("error", "手動スキャンリクエストに失敗しました");
    } finally {
      setManualSubmitting(false);
    }
  };

  const filteredSources = sources.filter((s) => {
    if (filterPriority !== "all" && s.priority !== filterPriority) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  const sSourceCount = sources.filter((s) => s.priority === "S").length;

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
            データ収集
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Message toast */}
        {message && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: message.type === "success" ? "#16a34a" : "#dc2626",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            <span>{message.type === "success" ? "\u2713" : "\u2717"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "総ソース数", value: sources.length, color: "#002D72", bg: "#f0f4ff" },
            { label: "Sソース", value: sSourceCount, color: "#dc2626", bg: "#fef2f2" },
            { label: "正常稼働", value: sources.filter((s) => s.status === "active").length, color: "#16a34a", bg: "#f0fdf4" },
            { label: "エラー", value: sources.filter((s) => s.status === "error").length, color: "#dc2626", bg: "#fff5f5" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: s.bg, border: "1px solid #e2e8f0" }}
            >
              <p className="text-3xl font-extrabold tabular-nums" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: "#64748b" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Data sources list */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Filter bar + batch action */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold" style={{ color: "#64748b" }}>
                  優先度:
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
                  className="text-xs px-2 py-1.5 rounded-lg border"
                  style={{ border: "1.5px solid #e2e8f0" }}
                >
                  <option value="all">すべて</option>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
                <label className="text-xs font-semibold ml-3" style={{ color: "#64748b" }}>
                  状態:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="text-xs px-2 py-1.5 rounded-lg border"
                  style={{ border: "1.5px solid #e2e8f0" }}
                >
                  <option value="all">すべて</option>
                  <option value="active">正常</option>
                  <option value="inactive">停止中</option>
                  <option value="error">エラー</option>
                </select>
              </div>
              <button
                onClick={handleBatchScan}
                disabled={batchScanning || sSourceCount === 0}
                className="text-xs px-4 py-2 rounded-lg font-bold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#dc2626" }}
              >
                {batchScanning ? "スキャン中..." : `全Sソースをスキャン (${sSourceCount}件)`}
              </button>
            </div>

            {/* Sources table */}
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
              ) : filteredSources.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm" style={{ color: "#94a3b8" }}>
                    {sources.length === 0
                      ? "データソースが登録されていません。APIエンドポイント /api/scrape/sources が未構築の可能性があります。"
                      : "条件に一致するソースがありません"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fb" }}>
                        <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "#64748b" }}>
                          ソース名
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold hidden md:table-cell" style={{ color: "#64748b" }}>
                          組織
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold hidden lg:table-cell" style={{ color: "#64748b" }}>
                          URL
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: "#64748b" }}>
                          種別
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: "#64748b" }}>
                          優先度
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold hidden sm:table-cell" style={{ color: "#64748b" }}>
                          状態
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold hidden md:table-cell" style={{ color: "#64748b" }}>
                          最終確認
                        </th>
                        <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: "#64748b" }}>
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSources.map((source) => {
                        const pStyle = PRIORITY_STYLES[source.priority] ?? PRIORITY_STYLES.B;
                        const tStyle = TYPE_STYLES[source.type] ?? TYPE_STYLES.HTML;
                        const sStyle = STATUS_STYLES[source.status] ?? STATUS_STYLES.inactive;
                        return (
                          <tr
                            key={source.id}
                            className="border-t transition-colors hover:bg-gray-50"
                            style={{ borderColor: "#f1f5f9" }}
                          >
                            <td className="px-4 py-3">
                              <span className="font-medium text-sm" style={{ color: "#333" }}>
                                {source.name}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell">
                              <span className="text-xs" style={{ color: "#64748b" }}>
                                {source.organization}
                              </span>
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell max-w-xs">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs truncate block hover:underline"
                                style={{ color: "#0066FF" }}
                                title={source.url}
                              >
                                {source.url}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ backgroundColor: tStyle.bg, color: tStyle.color }}
                              >
                                {source.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-bold"
                                style={{ backgroundColor: pStyle.bg, color: pStyle.color }}
                              >
                                {source.priority}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: sStyle.bg, color: sStyle.color }}
                              >
                                {sStyle.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center hidden md:table-cell">
                              <span className="text-xs" style={{ color: "#94a3b8" }}>
                                {source.last_checked
                                  ? new Date(source.last_checked).toLocaleDateString("ja-JP")
                                  : "未確認"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleScan(source.id)}
                                disabled={scanning[source.id]}
                                className="text-xs px-3 py-1.5 rounded-lg font-bold text-white transition-opacity disabled:opacity-50"
                                style={{ backgroundColor: "#0066FF" }}
                              >
                                {scanning[source.id] ? "..." : "スキャン"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right: Manual URL input */}
          <div className="flex-shrink-0 space-y-4" style={{ width: "320px" }}>
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
            >
              <div>
                <h3 className="text-sm font-bold" style={{ color: "#333" }}>
                  手動URL追加
                </h3>
                <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
                  個別のURLを指定してスキャン
                </p>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>
                    URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="https://www.soumu.go.jp/..."
                    className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                    style={{ border: "1.5px solid #e2e8f0" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>
                    種別
                  </label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as typeof manualType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border"
                    style={{ border: "1.5px solid #e2e8f0" }}
                  >
                    <option value="HTML">HTML</option>
                    <option value="PDF">PDF</option>
                    <option value="Excel">Excel</option>
                    <option value="CSV">CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>
                    ソース名
                  </label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="自治体標準化推進状況"
                    className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                    style={{ border: "1.5px solid #e2e8f0" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>
                    組織名
                  </label>
                  <input
                    type="text"
                    value={manualOrg}
                    onChange={(e) => setManualOrg(e.target.value)}
                    placeholder="総務省"
                    className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                    style={{ border: "1.5px solid #e2e8f0" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "#002D72" }}
                >
                  {manualSubmitting ? "送信中..." : "スキャン開始"}
                </button>
              </form>
            </div>

            {/* Quick links */}
            <div
              className="rounded-xl p-5 space-y-3"
              style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0" }}
            >
              <h3 className="text-sm font-bold" style={{ color: "#333" }}>
                クイックリンク
              </h3>
              <div className="space-y-2">
                <a
                  href="/admin/scrape/jobs"
                  className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-gray-50"
                  style={{ color: "#0066FF" }}
                >
                  <span>&#9881;</span>
                  <span>ジョブ管理画面へ</span>
                </a>
                <a
                  href="/admin/documents"
                  className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-gray-50"
                  style={{ color: "#0066FF" }}
                >
                  <span>&#128218;</span>
                  <span>ドキュメント管理へ</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
