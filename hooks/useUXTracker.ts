"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

// セッションIDをsessionStorageで永続化
function getSessionId(): string {
  const key = "gcinsight_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

type UXEvent = {
  page_path: string;
  event_type: "click" | "leave";
  session_id: string;
  metadata: Record<string, unknown>;
};

// バッファに溜めてまとめて送信（DBコネクション節約）
const buffer: UXEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  // fire-and-forget: await不要
  supabase.from("ux_events").insert(batch);
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 2000); // 2秒後にまとめて送信
}

function pushEvent(event: UXEvent) {
  buffer.push(event);
  scheduleFlush();
}

export function useUXTracker() {
  const pathname = usePathname();
  const enteredAt = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);

  // /admin 配下はトラッキング対象外
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin || typeof window === "undefined") return;

    const page = pathname;
    enteredAt.current = Date.now();
    maxScrollRef.current = 0;

    const sessionId = getSessionId();
    const isMobile = window.innerWidth < 768;

    // クリックイベント
    const handleClick = (e: MouseEvent) => {
      pushEvent({
        page_path: page,
        event_type: "click",
        session_id: sessionId,
        metadata: {
          x_ratio: parseFloat((e.clientX / window.innerWidth).toFixed(4)),
          y_ratio: parseFloat(
            ((e.clientY + window.scrollY) / document.documentElement.scrollHeight).toFixed(4)
          ),
          is_mobile: isMobile,
        },
      });
    };

    // スクロールイベント（最大到達率のみ記録）
    const handleScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      if (docH <= 0) return;
      const depth = parseFloat(Math.min(window.scrollY / docH, 1).toFixed(4));
      if (depth > maxScrollRef.current) {
        maxScrollRef.current = depth;
      }
    };

    // ページ離脱イベント
    const handleLeave = () => {
      pushEvent({
        page_path: page,
        event_type: "leave",
        session_id: sessionId,
        metadata: {
          scroll_depth: maxScrollRef.current,
          dwell_ms: Date.now() - enteredAt.current,
          is_mobile: isMobile,
        },
      });
      flush(); // 離脱時は即送信
    };

    window.addEventListener("click", handleClick, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleLeave);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleLeave();
    });

    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleLeave);
      handleLeave(); // ルーティング変更時も離脱として記録
    };
  }, [pathname, isAdmin]);
}
