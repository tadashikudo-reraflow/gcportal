/**
 * CLI スクリプト共通の .env.local ローダー
 *
 * 全スクリプトにコピペされていた自前パーサーを統一。
 * dotenv互換のパース（= 含む値、クォート、空行、コメント対応）。
 */
import * as fs from "fs";
import * as path from "path";

export function loadEnvLocal(dir?: string): void {
  const envPath = path.join(dir ?? path.join(__dirname, "../.."), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.warn(`[load-env] .env.local not found: ${envPath}`);
    return;
  }

  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // 空行・コメント行をスキップ
    if (!trimmed || trimmed.startsWith("#")) continue;

    // KEY=VALUE のパース（最初の = で分割）
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex < 0) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // クォート除去（シングル・ダブル）
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // 既存の環境変数を上書きしない
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// import するだけで自動ロード
loadEnvLocal();
