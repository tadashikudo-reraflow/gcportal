#!/usr/bin/env python3
"""
GSC CLI — Google Search Console データ取得
使い方:
  python3 seo/gsc_cli.py --mode index   # インデックス状況確認
  python3 seo/gsc_cli.py --mode queries # 検索クエリ上位30件
  python3 seo/gsc_cli.py --mode pages   # ページ別パフォーマンス
  python3 seo/gsc_cli.py --mode all     # 全て表示（デフォルト）

オプション:
  --days 30        # 対象期間（デフォルト28日）
  --limit 20       # 表示件数
  --url https://...  # 特定URL のインデックス確認
"""
import argparse
import json
import sys
import warnings
from datetime import datetime, timedelta

warnings.filterwarnings("ignore")

TOKEN_PATH = "/Users/tadashikudo/.config/google/token.json"
SITE_URL = "sc-domain:gcinsight.jp"  # GSC で登録されているプロパティURL


def get_service():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    with open(TOKEN_PATH) as f:
        token_data = json.load(f)

    creds = Credentials(
        token=token_data["token"],
        refresh_token=token_data["refresh_token"],
        token_uri=token_data["token_uri"],
        client_id=token_data["client_id"],
        client_secret=token_data["client_secret"],
        scopes=token_data["scopes"],
    )
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def date_range(days: int):
    end = datetime.today() - timedelta(days=3)  # GSCは3日遅延
    start = end - timedelta(days=days)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def mode_queries(service, days: int, limit: int):
    start, end = date_range(days)
    print(f"\n== 検索クエリ Top{limit} ({start} 〜 {end}) ==")
    resp = service.searchanalytics().query(
        siteUrl=SITE_URL,
        body={
            "startDate": start,
            "endDate": end,
            "dimensions": ["query"],
            "rowLimit": limit,
            "orderBy": [{"fieldName": "clicks", "sortOrder": "DESCENDING"}],
        },
    ).execute()

    rows = resp.get("rows", [])
    if not rows:
        print("  データなし（インデックス未登録 or トラフィックゼロ）")
        return

    print(f"{'クリック':>6} {'表示':>8} {'CTR':>6} {'順位':>6}  クエリ")
    print("-" * 60)
    for r in rows:
        q = r["keys"][0]
        print(f"{r['clicks']:>6.0f} {r['impressions']:>8.0f} {r['ctr']*100:>5.1f}% {r['position']:>6.1f}  {q}")


def mode_pages(service, days: int, limit: int):
    start, end = date_range(days)
    print(f"\n== ページ別パフォーマンス Top{limit} ({start} 〜 {end}) ==")
    resp = service.searchanalytics().query(
        siteUrl=SITE_URL,
        body={
            "startDate": start,
            "endDate": end,
            "dimensions": ["page"],
            "rowLimit": limit,
            "orderBy": [{"fieldName": "clicks", "sortOrder": "DESCENDING"}],
        },
    ).execute()

    rows = resp.get("rows", [])
    if not rows:
        print("  データなし")
        return

    print(f"{'クリック':>6} {'表示':>8} {'CTR':>6} {'順位':>6}  URL")
    print("-" * 80)
    for r in rows:
        url = r["keys"][0].replace("https://gcinsight.jp", "")
        print(f"{r['clicks']:>6.0f} {r['impressions']:>8.0f} {r['ctr']*100:>5.1f}% {r['position']:>6.1f}  {url}")


def mode_index(service, url: str = None):
    print("\n== インデックス状況 ==")
    if url:
        # 特定URLのインデックス確認
        resp = service.urlInspection().index().inspect(
            body={"inspectionUrl": url, "siteUrl": SITE_URL}
        ).execute()
        result = resp.get("inspectionResult", {})
        idx = result.get("indexStatusResult", {})
        print(f"URL: {url}")
        print(f"  カバレッジ状態: {idx.get('coverageState', '不明')}")
        print(f"  インデックス登録: {idx.get('indexingState', '不明')}")
        print(f"  最終クロール: {idx.get('lastCrawlTime', '不明')}")
        verdict = idx.get("verdict", "不明")
        print(f"  判定: {verdict}")
    else:
        # サイト全体のカバレッジサマリー（クロール統計）
        try:
            resp = service.sites().list().execute()
            sites = resp.get("siteEntry", [])
            matched = [s for s in sites if SITE_URL in s.get("siteUrl", "")]
            if matched:
                print(f"  登録済みプロパティ: {matched[0]['siteUrl']}")
                print(f"  権限レベル: {matched[0].get('permissionLevel', '不明')}")
            else:
                print(f"  プロパティ '{SITE_URL}' が見つかりません")
                print("  登録済みサイト一覧:")
                for s in sites:
                    print(f"    - {s['siteUrl']} ({s.get('permissionLevel','')})")
        except Exception as e:
            print(f"  エラー: {e}")


def main():
    global SITE_URL
    parser = argparse.ArgumentParser(description="GSC CLI for GCInsight")
    parser.add_argument("--mode", choices=["queries", "pages", "index", "all"], default="all")
    parser.add_argument("--days", type=int, default=28)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--url", help="特定URLのインデックス確認")
    parser.add_argument("--site", default=SITE_URL, help="GSCプロパティURL")
    args = parser.parse_args()

    SITE_URL = args.site

    try:
        service = get_service()
    except Exception as e:
        print(f"認証エラー: {e}")
        print(f"トークン: {TOKEN_PATH}")
        sys.exit(1)

    if args.mode == "index" or args.mode == "all":
        mode_index(service, args.url)

    if args.mode == "queries" or args.mode == "all":
        mode_queries(service, args.days, args.limit)

    if args.mode == "pages" or args.mode == "all":
        mode_pages(service, args.days, args.limit)


if __name__ == "__main__":
    main()
