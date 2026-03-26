#!/usr/bin/env python3
"""
GCInsight → X Articles ペースト用HTML生成スクリプト

1. Supabaseから記事HTMLを取得
2. mermaid/tableブロックをPlaywright(680px)でPNG化
3. カバー画像を generate-cover-images.mjs --x-article で生成
4. 全PNG を gcportal/public/images/articles/ にコピー → git push → Vercelデプロイ
5. article_paste.html 生成（img src=https://gcinsight.jp/...）
6. Chromeで自動オープン → Cmd+A → Cmd+C → X Articlesに貼るだけ

Usage:
  python3 generate_x_paste.py           # 次の未生成記事を1本処理
  python3 generate_x_paste.py --all     # 全未生成記事を一括処理
  python3 generate_x_paste.py --id 3    # 指定ID
  python3 generate_x_paste.py --no-push # git push スキップ（オフライン確認用）
"""

import os
import re
import sys
import json
import shutil
import argparse
import subprocess
import tempfile
import textwrap
import requests
from pathlib import Path
from datetime import datetime

# ── 設定 ──────────────────────────────────────────────────────────
SUPABASE_URL = "https://msbwmfggvtyexvhmlifn.supabase.co"
SUPABASE_KEY = os.environ.get(
    "SUPABASE_SERVICE_ROLE_KEY",
    "***REDACTED_SUPABASE_SERVICE_ROLE***",
)
SITE_URL = "https://gcinsight.jp"
PDF_URL  = "https://gcinsight.jp/report?from=nav"

GCPORTAL_DIR   = Path(__file__).parent.parent  # gcportal/
SCRIPTS_DIR    = GCPORTAL_DIR / "scripts"
PUBLIC_IMGS    = GCPORTAL_DIR / "public" / "images" / "articles"
PUBLIC_X_IMGS  = GCPORTAL_DIR / "public" / "images" / "x-articles"
OUT_DIR        = Path(os.path.expandvars("$GDRIVE_WORKSPACE")) / "contents" / "PJ19" / "x_articles"

XAI_KEY = os.environ.get("XAI_API_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
}

CTA_HTML = """
<hr style="margin:40px 0; border:none; border-top:2px solid #e5e7eb;">
<div style="background:#f0f7ff; border-radius:8px; padding:24px; font-size:16px; line-height:1.8;">
  <p>📊 全国1,741自治体のガバメントクラウド移行状況を無料で確認<br>
  👉 <a href="{site_url}">{site_url}</a></p>
  <p>📄 移行コスト実態レポート（無料PDF）<br>
  👉 <a href="{pdf_url}">{pdf_url}</a></p>
</div>
""".format(site_url=SITE_URL, pdf_url=PDF_URL)

# ── Supabase ─────────────────────────────────────────────────────

def get_article(article_id=None):
    params = {
        "select": "id,slug,title,content,content_format,cover_image,tags",
        "is_published": "eq.true",
        "order": "id.asc",
        "limit": 1,
    }
    if article_id:
        params["id"] = f"eq.{article_id}"
    else:
        params["x_paste_ready"] = "eq.false"

    r = requests.get(f"{SUPABASE_URL}/rest/v1/articles", headers=HEADERS, params=params)
    r.raise_for_status()
    data = r.json()
    return data[0] if data else None


def get_all_unready():
    """x_paste_ready=false な全記事を取得"""
    params = {
        "select": "id,slug,title,content,content_format,cover_image,tags",
        "is_published": "eq.true",
        "x_paste_ready": "eq.false",
        "order": "id.asc",
    }
    r = requests.get(f"{SUPABASE_URL}/rest/v1/articles", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()


def mark_paste_ready(article_id):
    """x_paste_ready フラグをセット"""
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/articles",
        headers={**HEADERS, "Content-Type": "application/json", "Prefer": "return=minimal"},
        params={"id": f"eq.{article_id}"},
        json={"x_paste_ready": True},
    )
    r.raise_for_status()

# ── HTML前処理 ────────────────────────────────────────────────────

