#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations
"""
KW vs 既存記事タイトル の類似度判定スクリプト

PJ19 gcinsight-seo-daily SKILL.md Step 1.5 から呼び出される。
新規 KW を embed → 全記事タイトル/descriptionを embed → cos類似度トップN出力。
類似度 ≥ DUP_THRESHOLD なら DUPLICATE フラグで exit 1 終了。

Usage:
    python3 check_kw_duplicate.py "<KW>"
    # exit 0: 重複なし（新規KW OK）
    # exit 1: 重複検出（既存記事と類似度 >= 閾値）
    # exit 2: GSC ですでに既存記事が当該KWで上位ランクイン

Output: JSON to stdout
{
  "kw": "...",
  "duplicate": false,
  "gsc_rank_check": {"existing_article": "...", "position": 12, "skip": true|false},
  "top_matches": [{"slug": "...", "title": "...", "similarity": 0.92}, ...]
}
"""
import os
import sys
import json
import subprocess
from pathlib import Path

# 閾値: 2段構え
# - DUP_THRESHOLD: タイトル/slug にKW主要ワードが含まれない場合の embedding 閾値
# - DUP_THRESHOLD_WITH_KEYWORD: タイトル/slugにKW主要ワードを含む既存記事は、より低い類似度でも重複判定
DUP_THRESHOLD = 0.75
DUP_THRESHOLD_WITH_KEYWORD = 0.50
TOP_N = 5

ENV_LOCAL = Path(__file__).parent.parent / ".env.local"


def load_env() -> dict:
    """gcportal/.env.local をロード"""
    env = {}
    if not ENV_LOCAL.exists():
        print(f"[ERROR] .env.local not found: {ENV_LOCAL}", file=sys.stderr)
        sys.exit(3)
    for line in ENV_LOCAL.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def fetch_articles(env):
    """is_published=true の記事一覧を取得"""
    cmd = [
        "psql",
        "-h", "aws-1-ap-northeast-1.pooler.supabase.com",
        "-p", "5432",
        "-U", "postgres.msbwmfggvtyexvhmlifn",
        "-d", "postgres",
        "-t", "-A", "-F", "\t",
        "-c", "SELECT id, slug, title, COALESCE(description,'') FROM articles WHERE is_published=true ORDER BY id;",
    ]
    e = os.environ.copy()
    e["PGPASSWORD"] = env["SUPABASE_DB_PASSWORD"]
    r = subprocess.run(cmd, capture_output=True, text=True, env=e)
    if r.returncode != 0:
        print(f"[ERROR] psql failed: {r.stderr}", file=sys.stderr)
        sys.exit(3)
    articles = []
    for line in r.stdout.strip().splitlines():
        parts = line.split("\t")
        if len(parts) >= 3:
            articles.append({
                "id": int(parts[0]),
                "slug": parts[1],
                "title": parts[2],
                "description": parts[3] if len(parts) > 3 else "",
            })
    return articles


def embed(texts, api_key, max_retries=3):
    """OpenAI text-embedding-3-small で embedding 取得（リトライ付き）"""
    import urllib.request
    import urllib.error
    import time
    last_err = None
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/embeddings",
                data=json.dumps({
                    "model": "text-embedding-3-small",
                    "input": texts,
                }).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.loads(resp.read())
            return [item["embedding"] for item in body["data"]]
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, TimeoutError) as e:
            last_err = e
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"embed() failed after {max_retries} retries: {last_err}")


