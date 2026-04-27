"use client";

import { useEffect, useState } from "react";
import { calcRemaining } from "./deadline";

export default function CountdownBanner({
  initial,
}: {
  initial: { days: number; hours: number } | null;
}) {
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    setRemaining(calcRemaining());
    const timer = setInterval(() => setRemaining(calcRemaining()), 60_000);
    return () => clearInterval(timer);
  }, []);

  if (remaining === null) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.3)",
        fontSize: "0.8125rem",
        fontWeight: 600,
        color: "#fff",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "#F5B500",
          flexShrink: 0,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      パブリックコメント受付中
      <span style={{ opacity: 0.7, fontWeight: 400 }}>—</span>
      <span>
        残り <strong>{remaining.days}</strong> 日{remaining.hours > 0 ? <> <strong>{remaining.hours}</strong> 時間</> : ""}
      </span>
      <span style={{ opacity: 0.7, fontWeight: 400 }}>（5月17日 23:59締切）</span>
    </div>
  );
}
