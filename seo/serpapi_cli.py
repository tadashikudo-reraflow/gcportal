#!/usr/bin/env python3
"""
SerpAPI CLI — 検索順位・競合分析
使い方:
  python3 seo/serpapi_cli.py --kw "ガバメントクラウド 遅延"
  python3 seo/serpapi_cli.py --kw "自治体システム標準化" --limit 10
  python3 seo/serpapi_cli.py --kw "ガバクラ 移行" --site gcinsight.jp
  python3 seo/serpapi_cli.py --batch  # デフォルトKWリスト一括チェック

オプション:
  --kw "キーワード"   検索クエリ
  --limit N          表示件数（デフォルト10）
  --site domain      指定ドメインの順位をハイライト
  --batch            GCInsightのターゲットKW全件チェック
  --gl jp            国コード（デフォルト: jp）
  --hl ja            言語コード（デフォルト: ja）
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request

API_KEY = os.environ.get("SERPAPI_KEY", "")
BASE_URL = "https://serpapi.com/search.json"

# GCInsight ターゲットKWリスト
TARGET_KWS = [
    "ガバメントクラウド 遅延",
    "ガバメントクラウド 移行 費用",
    "自治体システム標準化",
    "特定移行支援システム 一覧",
    "ガバクラ 自治体",
    "ガバメントクラウド とは",
    "自治体 クラウド 移行 費用",
    "FinOps クラウドコスト管理 自治体",
]

TARGET_DOMAIN = "gcinsight.jp"


def serp_search(query: str, limit: int = 10, gl: str = "jp", hl: str = "ja") -> dict:
    if not API_KEY:
        print("エラー: SERPAPI_KEY が未設定。~/.zshrc に export SERPAPI_KEY=... を追加してください")
        sys.exit(1)
    params = {
        "q": query,
        "api_key": API_KEY,
        "gl": gl,
        "hl": hl,
        "num": limit,
        "google_domain": "google.co.jp",
    }
    url = BASE_URL + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read())


def print_results(query: str, data: dict, site: str = TARGET_DOMAIN, limit: int = 10):
    results = data.get("organic_results", [])
    print(f"\n== {query} ==")

    our_pos = None
    for i, r in enumerate(results[:limit], 1):
        link = r.get("link", "")
        title = r.get("title", "")[:50]
        domain = urllib.parse.urlparse(link).netloc.replace("www.", "")
        marker = " ◀ GCInsight" if site in link else ""
        if site in link:
            our_pos = i
        print(f"  {i:2d}. [{domain}] {title}{marker}")

    if our_pos:
        print(f"  → GCInsight: {our_pos}位")
    else:
        print(f"  → GCInsight: 圏外（Top{limit}以内になし）")

    # 上位3件の要約（競合分析用）
    top3 = results[:3]
    if top3:
        print(f"  Top3ドメイン: {', '.join(urllib.parse.urlparse(r.get('link','')).netloc.replace('www.','') for r in top3)}")


def main():
    parser = argparse.ArgumentParser(description="SerpAPI CLI for GCInsight")
    parser.add_argument("--kw", help="検索キーワード")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--site", default=TARGET_DOMAIN)
    parser.add_argument("--batch", action="store_true", help="ターゲットKW全件チェック")
    parser.add_argument("--gl", default="jp")
    parser.add_argument("--hl", default="ja")
    args = parser.parse_args()

    if args.batch:
        print(f"== GCInsight 順位バッチチェック ({len(TARGET_KWS)}件) ==")
        for kw in TARGET_KWS:
            data = serp_search(kw, args.limit, args.gl, args.hl)
            print_results(kw, data, args.site, args.limit)
    elif args.kw:
        data = serp_search(args.kw, args.limit, args.gl, args.hl)
        print_results(args.kw, data, args.site, args.limit)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
