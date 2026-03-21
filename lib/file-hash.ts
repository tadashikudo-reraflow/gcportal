import { createHash } from "crypto";

/**
 * Compute a SHA-256 hash of a file buffer.
 * Used for deduplication in the scrape_jobs pipeline.
 */
export function computeFileHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}