def cos_sim(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = sum(x * x for x in a) ** 0.5
    nb = sum(y * y for y in b) ** 0.5
    return dot / (na * nb) if na and nb else 0.0


def gsc_query_page_check(kw, candidate_slugs):
    """GSC で page+query 両次元判定。

    候補slug毎に --page /articles/<slug> で GSC クエリを取得し、
    KW主要ワードがクエリに含まれかつ position<=15 なら canonical=その slug。

    返り値:
      None = GSC使用不可
      {"matched_slug": "...", "matched_query": "...", "position": ..., "skip_recommended": True}
    """
    gsc_cli = Path.home() / "workspace/scripts/gsc_cli.py"
    if not gsc_cli.exists():
        return None
    kw_words = [w for w in kw.split() if len(w) >= 2]
    if not kw_words:
        return None
    for slug in candidate_slugs[:5]:  # 上位5本のみチェック（コスト/時間制限）
        page_path = f"/articles/{slug}"
        try:
            r = subprocess.run(
                ["python3", str(gsc_cli), "--mode", "queries", "--days", "28",
                 "--limit", "50", "--page", page_path],
                capture_output=True, text=True, timeout=30,
            )
            if r.returncode != 0:
                continue
            for line in r.stdout.splitlines():
                parts = line.split()
                if len(parts) < 5:
                    continue
                try:
                    clicks = int(parts[0])
                    impressions = int(parts[1])
                    position = float(parts[3])
                except ValueError:
                    continue
                query = " ".join(parts[4:])
                # KW主要ワード全部 or stem が含まれるかチェック
                def matches(q, word):
                    return word in q or (len(word) >= 3 and word[:3] in q)
                if all(matches(query, w) for w in kw_words) and position <= 20:
                    return {
                        "matched_slug": slug,
                        "matched_page": page_path,
                        "matched_query": query,
                        "position": position,
                        "impressions": impressions,
                        "clicks": clicks,
                        "skip_recommended": position <= 15,
                    }
        except Exception as e:
            print(f"[WARN] GSC check failed for {slug}: {e}", file=sys.stderr)
            continue
    return None


def main():
    if len(sys.argv) < 2:
        print("Usage: check_kw_duplicate.py '<KW>'", file=sys.stderr)
        sys.exit(3)
    kw = sys.argv[1].strip()

    env = load_env()
    api_key = env.get("OPENAI_API_KEY")
    db_password = env.get("SUPABASE_DB_PASSWORD")
    if not api_key:
        print(json.dumps({"error": "OPENAI_API_KEY not found in .env.local", "exit": 3}), file=sys.stderr)
        sys.exit(3)
    if not db_password:
        print(json.dumps({"error": "SUPABASE_DB_PASSWORD not found in .env.local", "exit": 3}), file=sys.stderr)
        sys.exit(3)

    articles = fetch_articles(env)
    if not articles:
        print(json.dumps({"kw": kw, "duplicate": False, "top_matches": [], "note": "no articles"}, ensure_ascii=False))
        sys.exit(0)

    # embedding: KW + 全記事の title+description
    inputs = [kw] + [f"{a['title']}\n{a['description']}" for a in articles]
    embeddings = embed(inputs, api_key)
    kw_vec = embeddings[0]

    # KW を主要ワードに分解（2文字以上のトークン）+ 各トークンの2-3字stem
    # 純数値/年号トークン（2026, 2025等）は除外（汎用すぎて偽陽性の原因）
    kw_tokens = [t for t in kw.split() if len(t) >= 2 and not t.isdigit()]

    def token_variants(t):
        """日本語トークンの核ワード抽出: 完全形 + 先頭2字stem + 先頭3字stem"""
        v = {t.lower()}
        if len(t) >= 3:
            v.add(t[:3].lower())
        if len(t) >= 2:
            v.add(t[:2].lower())
        return v

    scored = []
    for art, vec in zip(articles, embeddings[1:]):
        haystack = (art["title"] + " " + art["slug"]).lower()
        # 各トークンが（完全形 or stem）で haystack に含まれるかカウント
        matches = 0
        for t in kw_tokens:
            if any(v in haystack for v in token_variants(t)):
                matches += 1
        # 過半数（≥50%）かつ最低2トークン一致 = keyword_match
        keyword_match = (matches >= max(2, len(kw_tokens) * 0.5)) if len(kw_tokens) >= 2 else (matches >= 1)
        sim = round(cos_sim(kw_vec, vec), 4)
        threshold = DUP_THRESHOLD_WITH_KEYWORD if keyword_match else DUP_THRESHOLD
        scored.append({
            "id": art["id"],
            "slug": art["slug"],
            "title": art["title"],
            "similarity": sim,
            "keyword_match": keyword_match,
            "triggered": sim >= threshold,
        })
    scored.sort(key=lambda x: -x["similarity"])
    top = scored[:TOP_N]

    is_duplicate = any(s["triggered"] for s in scored)

    # GSC page+query 両次元 pre-check（embedding上位5本のみ照合）
    candidate_slugs = [s["slug"] for s in scored[:5]]
    gsc = gsc_query_page_check(kw, candidate_slugs)

    result = {
        "kw": kw,
        "threshold": DUP_THRESHOLD,
        "duplicate": is_duplicate,
        "top_matches": top,
        "gsc_rank_check": gsc,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))

    if is_duplicate:
        sys.exit(1)
    if gsc and gsc.get("skip_recommended"):
        sys.exit(2)
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as e:
        # 未捕捉例外は必ず exit 3 で返す。
        # exit 1 (重複検知) と区別しないと SKILL.md 側が誤って KW をスキップする。
        import traceback
        print(json.dumps({
            "error": f"{type(e).__name__}: {e}",
            "exit": 3,
            "traceback": traceback.format_exc().splitlines()[-5:],
        }, ensure_ascii=False), file=sys.stderr)
        sys.exit(3)
