#!/usr/bin/env node
/**
 * GCInsight 記事カバー画像生成スクリプト
 * HTML テンプレート → Playwright → PNG
 *
 * Usage:
 *   node scripts/generate-cover-images.mjs                        # 全記事 OGP (1200×630)
 *   node scripts/generate-cover-images.mjs gc-finops-guide        # 指定slug のみ OGP
 *   node scripts/generate-cover-images.mjs --x-article            # 全記事 X Articles (1500×600, 5:2)
 *   node scripts/generate-cover-images.mjs --x-article gc-finops  # 指定slug X Articles
 */

import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

const SUPABASE_URL = "https://msbwmfggvtyexvhmlifn.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const OUT_DIR_OGP = resolve(import.meta.dirname, "../public/images/articles");
const OUT_DIR_X   = resolve(import.meta.dirname, "../public/images/x-articles");

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

// カテゴリ別右パネルSVGアイコン
function _xArticleIcon(tags) {
  const buildingTags = ["自治体標準化", "遅延", "2026年問題", "議会", "標準化", "コスト"];
  const useBuilding = buildingTags.some(t => tags.includes(t));

  if (useBuilding) {
    // ビル/庁舎アイコン（グラデーション + 窓ガラス質感）
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="360" height="432">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stop-color="#C0DCF2"/>
          <stop offset="50%" stop-color="#7FB8E6"/>
          <stop offset="100%" stop-color="#4E8BBF"/>
        </linearGradient>
        <linearGradient id="bh" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>
      <rect x="30" y="40" width="140" height="190" rx="6" fill="url(#bg)"/>
      <rect x="30" y="40" width="140" height="190" rx="6" fill="url(#bh)"/>
      <rect x="50" y="20" width="100" height="30" rx="4" fill="url(#bg)"/>
      <rect x="52" y="72" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="86" y="72" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="120" y="72" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="52" y="114" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="86" y="114" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="120" y="114" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="52" y="156" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="120" y="156" width="28" height="28" rx="3" fill="rgba(8,22,72,0.72)"/>
      <rect x="80" y="160" width="40" height="70" rx="4" fill="rgba(8,22,72,0.80)"/>
    </svg>`;
  }

  // クラウドアイコン（グラデーション + ハイライト）
  const cloudPath = `M232 176H72C42 176 18 152 18 122C18 95 38 72 65 66
     C65 64 65 62 65 60C65 30 90 6 120 6
     C144 6 164 20 174 42
     C182 36 192 32 204 32
     C236 32 262 58 262 90
     C262 93 262 96 261 99
     C278 107 288 124 288 143
     C288 162 272 176 252 176Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220" width="540" height="396">
    <defs>
      <linearGradient id="cg" x1="0.2" y1="0" x2="0.8" y2="1">
        <stop offset="0%" stop-color="#BDD9F0"/>
        <stop offset="55%" stop-color="#7FB8E6"/>
        <stop offset="100%" stop-color="#4E8BBF"/>
      </linearGradient>
      <radialGradient id="ch" cx="35%" cy="28%" r="45%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.30)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
    </defs>
    <path fill="url(#cg)" d="${cloudPath}"/>
    <path fill="url(#ch)" d="${cloudPath}"/>
  </svg>`;
}

function buildHTML(article, opts = {}) {
  const cat = pickCategory(article.tags ?? []);
  const parts = article.title.split("｜");
  const mainTitle = parts[0].trim();
  const subTitle = parts.length > 1 ? parts[1].trim() : "";

  const W = opts?.xArticle ? 1500 : 1200;
  const H = opts?.xArticle ? 600  : 630;

  // X Articles: govcloud-aws-monopoly-risk と同じ二分割レイアウト（左:テキスト / 右:クラウドアイコン）
  if (opts?.xArticle) {
    // 文字数に応じてフォントサイズを動的調整（タイトルオーバーフロー防止）
    const titleLen = mainTitle.length;
    const fontSize = titleLen <= 14 ? 86 : titleLen <= 20 ? 78 : titleLen <= 28 ? 74 : titleLen <= 36 ? 70 : titleLen <= 44 ? 64 : 58;
    const letterSpacing = fontSize >= 74 ? '-2.5px' : fontSize >= 64 ? '-1.5px' : '-0.5px';

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; font-family: 'Noto Sans JP', sans-serif; overflow: hidden; }

  .card {
    width: ${W}px; height: ${H}px;
    display: flex; flex-direction: row;
    overflow: hidden; position: relative;
  }

  /* ③ 下端アクセントバー */
  .card::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 4px; z-index: 20;
    background: linear-gradient(to right,
      #5B9FE8 0%, #7FC4F5 35%, #A8D8FA 55%, rgba(120,180,240,0.3) 100%);
  }

  /* ノイズテクスチャ用SVGフィルタ */
  .noise-layer {
    position: absolute; inset: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.045; mix-blend-mode: overlay;
  }

  /* 左パネル: テキスト (63%) */
  .left {
    width: 63%;
    background:
      radial-gradient(ellipse 70% 55% at 15% 35%, rgba(72,128,255,0.22) 0%, transparent 65%),
      linear-gradient(155deg, #0F2565 0%, #071540 60%, #060F2E 100%);
    padding: 48px 60px;
    display: flex; flex-direction: column; justify-content: space-between;
    overflow: hidden; position: relative;
  }

  /* 左端アクセントライン */
  .left::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(to bottom,
      rgba(120,180,255,0.9) 0%,
      rgba(80,140,255,0.5) 50%,
      rgba(60,110,220,0.15) 100%);
  }

  /* 上端ハイライト */
  .left::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(to right,
      rgba(140,190,255,0.6) 0%,
      rgba(100,160,255,0.2) 60%,
      transparent 100%);
  }

  .title-block {
    flex: 1;
    display: flex; flex-direction: column; justify-content: center;
    overflow: hidden; min-height: 0;
    position: relative; z-index: 1;
  }

  .main-title {
    font-size: ${fontSize}px; font-weight: 900;
    color: #FFFFFF; line-height: 1.28;
    letter-spacing: ${letterSpacing};
    overflow-wrap: break-word; word-break: break-word;
    overflow: hidden;
    text-shadow: 0 2px 16px rgba(0,0,0,0.5), 0 0 40px rgba(60,120,255,0.15);
  }
  .sub-title {
    font-size: 22px; font-weight: 500;
    color: rgba(255,255,255,0.65); line-height: 1.4;
    margin-top: 12px; overflow: hidden;
  }

  .hashtag {
    font-size: 26px; font-weight: 700;
    color: rgba(140,195,255,0.95);
    letter-spacing: 1.5px;
    flex-shrink: 0; padding-top: 20px;
    position: relative; z-index: 1;
  }
  /* ④ GCInsight 下線アクセント */
  .hashtag::after {
    content: '';
    display: block; width: 52px; height: 2px;
    background: linear-gradient(to right, rgba(120,180,255,0.8), rgba(100,160,255,0.1));
    border-radius: 1px; margin-top: 8px;
  }

  /* 右パネル: カテゴリアイコン (37%) — ② グロー強化 */
  .right {
    width: 37%;
    background:
      radial-gradient(ellipse 65% 60% at 52% 52%, rgba(90,155,240,0.60) 0%, rgba(50,90,200,0.25) 45%, transparent 70%),
      radial-gradient(ellipse 90% 80% at 50% 50%, rgba(30,60,160,0.40) 0%, transparent 80%),
      linear-gradient(160deg, #0D2270 0%, #091850 100%);
    border-left: 1px solid rgba(100,160,255,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative; overflow: hidden;
  }

  /* 右パネルノイズ */
  .right::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.04; mix-blend-mode: overlay;
  }

  .icon-wrap { position: relative; z-index: 1; }
</style>
</head>
<body>
<div class="card">
  <div class="left">
    <div class="noise-layer"></div>
    <div class="title-block">
      <div class="main-title">${mainTitle}</div>
      ${subTitle ? `<div class="sub-title">${subTitle}</div>` : ""}
    </div>
    <div class="hashtag">GCInsight</div>
  </div>
  <div class="right">
    <div class="icon-wrap">${_xArticleIcon(article.tags ?? [])}</div>
  </div>
</div>
</body>
</html>`;
  }

  // OGP モード (1200×630): X記事と同じ二分割レイアウト（左:テキスト / 右:アイコン）
  const titleLen = mainTitle.length;
  const fontSize = titleLen <= 14 ? 68 : titleLen <= 20 ? 62 : titleLen <= 28 ? 58 : titleLen <= 36 ? 52 : titleLen <= 44 ? 48 : 44;
  const letterSpacing = fontSize >= 58 ? '-2px' : fontSize >= 48 ? '-1px' : '0px';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; font-family: 'Noto Sans JP', sans-serif; overflow: hidden; }

  .card {
    width: ${W}px; height: ${H}px;
    display: flex; flex-direction: row;
    overflow: hidden; position: relative;
  }

  .card::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0; height: 4px; z-index: 20;
    background: linear-gradient(to right,
      #5B9FE8 0%, #7FC4F5 35%, #A8D8FA 55%, rgba(120,180,240,0.3) 100%);
  }

  .noise-layer {
    position: absolute; inset: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.045; mix-blend-mode: overlay;
  }

  .left {
    width: 63%;
    background:
      radial-gradient(ellipse 70% 55% at 15% 35%, rgba(72,128,255,0.22) 0%, transparent 65%),
      linear-gradient(155deg, #0F2565 0%, #071540 60%, #060F2E 100%);
    padding: 44px 52px;
    display: flex; flex-direction: column; justify-content: space-between;
    overflow: hidden; position: relative;
  }

  .left::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: linear-gradient(to bottom,
      rgba(120,180,255,0.9) 0%,
      rgba(80,140,255,0.5) 50%,
      rgba(60,110,220,0.15) 100%);
  }

  .left::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(to right,
      rgba(140,190,255,0.6) 0%,
      rgba(100,160,255,0.2) 60%,
      transparent 100%);
  }

  .badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: ${cat.accent}33; border: 1px solid ${cat.accent}88;
    border-radius: 24px; padding: 8px 20px;
    font-size: 20px; font-weight: 700; color: ${cat.accent};
    position: relative; z-index: 1; align-self: flex-start;
  }

  .title-block {
    flex: 1;
    display: flex; flex-direction: column; justify-content: center;
    overflow: hidden; min-height: 0;
    position: relative; z-index: 1;
    padding: 16px 0;
  }

  .main-title {
    font-size: ${fontSize}px; font-weight: 900;
    color: #FFFFFF; line-height: 1.28;
    letter-spacing: ${letterSpacing};
    overflow-wrap: break-word; word-break: break-word;
    overflow: hidden;
    text-shadow: 0 2px 16px rgba(0,0,0,0.5), 0 0 40px rgba(60,120,255,0.15);
  }
  .sub-title {
    font-size: 20px; font-weight: 500;
    color: rgba(255,255,255,0.65); line-height: 1.4;
    margin-top: 10px; overflow: hidden;
  }

  .bottom-bar {
    display: flex; align-items: center; gap: 10px;
    position: relative; z-index: 1;
  }
  .brand-name {
    font-size: 22px; font-weight: 700;
    color: rgba(140,195,255,0.95); letter-spacing: 1px;
  }
  .tags { display: flex; gap: 8px; margin-left: auto; }
  .tag {
    background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.18);
    border-radius: 16px; padding: 4px 14px;
    font-size: 15px; color: rgba(255,255,255,0.70);
  }

  .right {
    width: 37%;
    background:
      radial-gradient(ellipse 65% 60% at 52% 52%, rgba(90,155,240,0.60) 0%, rgba(50,90,200,0.25) 45%, transparent 70%),
      radial-gradient(ellipse 90% 80% at 50% 50%, rgba(30,60,160,0.40) 0%, transparent 80%),
      linear-gradient(160deg, #0D2270 0%, #091850 100%);
    border-left: 1px solid rgba(100,160,255,0.25);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative; overflow: hidden;
  }

  .right::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
    opacity: 0.04; mix-blend-mode: overlay;
  }

  .icon-wrap { position: relative; z-index: 1; }