def extract_blocks(html: str):
    """
    mermaid ブロックと table を抽出し、プレースホルダーに置換。
    Returns: (processed_html, blocks)
      blocks = [{"type": "mermaid"|"table", "render_html": str, "placeholder": str}]
      render_html: Playwright に渡す描画用HTML断片
    """
    blocks = []
    processed = html

    # 1. <pre><code class="language-mermaid">CODE</code></pre>
    for m in re.finditer(
        r'<pre[^>]*><code[^>]*class="[^"]*language-mermaid[^"]*"[^>]*>(.*?)</code></pre>',
        html, re.DOTALL | re.IGNORECASE
    ):
        ph = f"__FIGURE_{len(blocks)}__"
        # HTMLエンティティをデコードしてmermaidコードを取得
        import html as html_mod
        mermaid_code = html_mod.unescape(m.group(1))
        render_html = f'<div class="mermaid">{mermaid_code}</div>'
        blocks.append({"type": "mermaid", "render_html": render_html, "placeholder": ph, "original": m.group(0)})

    # 2. <div class="mermaid">
    for m in re.finditer(
        r'<div[^>]*class="[^"]*mermaid[^"]*"[^>]*>(.*?)</div>',
        html, re.DOTALL | re.IGNORECASE
    ):
        if any(b["original"] == m.group(0) for b in blocks if "original" in b):
            continue
        ph = f"__FIGURE_{len(blocks)}__"
        blocks.append({"type": "mermaid", "render_html": m.group(0), "placeholder": ph, "original": m.group(0)})

    # 3. <table>
    for m in re.finditer(r'<table[\s\S]*?</table>', html, re.DOTALL | re.IGNORECASE):
        ph = f"__FIGURE_{len(blocks)}__"
        blocks.append({"type": "table", "render_html": m.group(0), "placeholder": ph, "original": m.group(0)})

    # プレースホルダー置換
    for block in blocks:
        processed = processed.replace(block["original"], block["placeholder"], 1)

    return processed, blocks

# ── Playwright PNG生成 ────────────────────────────────────────────

PLAYWRIGHT_SCRIPT = """
const {{ chromium }} = require('playwright');

(async () => {{
  const items = {items_json};
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({{ width: 680, height: 800 }});

  for (const item of items) {{
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif;
          background: #fff; padding: 16px; width: 648px; }}
  table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
  th, td {{ border: 1px solid #d1d5db; padding: 8px 12px; text-align: left; }}
  th {{ background: #f3f4f6; font-weight: 600; }}
  tr:nth-child(even) {{ background: #f9fafb; }}
  .mermaid {{ font-size: 14px; }}
</style>
</head><body>
<script>mermaid.initialize({{ startOnLoad: true, theme: 'base' }});</script>
${{item.html}}
</body></html>`;

    await page.setContent(html, {{ waitUntil: 'networkidle' }});

    // mermaid 描画待ち
    try {{ await page.waitForSelector('svg', {{ timeout: 5000 }}); }} catch(e) {{}}

    const body = await page.$('body');
    const box = await body.boundingBox();
    const h = Math.min(Math.ceil((box && box.height) || 400) + 32, 2000);
    await page.setViewportSize({{ width: 680, height: h }});
    await page.screenshot({{ path: item.out, clip: {{ x: 0, y: 0, width: 680, height: h }} }});
    console.log('OK:', item.out);
  }}

  await browser.close();
}})();
"""

def render_blocks_to_png(blocks, slug, tmp_dir: Path):
    """各ブロックをPlaywrightでPNG化。ファイルパスのリストを返す。"""
    if not blocks:
        return []

    items = []
    png_paths = []
    for i, block in enumerate(blocks):
        out = str(tmp_dir / f"{slug}-figure-{i+1}.png")
        items.append({"html": block["render_html"], "out": out})
        png_paths.append(out)

    script_path = tmp_dir / "render_blocks.js"
    script_content = PLAYWRIGHT_SCRIPT.format(items_json=json.dumps(items))
    script_path.write_text(script_content)

    result = subprocess.run(
        ["node", str(script_path)],
        cwd=str(tmp_dir),
        env={**os.environ, "NODE_PATH": str(GCPORTAL_DIR / "node_modules")},
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"⚠️  Playwright エラー:\n{result.stderr}")
    else:
        for line in result.stdout.strip().splitlines():
            print(f"  {line}")

    return [p for p in png_paths if Path(p).exists()]

# ── カバー画像生成（Grok + HTML テンプレート + Playwright）────────────

def _grok_prompt_from_article(article):
    """記事タイトル・タグからGrok画像生成プロンプトを生成"""
    title = article["title"].split("｜")[0].strip()
    tags = article.get("tags") or []
    tag_str = ", ".join(tags[:3])
    return (
        f"Isometric illustration for Japanese government cloud article about '{title}', "
        f"themes: {tag_str}, Japan National Diet Building connected to cloud servers, "
        "deep blue and sky blue tones, clean vector style, no text, minimalist modern design"
    )

