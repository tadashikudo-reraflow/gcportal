#!/usr/bin/env python3
"""
GA4 CLI — Google Analytics 4 データ取得
使い方:
  python3 seo/ga4_cli.py --mode overview    # セッション・PV・ユーザー概要
  python3 seo/ga4_cli.py --mode pages       # ページ別PV
  python3 seo/ga4_cli.py --mode sources     # 流入元別セッション
  python3 seo/ga4_cli.py --mode all         # 全て（デフォルト）

オプション:
  --days 30          対象期間（デフォルト28日）
  --limit 20         表示件数
  --property XXXXXX  GA4プロパティID（数字のみ）

プロパティIDの確認:
  GA4コンソール → 管理 → プロパティ設定 → プロパティID
"""
import argparse
import json
import sys
import warnings
from datetime import datetime, timedelta

warnings.filterwarnings("ignore")

TOKEN_PATH = "/Users/tadashikudo/.config/google/token.json"
# GA4プロパティID（数字のみ・G-xxxxではない）
# GA4コンソール → 管理 → プロパティ設定 で確認
GA4_PROPERTY_ID = ""  # 例: "123456789"


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
    return build("analyticsdata", "v1beta", credentials=creds, cache_discovery=False)


def date_range(days: int):
    end = datetime.today() - timedelta(days=1)
    start = end - timedelta(days=days)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def run_report(service, property_id: str, dimensions: list, metrics: list, days: int, limit: int) -> list:
    start, end = date_range(days)
    resp = service.properties().runReport(
        property=f"properties/{property_id}",
        body={
            "dateRanges": [{"startDate": start, "endDate": end}],
            "dimensions": [{"name": d} for d in dimensions],
            "metrics": [{"name": m} for m in metrics],
            "limit": limit,
            "orderBys": [{"metric": {"metricName": metrics[0]}, "desc": True}],
        },
    ).execute()
    rows = []
    for row in resp.get("rows", []):
        dims = [v["value"] for v in row.get("dimensionValues", [])]
        mets = [v["value"] for v in row.get("metricValues", [])]
        rows.append(dims + mets)
    return rows


def mode_overview(service, property_id: str, days: int):
    start, end = date_range(days)
    print(f"\n== GA4 概要 ({start} 〜 {end}) ==")
    resp = service.properties().runReport(
        property=f"properties/{property_id}",
        body={
            "dateRanges": [{"startDate": start, "endDate": end}],
            "metrics": [
                {"name": "sessions"},
                {"name": "activeUsers"},
                {"name": "screenPageViews"},
                {"name": "bounceRate"},
                {"name": "averageSessionDuration"},
            ],
        },
    ).execute()
    if not resp.get("rows"):
        print("  データなし")
        return
    vals = resp["rows"][0]["metricValues"]
    print(f"  セッション数:     {int(float(vals[0]['value'])):,}")
    print(f"  アクティブユーザー: {int(float(vals[1]['value'])):,}")
    print(f"  ページビュー:     {int(float(vals[2]['value'])):,}")
    print(f"  直帰率:          {float(vals[3]['value'])*100:.1f}%")
    print(f"  平均セッション時間: {int(float(vals[4]['value']))//60}分{int(float(vals[4]['value']))%60}秒")


def mode_pages(service, property_id: str, days: int, limit: int):
    start, end = date_range(days)
    print(f"\n== ページ別PV Top{limit} ({start} 〜 {end}) ==")
    rows = run_report(service, property_id, ["pagePath"], ["screenPageViews", "sessions", "averageSessionDuration"], days, limit)
    if not rows:
        print("  データなし")
        return
    print(f"{'PV':>6} {'セッション':>10} {'滞在(秒)':>9}  パス")
    print("-" * 70)
    for r in rows:
        path, pv, sess, dur = r[0], r[1], r[2], r[3]
        print(f"{int(float(pv)):>6} {int(float(sess)):>10} {float(dur):>9.0f}  {path[:50]}")


def mode_sources(service, property_id: str, days: int, limit: int):
    start, end = date_range(days)
    print(f"\n== 流入元 Top{limit} ({start} 〜 {end}) ==")
    rows = run_report(service, property_id, ["sessionDefaultChannelGroup"], ["sessions", "activeUsers"], days, limit)
    if not rows:
        print("  データなし")
        return
    print(f"{'セッション':>10} {'ユーザー':>8}  チャネル")
    print("-" * 50)
    for r in rows:
        channel, sess, users = r[0], r[1], r[2]
        print(f"{int(float(sess)):>10} {int(float(users)):>8}  {channel}")


def main():
    global GA4_PROPERTY_ID
    parser = argparse.ArgumentParser(description="GA4 CLI for GCInsight")
    parser.add_argument("--mode", choices=["overview", "pages", "sources", "all"], default="all")
    parser.add_argument("--days", type=int, default=28)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--property", default=GA4_PROPERTY_ID, help="GA4プロパティID（数字のみ）")
    args = parser.parse_args()

    GA4_PROPERTY_ID = args.property
    if not GA4_PROPERTY_ID:
        print("エラー: --property でGA4プロパティIDを指定してください")
        print("  確認方法: GA4コンソール → 管理 → プロパティ設定 → プロパティID")
        print("  例: python3 seo/ga4_cli.py --property 123456789")
        sys.exit(1)

    try:
        service = get_service()
    except Exception as e:
        print(f"認証エラー: {e}")
        sys.exit(1)

    if args.mode in ("overview", "all"):
        mode_overview(service, GA4_PROPERTY_ID, args.days)
    if args.mode in ("pages", "all"):
        mode_pages(service, GA4_PROPERTY_ID, args.days, args.limit)
    if args.mode in ("sources", "all"):
        mode_sources(service, GA4_PROPERTY_ID, args.days, args.limit)


if __name__ == "__main__":
    main()