</style>
</head>
<body>
<div class="card">
  <div class="left">
    <div class="noise-layer"></div>
    <span class="badge"><span>${cat.icon}</span>${cat.label}</span>
    <div class="title-block">
      <div class="main-title">${mainTitle}</div>
      ${subTitle ? `<div class="sub-title">${subTitle}</div>` : ""}
    </div>
    <div class="bottom-bar">
      <span class="brand-name">GCInsight</span>
      <div class="tags">
        ${(article.tags ?? []).slice(0, 3).map(t => `<span class="tag">#${t}</span>`).join("")}
      </div>
    </div>
  </div>
  <div class="right">
    <div class="icon-wrap">${_xArticleIcon(article.tags ?? [])}</div>
  </div>
</div>
</body>
</html>`;
}

async function main() {
  // 引数パース: --x-article フラグと slug
  const args = process.argv.slice(2);
  const xArticle = args.includes("--x-article");
  const targetSlug = args.find((a) => !a.startsWith("--")) ?? null;

  const W = xArticle ? 1500 : 1200;
  const H = xArticle ? 600  : 630;
  const OUT_DIR = xArticle ? OUT_DIR_X : OUT_DIR_OGP;
  const mode = xArticle ? "X Articles (1500×600, 5:2)" : "OGP (1200×630)";

  // 1. Fetch articles
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  let query = supabase
    .from("articles")
    .select("id, slug, title, description, tags")
    .eq("is_published", true)
    .order("id", { ascending: true });

  if (targetSlug) {
    query = query.eq("slug", targetSlug);
  }

  const { data: articles, error } = await query;
  if (error) {
    console.error("Supabase error:", error.message);
    process.exit(1);
  }

  console.log(`📸 ${articles.length} 記事のカバー画像を生成します [${mode}]...\n`);

  // 2. Ensure output directory
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // 3. Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: xArticle ? 1 : 2, // OGP: Retina品質 / X Articles: 750px上限のためscale=1
  });

  for (const article of articles) {
    const page = await context.newPage();
    const html = buildHTML(article, { xArticle });

    await page.setContent(html, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500); // Google Fonts読み込み待ち

    // X Articles: id別フォルダ（cover.png = Geminiと同一パス） / OGP: フラット
    let outPath;
    if (xArticle) {
      const idDir = resolve(OUT_DIR, `id${article.id}`);
      if (!existsSync(idDir)) mkdirSync(idDir, { recursive: true });
      outPath = resolve(idDir, `cover.png`);
    } else {
      outPath = resolve(OUT_DIR, `${article.slug}.png`);
    }

    await page.screenshot({ path: outPath, type: "png" });
    await page.close();

    // sips で750px以下にリサイズ（Vercel Image Optimization上限500KB対策）
    try {
      execSync(`sips -Z 750 "${outPath}" --out "${outPath}"`, { stdio: "pipe" });
    } catch (_) { /* sipsなし環境はスキップ */ }

    console.log(`  ✅ id${article.id} ${article.slug}`);
  }

  await browser.close();
  console.log(`\n🎉 完了！ ${articles.length} 枚生成 → ${OUT_DIR}`);
}

main().catch(console.error);
