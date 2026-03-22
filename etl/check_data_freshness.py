#!/usr/bin/env python3
from __future__ import annotations

"""GCInsight データ鮮度チェック

各JSONの data_month / updated_at を読み取り、現在日付と比較して古いデータを警告する。
sources.json の pending_downloads にURLがあるものをリスト表示する。

Usage:
    python check_data_freshness.py
"""

import json
import os
import sys
from datetime import date, datetime
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "public" / "data"
SOURCES_PATH = Path(__file__).parent / "data" / "gov_downloads" / "sources.json"

# チェック対象: (ファイル名, 日付取得方法)
TARGET_FILES = [
    ("standardization.json", "data_month"),       # summary.data_month = "2026-01"
    ("tokutei_detail.json", "updated_at"),         # updated_at = "2026-03-21"
    ("tokutei_municipalities.json", "updated_at"), # updated_at = "2026-02-27"
    ("migration_stats.json", "updated_at"),        # updated_at = "2026-03-22"
]


def parse_date_field(data: dict, field: str) -> tuple[str, date | None]:
    """JSONからフィールドを取得してdate型に変換する。"""
    if field == "data_month":
        raw = data.get("summary", {}).get("data_month", "")
    else:
        raw = data.get(field, "")

    if not raw:
        return raw, None

    try:
        if len(raw) == 7:  # "2026-01"
            return raw, datetime.strptime(raw + "-01", "%Y-%m-%d").date()
        else:  # "2026-03-22"
            return raw, datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        return raw, None


def check_freshness() -> int:
    """鮮度チェックを実行し、問題があれば1を返す。"""
    today = date.today()
    issues = 0

    print("=== GCInsight データ鮮度チェック ===")
    print(f"実行日: {today}\n")

    for filename, field in TARGET_FILES:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"  !! {filename}: ファイルが見つかりません")
            issues += 1
            continue

        with open(filepath, encoding="utf-8") as f:
            data = json.load(f)

        raw, dt = parse_date_field(data, field)
        if dt is None:
            print(f"  !! {filename}: 日付フィールド取得失敗 ({field}={raw!r})")
            issues += 1
            continue

        days_ago = (today - dt).days
        # 90日以上で警告
        if days_ago > 90:
            icon = "!!"
            issues += 1
        elif days_ago > 60:
            icon = "⚠️"
        else:
            icon = "✅"

        print(f"  {icon} {filename}: {raw}（{days_ago}日前）")

    # pending_downloads チェック
    print()
    if SOURCES_PATH.exists():
        with open(SOURCES_PATH, encoding="utf-8") as f:
            sources = json.load(f)

        pending = sources.get("pending_downloads", {})
        if pending:
            print(f"⚠️ 未ダウンロード: {len(pending)}件")
            for name, url in pending.items():
                print(f"  - {name}")
                print(f"    {url}")
        else:
            print("✅ 未ダウンロードファイルなし")
    else:
        print("⚠️ sources.json が見つかりません")

    print()
    return 1 if issues > 0 else 0


if __name__ == "__main__":
    sys.exit(check_freshness())
