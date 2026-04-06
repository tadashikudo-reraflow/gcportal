"use client";

import { useState } from "react";
import type { ScheduleData, ScheduleEvent } from "./page";
import { Search } from "lucide-react";

interface Props {
  data: ScheduleData;
}

/* ============================================================
   Helpers
   ============================================================ */

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

function formatMonth(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  return `${y}年${parseInt(m)}月`;
}

/** Group events by month (e.g. "2026-03") */
function groupByMonth(events: ScheduleEvent[]): Map<string, ScheduleEvent[]> {
  const map = new Map<string, ScheduleEvent[]>();
  for (const ev of events) {
    const key = ev.date.slice(0, 7); // "2026-03"
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
}

/** Today's date string "YYYY-MM-DD" */
function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ============================================================
   Status Badge
   ============================================================ */
function StatusBadge({ status, date }: { status: string; date: string }) {
  const t = today();
  const isToday = date === t;
  const isPast = date < t;

  if (status === "done" || isPast) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: "var(--color-status-complete, #10B981)",
          color: "#fff",
        }}
      >
        完了
      </span>
    );
  }

  if (isToday) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium animate-pulse"
        style={{
          backgroundColor: "var(--color-brand-primary, #0066FF)",
          color: "#fff",
        }}
      >
        本日
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: "var(--color-warning, #F5B500)",
        color: "#333",
      }}
    >
      予定
    </span>
  );
}

/* ============================================================
   Main Component
   ============================================================ */
