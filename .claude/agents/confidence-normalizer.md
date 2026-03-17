---
name: confidence-normalizer
description: |
  municipality_packages テーブルの confidence フィールドを正規化するAgent。
  数値型（0.75/0.8/0.85/0.9）を文字列型（high/medium/likely）に一括変換する。
  Triggerキーワード: "confidence正規化", "データクレンジング", "confidence修正", "confidence変換"
model: sonnet
---

# Confidence Normalizer Agent

## ミッション

`municipality_packages` テーブルの `confidence` フィールドに混入している数値型の値を、
正しい文字列型（`confirmed` / `high` / `medium` / `likely`）に一括変換する。

## 問題の詳細

現在のテーブルに以下の不正な数値型 confidence が混在している:

| 現在の値（数値） | 件数 | 変換後の値 |
|----------------|------|-----------|
| `0.9` | 7件 | `"high"` |
| `0.85` | 11件 | `"high"` |
| `0.8` | 12件 | `"medium"` |
| `0.75` | 1件 | `"medium"` |
| **合計** | **31件** | — |

正しい confidence 値: `confirmed` / `high` / `medium` / `likely` のみ

## 変換ルール

```
0.9  → "high"
0.85 → "high"
0.8  → "medium"
0.75 → "medium"
```

## 実行コード

```python
import urllib.request
import urllib.parse
import json

BASE = 'https://msbwmfggvtyexvhmlifn.supabase.co/rest/v1'
KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYndtZmdndnR5ZXh2aG1saWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDcwNDYsImV4cCI6MjA4OTI4MzA0Nn0.xIdchE4aRetrzCeWRvkcW0-p-asDz7fU-McLeQHjKIg'
HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'  # 更新後のレコードを返す
}

def api(method, path, data=None, params=None):
    url = BASE + path
    if params:
        url += '?' + urllib.parse.urlencode(params)
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else []
    except urllib.error.HTTPError as e:
        print(f'HTTP {e.code}: {e.read().decode()}')
        return None

def fetch_numeric_confidence():
    """数値型 confidence の全レコードを取得"""
    # Supabase では数値フィルタを文字列で渡す
    # confidence が 0.9, 0.85, 0.8, 0.75 のレコードを取得
    all_records = []
    for val in ['0.9', '0.85', '0.8', '0.75']:
        rows = api('GET', '/municipality_packages', params={
            'confidence': f'eq.{val}',
            'select': 'id,confidence,municipality_id,package_id'
        })
        if rows:
            all_records.extend(rows)
    return all_records

def patch_confidence(record_id: int, new_value: str) -> bool:
    """単一レコードの confidence を更新"""
    result = api('PATCH', '/municipality_packages',
                 data={'confidence': new_value},
                 params={'id': f'eq.{record_id}'})
    return result is not None

# 変換マッピング
CONVERSION = {
    '0.9': 'high',
    '0.85': 'high',
    '0.8': 'medium',
    '0.75': 'medium',
    # float型として取得された場合のフォールバック
    0.9: 'high',
    0.85: 'high',
    0.8: 'medium',
    0.75: 'medium',
}

# ---- Step 1: 対象レコードを取得 ----
print("Step 1: 数値型 confidence レコードを検索中...")
records = fetch_numeric_confidence()

if not records:
    print("数値型 confidence のレコードは見つかりませんでした。")
else:
    print(f"対象レコード: {len(records)}件")
    for r in records:
        print(f"  id={r['id']}, confidence={r['confidence']}, "
              f"municipality_id={r['municipality_id']}, package_id={r['package_id']}")

    # ---- Step 2: 変換実行 ----
    print("\nStep 2: confidence を変換中...")
    results = {'success': 0, 'error': 0, 'unknown': 0}

    for r in records:
        conf_val = r['confidence']
        new_val = CONVERSION.get(str(conf_val)) or CONVERSION.get(float(conf_val) if isinstance(conf_val, str) else conf_val)

        if new_val is None:
            print(f"  UNKNOWN: id={r['id']}, confidence={conf_val} → 変換ルールなし")
            results['unknown'] += 1
            continue

        ok = patch_confidence(r['id'], new_val)
        if ok:
            print(f"  UPDATE: id={r['id']}, {conf_val} → {new_val}")
            results['success'] += 1
        else:
            print(f"  ERROR: id={r['id']}")
            results['error'] += 1

    print(f"\n完了: 成功{results['success']}件 / ERROR{results['error']}件 / UNKNOWN{results['unknown']}件")

    # ---- Step 3: 検証 ----
    print("\nStep 3: 変換後の確認...")
    remaining = fetch_numeric_confidence()
    if not remaining:
        print("数値型 confidence は0件 — 正規化完了")
    else:
        print(f"警告: まだ{len(remaining)}件の数値型 confidence が残っています")
        for r in remaining:
            print(f"  id={r['id']}, confidence={r['confidence']}")
```

## 実行手順

1. 上記 Python コードをそのまま実行（Bash ツールで `python3 -c "..."` または一時ファイル経由）
2. Step 1 で対象レコード一覧を確認
3. Step 2 で一括 PATCH 更新
4. Step 3 で数値型 confidence がゼロになったことを確認
5. 結果報告

## 実行後の確認クエリ

```bash
# 変換後の confidence 分布を確認
curl -s "https://msbwmfggvtyexvhmlifn.supabase.co/rest/v1/municipality_packages?select=confidence&apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYndtZmdndnR5ZXh2aG1saWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDcwNDYsImV4cCI6MjA4OTI4MzA0Nn0.xIdchE4aRetrzCeWRvkcW0-p-asDz7fU-McLeQHjKIg" | python3 -c "
import sys, json
from collections import Counter
data = json.load(sys.stdin)
counts = Counter(r['confidence'] for r in data)
for k, v in sorted(counts.items()):
    print(f'{k}: {v}件')
print(f'合計: {len(data)}件')
"
```

## 注意事項

- `Prefer: return=representation` ヘッダーで更新後の値を確認できる
- Step 3 の検証で残件がある場合は、Supabase ダッシュボードで直接確認すること
- このAgentは `municipality_packages` テーブルのみを変更する
- 他テーブル（`municipalities` 等）への変更は一切行わない
