export const PUBCOMMENT_DEADLINE = new Date("2026-05-17T23:59:59+09:00");

export function calcRemaining(now?: number): { days: number; hours: number } | null {
  const diff = PUBCOMMENT_DEADLINE.getTime() - (now ?? Date.now());
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { days, hours };
}
