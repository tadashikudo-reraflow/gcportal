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

function buildHTML(article, opts = {}) {
  const cat = pickCategory(article.tags ?? []);
  const parts = article.title.split("｜");
  const mainTitle = parts[0].trim();
  const subTitle = parts.length > 1 ? parts[1].trim() : "";

  const W = opts?.xArticle ? 1500 : 1200;
  const H = opts?.xArticle ? 600  : 630;

  // X Articles: govcloud-aws-monopoly-risk と同じ二分割レイアウト（左:テキスト / 右:クラウドアイコン）
  if (opts?.xArticle) {
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
    overflow: hidden;
  }

  /* 左パネル: テキスト (63%) */
  .left {
    width: 63%;
    background: linear-gradient(160deg, #001540 0%, #002272 60%, #002D8A 100%);
    padding: 52px 64px;
    display: flex; flex-direction: column; justify-content: space-between;
    position: relative; overflow: hidden;
  }
  .left::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 56px 56px;
    pointer-events: none;
  }

  .badge {
    position: relative; z-index: 1;
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 24px;
    padding: 8px 20px;
    font-size: 20px; font-weight: 700;
    color: rgba(255,255,255,0.9);
  }

  .title-area {
    position: relative; z-index: 1;
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    gap: 14px; padding: 16px 0;
  }
  .accent-line {
    width: 48px; height: 3px;
    background: rgba(255,255,255,0.5); border-radius: 2px;
  }
  .main-title {
    font-size: 52px; font-weight: 900;
    color: #FFFFFF; line-height: 1.35;
    letter-spacing: -0.5px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.4);
    word-break: keep-all; overflow-wrap: break-word;
  }
  .sub-title {
    font-size: 20px; font-weight: 500;
    color: rgba(255,255,255,0.65); line-height: 1.4;
  }

  .hashtag {
    position: relative; z-index: 1;
    font-size: 22px; font-weight: 700;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.5px;
  }

  /* 右パネル: クラウドアイコン (37%) */
  .right {
    width: 37%;
    background: linear-gradient(160deg, #002272 0%, #003399 100%);
    border-left: 2px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
  }
  .cloud-wrap { opacity: 0.85; }
</style>
</head>
<body>
<div class="card">
  <div class="left">
    <div class="badge">
      <span>${cat.icon}</span>
      <span>${cat.label}</span>
    </div>
    <div class="title-area">
      <div class="accent-line"></div>
      <div class="main-title">${mainTitle}</div>
      ${subTitle ? `<div class="sub-title">${subTitle}</div>` : ""}
    </div>
    <div class="hashtag">#GCInsight</div>
  </div>
  <div class="right">
    <div class="cloud-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 200" width="220" height="157">
        <path fill="#7FB8E6"
          d="M218 160H68C40 160 18 138 18 110C18 85 36 64 60 59
             C60 57 60 55 60 53C60 26 82 4 109 4
             C130 4 148 17 156 36
             C163 31 172 28 182 28
             C210 28 232 50 232 79
             C232 82 232 84 231 87
             C246 94 256 110 256 128
             C256 146 239 160 218 160Z"/>
      </svg>
    </div>
  </div>
</div>
</body>
</html>`;
  }

  // OGP モード (1200×630): 従来の単一パネルレイアウト
  const fontSize = 58;
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
    background: linear-gradient(135deg, #001F54 0%, #002D72 40%, #003D99 100%);
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 56px 64px 48px; position: relative; overflow: hidden;
  }
  .card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px; pointer-events: none;
  }
  .card::after {
    content: ''; position: absolute; top: -120px; right: -80px;
    width: 400px; height: 400px;
    background: radial-gradient(circle, ${cat.accent}22 0%, transparent 70%);
    border-radius: 50%; pointer-events: none;
  }
  .top { position: relative; z-index: 1; }
  .badge {
    display: inline-flex; align-items: center; gap: 10px;
    background: ${cat.accent}33; border: 1px solid ${cat.accent}88;
    border-radius: 28px; padding: 10px 24px;
    font-size: 22px; font-weight: 700; color: ${cat.accent};
  }
  .title-section {
    position: relative; z-index: 1; flex: 1;
    display: flex; flex-direction: column; justify-content: center; gap: 16px;
  }
  .accent-line { width: 64px; height: 4px; background: ${cat.accent}; border-radius: 2px; margin-bottom: 4px; }
  .main-title {
    font-size: ${fontSize}px; font-weight: 900; color: #FFFFFF;
    line-height: 1.35; letter-spacing: -0.5px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3); word-break: keep-all;
  }
  .sub-title { font-size: 22px; font-weight: 500; color: rgba(255,255,255,0.7); line-height: 1.4; }
  .bottom { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-text { font-size: 22px; font-weight: 700; color: rgba(255,255,255,0.9); letter-spacing: 1px; }
  .brand-sub { font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.5); }
  .tags { display: flex; gap: 10px; }
  .tag { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px; padding: 6px 18px; font-size: 17px; color: rgba(255,255,255,0.75); }
</style>
</head>
<body>
<div class="card">
  <div class="top">
    <span class="badge"><span>${cat.icon}</span>${cat.label}</span>
  </div>
  <div class="title-section">
    <div class="accent-line"></div>
    <div class="main-title">${mainTitle}</div>
    ${subTitle ? `<div class="sub-title">${subTitle}</div>` : ""}
  </div>
  <div class="bottom">
    <div class="brand">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="48" height="42"><path d="M155 128H48C25 128 8 110 8 88C8 68 22 52 42 48C42 47 42 46 42 44C42 22 60 4 82 4C100 4 114 15 122 30C128 26 135 24 143 24C164 24 182 42 182 64C182 66 182 68 181 70C192 76 198 87 198 100C198 116 184 128 166 128" stroke="white" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/><text x="56" y="108" font-family="Arial,sans-serif" font-size="60" font-weight="800" fill="white" letter-spacing="-2">GC</text></svg>
      <div>
        <div class="brand-text">GCInsight</div>
        <div class="brand-sub">ガバメントクラウド移行状況ダッシュボード</div>
      </div>
    </div>
    <div class="tags">
      ${(article.tags ?? []).slice(0, 3).map(t => `<span class="tag">#${t}</span>`).join("")}
    </div>
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