def _gen_grok_image(prompt, save_path):
    """xAI REST API で画像生成 → save_path に保存"""
    from PIL import Image
    from io import BytesIO
    import base64

    r = requests.post(
        "https://api.x.ai/v1/images/generations",
        headers={"Authorization": f"Bearer {XAI_KEY}", "Content-Type": "application/json"},
        json={"model": "grok-imagine-image", "prompt": prompt, "n": 1, "response_format": "b64_json"},
        timeout=120,
    )
    r.raise_for_status()
    b64 = r.json()["data"][0]["b64_json"]
    img = Image.open(BytesIO(base64.b64decode(b64)))
    img.save(save_path)
    return img.size

def _render_cover_html(article, illust_b64, out_path):
    """左テキスト＋右イラストのHTMLテンプレートをPlaywrightで1500×600レンダリング"""
    import asyncio
    from playwright.async_api import async_playwright

    title_parts = article["title"].split("｜")
    title = title_parts[0].strip()
    subtitle = title_parts[1].strip() if len(title_parts) > 1 else ""
    tags = article.get("tags") or []
    tag = tags[0] if tags else "ガバメントクラウド"

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:1500px; height:600px; background:#EEF4FB;
       font-family:"Hiragino Sans","ヒラギノ角ゴシック",sans-serif; overflow:hidden; position:relative; }}
.grid {{ position:absolute; inset:0;
  background-image: linear-gradient(rgba(30,90,180,0.08) 1px,transparent 1px),
                    linear-gradient(90deg,rgba(30,90,180,0.08) 1px,transparent 1px);
  background-size:40px 40px; }}
