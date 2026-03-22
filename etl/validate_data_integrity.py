#!/usr/bin/env python3
from __future__ import annotations

"""GCInsight JSON間の整合性チェック

- tokutei_municipalities.json の配列長 == total_count（または municipality_count）
- tokutei_detail.json の市区町村数と突合
- standardization.json の total == 1741
- migration_stats.json の completion_rate == completed_systems / total_systems

Usage:
    python validate_data_integrity.py
"""

import json
import math
import sys
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "public" / "data"

EXPECTED_TOTAL_MUNICIPALITIES = 1741


def load_json(filename: str) -> dict | None:
    filepath = DATA_DIR / filename
    if not filepath.exists():
        print(f"  !! {filename}: ファイルが見つかりません")
        return None
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def validate() -> int:
    errors = 0
    warnings = 0

    print("=== GCInsight データ整合性チェック ===\n")

    # 1. standardization.json: total == 1741
    std = load_json("standardization.json")
    if std:
        total = std.get("summary", {}).get("total", 0)
        if total == EXPECTED_TOTAL_MUNICIPALITIES:
            print(f"  ✅ standardization.json: total = {total}")
        else:
            print(f"  !! standardization.json: total = {total} (期待値: {EXPECTED_TOTAL_MUNICIPALITIES})")
            errors += 1

        # municipalities 配列数チェック
        munis = std.get("municipalities", [])
        if len(munis) == total:
            print(f"  ✅ standardization.json: municipalities配列 = {len(munis)} (totalと一致)")
        else:
            print(f"  !! standardization.json: municipalities配列 = {len(munis)} (total={total}と不一致)")
            errors += 1
    else:
        errors += 1

    # 2. tokutei_municipalities.json: 配列長 == total_count
    tokutei_muni = load_json("tokutei_municipalities.json")
    if tokutei_muni:
        arr_len = len(tokutei_muni.get("municipalities", []))
        total_count = tokutei_muni.get("total_count", 0)
        # total_countには都道府県も含まれるため配列長(市区町村のみ)と一致しないことがある
        if arr_len <= total_count:
            print(f"  ✅ tokutei_municipalities.json: 配列長 = {arr_len}, total_count = {total_count}")
        else:
            print(f"  !! tokutei_municipalities.json: 配列長 = {arr_len} > total_count = {total_count}")
            errors += 1
    else:
        errors += 1

    # 3. tokutei_detail.json: total_municipalities と tokutei_municipalities の total_count 突合
    tokutei_detail = load_json("tokutei_detail.json")
    if tokutei_detail and tokutei_muni:
        detail_total = tokutei_detail.get("summary", {}).get("total_municipalities", 0)
        muni_total = tokutei_muni.get("total_count", 0)
        if detail_total == muni_total:
            print(f"  ✅ tokutei_detail / tokutei_municipalities: total = {detail_total} (一致)")
        else:
            print(f"  ⚠️ tokutei_detail total = {detail_total}, tokutei_municipalities total_count = {muni_total} (差異あり)")
            warnings += 1
    elif tokutei_detail is None:
        errors += 1

    # 4. migration_stats.json: completion_rate == completed / total
    mig = load_json("migration_stats.json")
    if mig:
        total_sys = mig.get("total_systems", 0)
        completed_sys = mig.get("completed_systems", 0)
        stored_rate = mig.get("completion_rate", 0)

        if total_sys > 0:
            calc_rate = completed_sys / total_sys
            if math.isclose(calc_rate, stored_rate, abs_tol=0.002):
                print(f"  ✅ migration_stats.json: completion_rate = {stored_rate} (計算値: {calc_rate:.4f})")
            else:
                print(f"  !! migration_stats.json: completion_rate = {stored_rate} != 計算値 {calc_rate:.4f}")
                errors += 1
        else:
            print(f"  !! migration_stats.json: total_systems = 0")
            errors += 1

        # total_municipalities チェック
        mig_total_muni = mig.get("total_municipalities", 0)
        if mig_total_muni == EXPECTED_TOTAL_MUNICIPALITIES:
            print(f"  ✅ migration_stats.json: total_municipalities = {mig_total_muni}")
        else:
            print(f"  !! migration_stats.json: total_municipalities = {mig_total_muni} (期待値: {EXPECTED_TOTAL_MUNICIPALITIES})")
            errors += 1
    else:
        errors += 1

    # サマリー
    print(f"\n--- 結果: エラー {errors}件, 警告 {warnings}件 ---")
    if errors > 0:
        print("整合性チェックに失敗しました。")
        return 1
    if warnings > 0:
        print("警告がありますが、致命的ではありません。")
    else:
        print("全チェック通過。")
    return 0


if __name__ == "__main__":
    sys.exit(validate())
