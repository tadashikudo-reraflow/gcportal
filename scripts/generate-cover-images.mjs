#!/usr/bin/env node
/**
 * GCInsight 記事カバー画像生成スクリプト
 * HTML テンプレート → Playwright → PNG (1200×630, OGP最適)
 *
 * Usage:
 *   node scripts/generate-cover-images.mjs                  # 全記事生成
 *   node scripts/generate-cover-images.mjs gc-finops-guide   # 指定slug のみ
 */

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const SUPABASE_URL = "https://msbwmfggvtyexvhmlifn.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "***REDACTED_SUPABASE_SERVICE_ROLE***";

const OUT_DIR = resolve(import.meta.dirname, "../public/images/articles");

// カテゴリ別アイコン & アクセントカラー
const CATEGORY_MAP = {
  コスト: { icon: "💰", accent: "#F5B500" },
  移行: { icon: "🔄", accent: "#0066FF" },
  解説: { icon: "📖", accent: "#10B981" },
  遅延: { icon: "⏳", accent: "#FF6B6B" },
  自治体標準化: { icon: "🏛️", accent: "#8B5CF6" },
  議会: { icon: "🏛️", accent: "#0052CC" },
  標準化: { icon: "📋", accent: "#8B5CF6" },
  "2026年問題": { icon: "⚠️", accent: "#FF6B6B" },
};

function pickCategory(tags) {
  // 優先順でマッチ
  const priority = ["コスト", "遅延", "移行", "自治体標準化", "議会", "解説", "標準化", "2026年問題"];
  for (const p of priority) {
    if (tags.includes(p)) return { label: p, ...CATEGORY_MAP[p] };
  }
  return { label: "ガバメントクラウド", icon: "☁️", accent: "#0066FF" };
}

function buildHTML(article) {
  const cat = pickCategory(article.tags ?? []);
  // タイトルを「｜」で分割（前半=メイン、後半=サブ）
  const parts = article.title.split("｜");
  const mainTitle = parts[0].trim();
  const subTitle = parts.length > 1 ? parts[1].trim() : "";

  // タイトル長に応じてフォントサイズ調整
  const titleLen = mainTitle.length;
  const fontSize = titleLen > 25 ? 36 : titleLen > 18 ? 42 : 48;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    width: 1200px;
    height: 630px;
    font-family: 'Noto Sans JP', sans-serif;
    overflow: hidden;
  }

  .card {
    width: 1200px;
    height: 630px;
    background: linear-gradient(135deg, #001F54 0%, #002D72 40%, #003D99 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 64px 48px;
    position: relative;
    overflow: hidden;
  }

  /* 背景装飾: グリッドパターン */
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  /* 背景装飾: アクセントグラデーション円 */
  .card::after {
    content: '';
    position: absolute;
    top: -120px;
    right: -80px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, ${cat.accent}22 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  .top-section {
    position: relative;
    z-index: 1;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: ${cat.accent}33;
    border: 1px solid ${cat.accent}88;
    border-radius: 28px;
    padding: 10px 24px;
    font-size: 22px;
    font-weight: 700;
    color: ${cat.accent};
    letter-spacing: 0.5px;
  }

  .category-icon {
    font-size: 26px;
  }

  .title-section {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16px;
  }

  .main-title {
    font-size: ${fontSize}px;
    font-weight: 900;
    color: #FFFFFF;
    line-height: 1.35;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .sub-title {
    font-size: 22px;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    line-height: 1.4;
  }

  /* アクセントライン */
  .accent-line {
    width: 64px;
    height: 4px;
    background: ${cat.accent};
    border-radius: 2px;
    margin-bottom: 4px;
  }

  .bottom-section {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-icon {
    width: 48px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .brand-text {
    font-size: 22px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 1px;
  }

  .brand-sub {
    font-size: 15px;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.5px;
  }

  .tags {
    display: flex;
    gap: 10px;
  }

  .tag {
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px;
    padding: 6px 18px;
    font-size: 17px;
    color: rgba(255,255,255,0.75);
    font-weight: 500;
  }
</style>
</head>
<body>
<div class="card">
  <div class="top-section">
    <span class="category-badge">
      <span class="category-icon">${cat.icon}</span>
      ${cat.label}
    </span>
  </div>

  <div class="title-section">
    <div class="accent-line"></div>
    <div class="main-title">${mainTitle}</div>
    ${subTitle ? `<div class="sub-title">${subTitle}</div>` : ""}
  </div>

  <div class="bottom-section">
    <div class="brand">
      <div class="brand-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="48" height="42"><path d="M155 128H48C25 128 8 110 8 88C8 68 22 52 42 48C42 47 42 46 42 44C42 22 60 4 82 4C100 4 114 15 122 30C128 26 135 24 143 24C164 24 182 42 182 64C182 66 182 68 181 70C192 76 198 87 198 100C198 116 184 128 166 128" stroke="white" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="56" y="108" font-family="Helvetica Neue,Arial,sans-serif" font-size="60" font-weight="800" fill="white" letter-spacing="-2">GC</text></svg></div>
      <div>
        <div class="brand-text">GCInsight</div>
        <div class="brand-sub">ガバメントクラウド移行状況ダッシュボード</div>
      </div>
    </div>
    <div class="tags">
      ${(article.tags ?? [])
        .slice(0, 3)
        .map((t) => `<span class="tag">#${t}</span>`)
        .join("\n      ")}
    </div>
  </div>
</div>
</body>
</html>`;
}

async function main() {
  const targetSlug = process.argv[2]; // optional: specific slug

  // 1. Fetch articles
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  let query = supabase
    .from("articles")
    .select("slug, title, description, tags")
    .eq("is_published", true)
    .order("date", { ascending: false });

  if (targetSlug) {
    query = query.eq("slug", targetSlug);
  }

  const { data: articles, error } = await query;
  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  console.log(`📸 ${articles.length} 記事のカバー画像を生成します...\n`);

  // 2. Ensure output directory
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // 3. Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2, // Retina品質
  });

  for (const article of articles) {
    const page = await context.newPage();
    const html = buildHTML(article);

    await page.setContent(html, { waitUntil: "networkidle" });
    // Google Fontsの読み込み待ち
    await page.waitForTimeout(1500);

    const outPath = resolve(OUT_DIR, `${article.slug}.png`);
    await page.screenshot({ path: outPath, type: "png" });
    await page.close();

    const sizeKB = (writeFileSync.length / 1024).toFixed(0);
    console.log(`  ✅ ${article.slug}.png`);
  }

  await browser.close();
  console.log(`\n🎉 完了！ ${articles.length} 枚生成 → ${OUT_DIR}`);
}

main().catch(console.error);
