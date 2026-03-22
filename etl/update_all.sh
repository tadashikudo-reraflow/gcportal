#!/bin/bash
# GCInsight データ更新パイプライン
# Usage: bash etl/update_all.sh (from gcportal/ root)
#        or: cd etl && bash update_all.sh
set -e

cd "$(dirname "$0")"

echo "=== GCInsight データ更新パイプライン ==="
echo "実行日時: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "=== Step 1: Parse soumu data ==="
python parse_soumu.py
python parse_new_soumu.py

echo ""
echo "=== Step 2: Parse tokutei data ==="
python parse_tokutei.py

echo ""
echo "=== Step 3: Validate integrity ==="
python validate_data_integrity.py

echo ""
echo "=== Step 4: Check freshness ==="
python check_data_freshness.py

echo ""
echo "=== Done ==="