.container {{ position:relative; display:flex; align-items:center; height:100%; padding:60px 0 60px 80px; }}
.text-area {{ flex:0 0 620px; display:flex; flex-direction:column; gap:20px; z-index:2; }}
.label {{ font-size:22px; font-weight:600; color:#1E5AB4; letter-spacing:0.05em; }}
.title {{ font-size:52px; font-weight:800; color:#0D1F3C; line-height:1.25; letter-spacing:-0.01em;
          word-break:keep-all; overflow-wrap:break-word; }}
.subtitle {{ font-size:20px; font-weight:400; color:#4A6FA5; line-height:1.6; }}
.tag {{ display:inline-block; background:#1E5AB4; color:white; font-size:16px;
        font-weight:600; padding:6px 16px; border-radius:4px; }}
.illust-area {{ flex:1; height:100%; position:relative; }}
.illust-area img {{ height:560px; width:auto; object-fit:contain;
                   position:absolute; right:-10px; bottom:0;
                   filter:drop-shadow(0 8px 24px rgba(30,90,180,0.15)); }}
</style></head>
<body>
<div class="grid"></div>
<div class="container">
  <div class="text-area">
    <span class="label">GCInsight コラム</span>
    <h1 class="title">{title}</h1>
    {"<p class='subtitle'>" + subtitle + "</p>" if subtitle else ""}
    <span class="tag"># {tag}</span>
  </div>
  <div class="illust-area">
    <img src="data:image/png;base64,{illust_b64}">
  </div>
</div>
</body></html>"""

    html_file = Path("/tmp/cover_render.html")
    html_file.write_text(html)

    async def _render():
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            ctx = await browser.new_context(viewport={"width": 1500, "height": 600})
            page = await ctx.new_page()
            await page.goto("http://localhost:9876/cover_render.html")
            await page.wait_for_timeout(500)
            await page.screenshot(path=str(out_path), clip={"x": 0, "y": 0, "width": 1500, "height": 600})
            await browser.close()

    asyncio.run(_render())


def generate_cover_image(article):
    """Grok画像生成 → HTMLテンプレート合成 → Playwright → x-articles/id{N}/cover.png"""
    import base64
    slug = article["slug"]
    article_id = article["id"]

    x_img_dir = PUBLIC_X_IMGS / f"id{article_id}"
    x_img_dir.mkdir(parents=True, exist_ok=True)
    cover_path = x_img_dir / "cover.png"

    if cover_path.exists():
        print(f"🖼  カバー画像: 既存を流用 (x-articles/id{article_id}/cover.png)")
        return f"id{article_id}/cover.png"

    print(f"🖼  カバー画像生成 (Grok+HTML): id{article_id} {slug}")

    # Step1: Grok画像生成
    illust_path = Path(f"/tmp/grok_illust_id{article_id}.png")
    prompt = _grok_prompt_from_article(article)
    try:
        size = _gen_grok_image(prompt, str(illust_path))
        print(f"  ✅ Grokイラスト生成: {size}")
    except Exception as e:
        print(f"  ⚠️  Grok生成失敗: {e} → OGP画像をフォールバック")
        ogp = PUBLIC_IMGS / f"{slug}.png"
        return f"articles/{slug}.png" if ogp.exists() else None

    # Step2: Base64変換
    with open(illust_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()

    # Step3: HTML合成 → Playwright レンダリング
    try:
        _render_cover_html(article, b64, cover_path)
        print(f"  ✅ カバー保存: x-articles/id{article_id}/cover.png")
    except Exception as e:
        print(f"  ⚠️  Playwright失敗: {e}")
        return None

    return f"id{article_id}/cover.png"

# ── git push ─────────────────────────────────────────────────────

def git_push(slug):
    """新規PNGをコミット＆プッシュ（Vercel自動デプロイ）"""
    print("🚀 git push → Vercel デプロイ...")
    cmds = [
        ["git", "add", "public/images/x-articles/"],
        ["git", "commit", "-m", f"feat: X Article images for {slug}"],
        ["git", "push"],
    ]
    for cmd in cmds:
        r = subprocess.run(cmd, cwd=str(GCPORTAL_DIR), capture_output=True, text=True)
        if r.returncode != 0:
            # "nothing to commit" は正常
            if "nothing to commit" in r.stdout + r.stderr:
                print("  変更なし（既にプッシュ済み）")
                return
            print(f"  ⚠️  {' '.join(cmd)}: {r.stderr.strip()}")
            return
    print("  ✅ push 完了（Vercelデプロイ開始）")

# ── paste HTML生成 ────────────────────────────────────────────────

def build_paste_html(article, body_html_with_phs, blocks, figure_filenames, cover_filename):
    """
    プレースホルダーを <img src="https://gcinsight.jp/..."> に置換して
    X Articles用ペーストHTMLを生成する。
    """
    body = body_html_with_phs

    # figure置換
    for block, fname in zip(blocks, figure_filenames):
        img_url = f"{SITE_URL}/images/x-articles/{fname}"
        img_tag = f'<img src="{img_url}" alt="図解" style="max-width:100%;border-radius:8px;margin:16px 0;">'
        body = body.replace(block["placeholder"], img_tag)

    # プレースホルダーが残っていたら除去（PNG生成失敗分）
    body = re.sub(r'__FIGURE_\d+__', '', body)

    # カバー画像URL
    cover_url = f"{SITE_URL}/images/x-articles/{cover_filename}" if cover_filename else ""

    # タイトル・リード
    title = article["title"]

    paste_html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
  /* X Articles ペースト用 — このスタイルは貼り付け時に無視されるが
     Chromeプレビュー用に記述 */
  body {{
    font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif;
    max-width: 680px; margin: 0 auto; padding: 24px 16px;
    font-size: 17px; line-height: 1.8; color: #0f1419;
  }}
  h1 {{ font-size: 28px; font-weight: 800; margin: 0 0 24px; }}
  h2 {{ font-size: 22px; font-weight: 700; margin: 40px 0 12px;
        border-bottom: 3px solid #1d9bf0; padding-bottom: 6px; }}
  h3 {{ font-size: 18px; font-weight: 700; margin: 28px 0 8px; }}
  p  {{ margin: 0 0 16px; }}
  img {{ max-width: 100%; border-radius: 8px; margin: 16px 0; display: block; }}
  strong {{ font-weight: 700; }}
  ul, ol {{ margin: 0 0 16px; padding-left: 1.5em; }}
  li {{ margin-bottom: 6px; }}
  a  {{ color: #1d9bf0; }}
  hr {{ border: none; border-top: 2px solid #e7e7e7; margin: 32px 0; }}
  .cover {{ width: 100%; border-radius: 12px; margin-bottom: 32px; }}
</style>
</head>
<body>
<!-- ▼ ここからコピー（Cmd+A → Cmd+C） -->
{"<img src=" + repr(cover_url) + ' alt="カバー画像" class="cover">' if cover_url else ""}
<h1>{title}</h1>

{body}

{CTA_HTML}
<!-- ▲ ここまでコピー -->

<hr style="margin-top:48px">
<p style="color:#9ca3af;font-size:13px;">
  📋 このページをChromeで開き Cmd+A → Cmd+C → X Articlesエディタで Cmd+V<br>
  🖼 カバー画像: <a href="{cover_url}" target="_blank">{cover_url}</a>
</p>
</body>
</html>
"""
    return paste_html

# ── メイン ───────────────────────────────────────────────────────

def process_article(article, no_push=False, open_browser=True):
    """1記事分のHTML生成処理"""
    slug  = article["slug"]
    title = article["title"]
    print(f"\n📄 [{article['id']}] {title}")
    print(f"   slug: {slug}\n")

    # 出力ディレクトリ確保
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    article_out_dir = OUT_DIR / f"id{article['id']}"
    article_out_dir.mkdir(exist_ok=True)

    # HTMLからブロック抽出
    html_content = article.get("content", "")
    body_with_phs, blocks = extract_blocks(html_content)
    print(f"🔍 抽出ブロック: mermaid={sum(1 for b in blocks if b['type']=='mermaid')} / table={sum(1 for b in blocks if b['type']=='table')}")

    # ブロックをPNG化
    figure_filenames = []
    if blocks:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            png_paths = render_blocks_to_png(blocks, slug, tmp_dir)

            x_img_dir = PUBLIC_X_IMGS / f"id{article['id']}"
            x_img_dir.mkdir(parents=True, exist_ok=True)
            for i, (block, png_path) in enumerate(zip(blocks, png_paths)):
                fname = f"figure-{i+1}.png"
                shutil.copy2(png_path, str(x_img_dir / fname))
                shutil.copy2(png_path, str(article_out_dir / fname))
                figure_filenames.append(f"id{article['id']}/{fname}")
                print(f"  ✅ x-articles/id{article['id']}/{fname}")
    else:
        print("  (図解ブロックなし)")

    # カバー画像生成（Grok+HTML+Playwright）
    cover_fname = generate_cover_image(article)

    # Drive側にもカバーをコピー
    cover_src = PUBLIC_X_IMGS / f"id{article['id']}" / "cover.png"
    if cover_src.exists():
        shutil.copy2(str(cover_src), str(article_out_dir / "cover.png"))

    # git push（バッチ時は最後にまとめてpushするため個別にはスキップ可）
    if not no_push:
        git_push(slug)
        print("  ⏳ Vercelデプロイ完了まで約30秒お待ちください\n")
    else:
        print("  ⏭  git push スキップ\n")

    # paste HTML 生成
    paste_html = build_paste_html(article, body_with_phs, blocks, figure_filenames, cover_fname)
    paste_path = article_out_dir / "article_paste.html"
    paste_path.write_text(paste_html, encoding="utf-8")
    print(f"📋 ペーストHTML生成: {paste_path}")

    # Supabase x_paste_ready フラグをセット
    try:
        mark_paste_ready(article["id"])
        print(f"  ✅ Supabase x_paste_ready=true 更新済み")
    except Exception as e:
        print(f"  ⚠️  Supabase更新失敗（カラム未作成の可能性）: {e}")

    # Chrome で自動オープン（バッチ時はスキップ）
    if open_browser:
        subprocess.run(["open", str(paste_path)])
        print(f"\n✅ 完了！")
        print(f"   Chromeが開いたら Cmd+A → Cmd+C → X Articlesで Cmd+V")
        print(f"   カバー画像は別途アップロード: {cover_fname}")

    return paste_path


def main():
    parser = argparse.ArgumentParser(description="X Articles ペーストHTML生成")
    parser.add_argument("--id",      type=int, help="記事ID指定（省略時: 次の未生成）")
    parser.add_argument("--all",     action="store_true", help="未生成記事を全件一括処理")
    parser.add_argument("--no-push", action="store_true", help="git push をスキップ")
    args = parser.parse_args()

    if args.all:
        # バッチモード: 全未生成記事を処理
        articles = get_all_unready()
        if not articles:
            print("✅ 全件のX HTML生成済みです。")
            return
        print(f"🔄 {len(articles)}本を一括処理します...\n")
        results = []
        for article in articles:
            paste_path = process_article(article, no_push=True, open_browser=False)
            results.append((article["id"], article["title"], paste_path))

        # まとめてgit push
        if not args.no_push:
            print("\n🚀 全PNG/カバー画像をまとめてgit push...")
            import subprocess as sp
            sp.run(["git", "-C", str(GCPORTAL_DIR), "add", "public/images/x-articles/"], check=True)
            sp.run(["git", "-C", str(GCPORTAL_DIR), "commit", "-m", f"feat: X Article images batch ({len(articles)} articles)"], check=True)
            sp.run(["git", "-C", str(GCPORTAL_DIR), "push"], check=True)
            print("  ⏳ Vercelデプロイ完了まで約30秒お待ちください\n")

        print(f"\n✅ {len(results)}本の処理完了:")
        for article_id, title, paste_path in results:
            print(f"  [{article_id}] {title}")
            print(f"       → {paste_path}")
        return

    # 1本モード
    article = get_article(args.id)
    if not article:
        print("✅ X HTML未生成記事はありません。" if not args.id else "❌ 記事が見つかりません")
        sys.exit(0 if not args.id else 1)

    process_article(article, no_push=args.no_push, open_browser=True)

if __name__ == "__main__":
    main()