export default function ScheduleClient({ data }: Props) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "done">("all");

  const t = today();

  // Filter events
  const filteredEvents = data.recent_schedule.filter((ev) => {
    if (filter === "upcoming") return ev.date >= t;
    if (filter === "done") return ev.date < t || ev.status === "done";
    return true;
  });

  const grouped = groupByMonth(filteredEvents);

  // Stats
  const doneCount = data.recent_schedule.filter(
    (ev) => ev.date < t || ev.status === "done"
  ).length;
  const upcomingCount = data.recent_schedule.length - doneCount;
  const importantUpcoming = data.recent_schedule.filter(
    (ev) => ev.important && ev.date >= t
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div
            className="text-xs mb-1"
            style={{ color: "var(--color-text-secondary, #64748b)" }}
          >
            総イベント数
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: "var(--color-gov-primary, #002D72)" }}
          >
            {data.recent_schedule.length}
          </div>
        </div>
        <div className="card p-4">
          <div
            className="text-xs mb-1"
            style={{ color: "var(--color-text-secondary, #64748b)" }}
          >
            完了
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: "var(--color-status-complete, #10B981)" }}
          >
            {doneCount}
          </div>
        </div>
        <div className="card p-4">
          <div
            className="text-xs mb-1"
            style={{ color: "var(--color-text-secondary, #64748b)" }}
          >
            予定
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: "var(--color-warning, #F5B500)" }}
          >
            {upcomingCount}
          </div>
        </div>
        <div className="card p-4">
          <div
            className="text-xs mb-1"
            style={{ color: "var(--color-text-secondary, #64748b)" }}
          >
            重要予定
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: "var(--color-error, #FF6B6B)" }}
          >
            {importantUpcoming.length}
          </div>
        </div>
      </div>

      {/* Section 1: Annual Schedule */}
      <div className="card p-4 sm:p-6">
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: "var(--color-gov-primary, #002D72)" }}
        >
          年度スケジュール（2026年度の主なイベント）
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.annual_schedule.map((q) => (
            <div
              key={q.quarter}
              className="rounded-lg p-4"
              style={{
                backgroundColor: "var(--color-section-bg, #F8F9FA)",
                border: "1px solid var(--color-border, #E2E8F0)",
              }}
            >
              <h3
                className="text-sm font-bold mb-3"
                style={{ color: "var(--color-brand-primary, #0066FF)" }}
              >
                {q.quarter}
              </h3>
              <ul className="space-y-1.5">
                {q.events.map((ev, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: "var(--color-text-primary, #333)" }}
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor:
                          "var(--color-brand-primary, #0066FF)",
                      }}
                    />
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Recent Schedule */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-gov-primary, #002D72)" }}
          >
            直近のスケジュール
          </h2>
          <div className="flex gap-2">
            {(
              [
                { key: "all", label: "すべて" },
                { key: "upcoming", label: "予定のみ" },
                { key: "done", label: "完了のみ" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor:
                    filter === key
                      ? "var(--color-brand-primary, #0066FF)"
                      : "var(--color-section-bg, #F8F9FA)",
                  color: filter === key ? "#fff" : "var(--color-text-secondary, #64748b)",
                  border: `1px solid ${filter === key ? "var(--color-brand-primary, #0066FF)" : "var(--color-border, #E2E8F0)"}`,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline by month */}
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([month, events]) => (
            <div key={month}>
              {/* Month header */}
              <div
                className="flex items-center gap-2 mb-3 pb-2"
                style={{
                  borderBottom: "2px solid var(--color-brand-primary, #0066FF)",
                }}
              >
                <span
                  className="text-base font-bold"
                  style={{ color: "var(--color-gov-primary, #002D72)" }}
                >
                  {formatMonth(events[0].date)}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-secondary, #64748b)" }}
                >
                  {events.length}件
                </span>
              </div>

              {/* Event list */}
              <div className="space-y-2">
                {events.map((ev, i) => (
                  <div
                    key={`${ev.date}-${i}`}
                    className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors"
                    style={{
                      backgroundColor:
                        ev.important
                          ? "rgba(0, 102, 255, 0.04)"
                          : "transparent",
                      borderLeft: ev.important
                        ? "3px solid var(--color-brand-primary, #0066FF)"
                        : "3px solid transparent",
                    }}
                  >
                    {/* Date */}
                    <div
                      className="flex-shrink-0 w-12 text-sm font-mono font-medium text-right"
                      style={{
                        color:
                          ev.date >= t
                            ? "var(--color-gov-primary, #002D72)"
                            : "var(--color-text-muted, #94A3B8)",
                      }}
                    >
                      {formatDate(ev.date)}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0 mt-0.5">
                      <StatusBadge status={ev.status} date={ev.date} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium"
                        style={{
                          color:
                            ev.date < t
                              ? "var(--color-text-muted, #94A3B8)"
                              : "var(--color-text-primary, #333)",
                        }}
                      >
                        {ev.important && (
                          <span
                            className="mr-1"
                            style={{
                              color: "var(--color-brand-primary, #0066FF)",
                            }}
                          >
                            ★
                          </span>
                        )}
                        {ev.url ? (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{
                              color: ev.date < t
                                ? "var(--color-text-muted, #94A3B8)"
                                : "var(--color-text-primary, #333)",
                            }}
                          >
                            {ev.title}
                            <span
                              className="inline-block ml-1 text-xs"
                              style={{ color: "var(--color-brand-primary, #0066FF)" }}
                            >
                              ↗
                            </span>
                          </a>
                        ) : (
                          ev.title
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-xs"
                          style={{
                            color: "var(--color-text-secondary, #64748b)",
                          }}
                        >
                          {ev.org}
                        </span>
                        {ev.note && (
                          <span
                            className="text-xs italic"
                            style={{
                              color: "var(--color-text-muted, #94A3B8)",
                            }}
                          >
                            ({ev.note})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="py-16 text-center">
            <Search size={40} color="#94A3B8" strokeWidth={1.5} className="mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>該当するイベントはありません</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>フィルター条件を変更してください</p>
          </div>
        )}
      </div>

      {/* Source Pages */}
      {data.source_pages && data.source_pages.length > 0 && (
        <div className="card p-4 sm:p-6">
          <h2
            className="text-lg font-bold mb-3"
            style={{ color: "var(--color-gov-primary, #002D72)" }}
          >
            情報ソース
          </h2>
          <p
            className="text-xs mb-4"
            style={{ color: "var(--color-text-secondary, #64748b)" }}
          >
            各イベントの出典元ページ。議事録・説明資料・公募要項等はこちらから確認できます。
          </p>
          <div className="flex flex-col divide-y" style={{ borderRadius: 8, border: "1px solid var(--color-border, #E2E8F0)", overflow: "hidden" }}>
            {data.source_pages.map((sp) => (
              <a
                key={sp.id}
                href={sp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 no-underline hover:opacity-75 transition-opacity"
                style={{ backgroundColor: "var(--color-surface-container-low, #F8F9FA)" }}
              >
                <span className="text-xs flex-shrink-0 w-16 truncate" style={{ color: "var(--color-text-muted, #94a3b8)" }}>{sp.org}</span>
                <span className="text-xs font-medium flex-1 min-w-0 truncate" style={{ color: "var(--color-gov-primary, #002D72)" }}>{sp.name}</span>
                <span className="text-xs flex-shrink-0" style={{ color: "var(--color-brand-primary, #0066FF)" }}>↗</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Data source footer */}
      <div
        className="text-xs text-right"
        style={{ color: "var(--color-text-muted, #94A3B8)" }}
      >
        最終更新: {data.last_updated} ／ 出典: デジタル庁・総務省・厚労省等の公開情報
      </div>
    </div>
  );
}
