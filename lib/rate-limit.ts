/**
 * インメモリ Rate Limiter（Map + タイムスタンプ方式）
 * プロセス再起動でリセットされるが、シンプルで外部依存なし。
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// 古いエントリを定期的にクリーンアップ（メモリリーク防止）
const CLEANUP_INTERVAL = 60_000; // 1分
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Rate limitをチェックする。
 * @returns { allowed: true } または { allowed: false, retryAfter: seconds }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfter: number } {
  const now = Date.now();
  cleanup(windowMs);

  const entry = store.get(key) ?? { timestamps: [] };

  // ウィンドウ外のタイムスタンプを除去
  const cutoff = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
  }

  entry.timestamps.push(now);
  store.set(key, entry);
  return { allowed: true };
}
