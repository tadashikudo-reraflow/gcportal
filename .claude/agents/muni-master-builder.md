---
name: muni-master-builder
description: |
  municipalities テーブルに欠損している都道府県の自治体マスタを補完するAgent。
  現在23都道府県（1,741件）を全47都道府県（約3,300自治体）に拡張する。
  Triggerキーワード: "自治体マスタ補完", "municipalities追加", "47都道府県化", "muni-master構築"
model: sonnet
---

# 自治体マスタ補完 Agent (muni-master-builder)

## ミッション

`municipalities` テーブルに未登録の都道府県・自治体を追加し、
**23都道府県（1,741件）→ 全47都道府県（約3,300自治体）** に拡充する。

## 現状と目標

| 項目 | 現状 | 目標 |
|------|------|------|
| 登録都道府県数 | 23都道府県 | 47都道府県（全国） |
| 登録自治体数 | 1,741件 | 約3,300件 |
| 欠損推定 | 約1,559件 | 0件 |

## 未登録都道府県（推定）

以下の都道府県が未登録または一部欠損している可能性が高い:

```
神奈川県、大阪府、愛知県、静岡県、広島県、福岡県、兵庫県、京都府、
千葉県（一部）、埼玉県（一部）、奈良県、三重県、岡山県、栃木県、
群馬県、富山県、石川県、福井県、山梨県、長崎県（一部）、沖縄県 等
```

## データソース

### 主要ソース（優先順）

1. **総務省 市区町村コード一覧**（最高精度）
   - `https://www.soumu.go.jp/denshijiti/code.html`
   - 団体コード（6桁）一覧のExcel/CSVをダウンロード
   - `pref_city_code`（5桁、先頭チェックディジット除去）を同時取得

2. **デジタル庁 標準化対象自治体リスト**
   - `https://www.digital.go.jp/policies/local_governments/`
   - 標準化スケジュール付きリスト（自治体名・団体コードあり）

3. **総務省 全国都道府県市区町村別面積調**
   - 自治体の人口・面積データ → `size_category` 判定の補助

## `municipalities` テーブル スキーマ

```sql
id               SERIAL PRIMARY KEY
pref_name        TEXT    -- 都道府県名（例: 東京都）
city_name        TEXT    -- 市区町村名（例: 千代田区）
pref_city_code   TEXT    -- 5桁団体コード（チェックディジット除く）
size_category    TEXT    -- 政令市 / 中核市 / 市 / 町 / 村
population       INTEGER -- 人口（任意）
```

## size_category 判定ロジック

```python
def classify_size(city_name: str, population: int = 0) -> str:
    """
    自治体規模を分類する。
    政令指定都市: 人口50万以上 or 法定リストに含まれる
    中核市: 人口20万以上 or 中核市指定リスト
    市: 「市」で終わる
    町: 「町」で終わる
    村: 「村」で終わる
    区: 東京23区は「市」扱いが一般的だが区として分類
    """
    # 政令指定都市リスト（2024年現在 20市）
    SEIREI = {
        '札幌市', '仙台市', 'さいたま市', '千葉市', '横浜市', '川崎市',
        '相模原市', '新潟市', '静岡市', '浜松市', '名古屋市', '京都市',
        '大阪市', '堺市', '神戸市', '岡山市', '広島市', '北九州市',
        '福岡市', '熊本市'
    }
    # 中核市リスト（2024年現在 62市）— 主要なもの
    CHUKAKU = {
        '旭川市', '青森市', '盛岡市', '秋田市', '山形市', '郡山市', '水戸市',
        '宇都宮市', '前橋市', '高崎市', '川越市', '越谷市', '船橋市', '柏市',
        '八王子市', '横須賀市', '富山市', '金沢市', '長野市', '松本市',
        '岐阜市', '豊橋市', '豊田市', '岡崎市', '高槻市', '東大阪市',
        '尼崎市', '姫路市', '西宮市', '奈良市', '和歌山市', '倉敷市',
        '福山市', '下関市', '高松市', '松山市', '高知市', '久留米市',
        '長崎市', '大分市', '宮崎市', '鹿児島市', '那覇市'
    }

    if city_name in SEIREI:
        return '政令市'
    elif city_name in CHUKAKU:
        return '中核市'
    elif city_name.endswith('市') or city_name.endswith('区'):
        return '市'
    elif city_name.endswith('町'):
        return '町'
    elif city_name.endswith('村'):
        return '村'
    else:
        return '市'  # デフォルト
```

## 実装コード

```python
import urllib.request
import urllib.parse
import json
import csv
import io

BASE = 'https://msbwmfggvtyexvhmlifn.supabase.co/rest/v1'
KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYndtZmdndnR5ZXh2aG1saWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDcwNDYsImV4cCI6MjA4OTI4MzA0Nn0.xIdchE4aRetrzCeWRvkcW0-p-asDz7fU-McLeQHjKIg'
HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
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
            return json.loads(raw) if raw else True
    except urllib.error.HTTPError as e:
        print(f'HTTP {e.code}: {e.read().decode()}')
        return None

def exists_muni(pref, city):
    """自治体の既存チェック"""
    rows = api('GET', '/municipalities', params={
        'pref_name': f'eq.{pref}',
        'city_name': f'eq.{city}',
        'select': 'id'
    })
    return bool(rows)

def get_registered_prefs():
    """登録済み都道府県の一覧を取得"""
    rows = api('GET', '/municipalities', params={
        'select': 'pref_name',
        'limit': '2000'
    })
    if not rows:
        return set()
    return set(r['pref_name'] for r in rows)

def insert_muni(pref, city, code5, size_cat):
    """自治体マスタに1件追加"""
    return api('POST', '/municipalities', data={
        'pref_name': pref,
        'city_name': city,
        'pref_city_code': code5,
        'size_category': size_cat
    })

def classify_size(city_name):
    SEIREI = {
        '札幌市', '仙台市', 'さいたま市', '千葉市', '横浜市', '川崎市',
        '相模原市', '新潟市', '静岡市', '浜松市', '名古屋市', '京都市',
        '大阪市', '堺市', '神戸市', '岡山市', '広島市', '北九州市',
        '福岡市', '熊本市'
    }
    CHUKAKU = {
        '旭川市', '青森市', '盛岡市', '秋田市', '山形市', '郡山市', '水戸市',
        '宇都宮市', '前橋市', '高崎市', '川越市', '越谷市', '船橋市', '柏市',
        '八王子市', '横須賀市', '富山市', '金沢市', '長野市', '松本市',
        '岐阜市', '豊橋市', '豊田市', '岡崎市', '高槻市', '東大阪市',
        '尼崎市', '姫路市', '西宮市', '奈良市', '和歌山市', '倉敷市',
        '福山市', '下関市', '高松市', '松山市', '高知市', '久留米市',
        '長崎市', '大分市', '宮崎市', '鹿児島市', '那覇市'
    }
    if city_name in SEIREI:
        return '政令市'
    if city_name in CHUKAKU:
        return '中核市'
    if city_name.endswith('市') or city_name.endswith('区'):
        return '市'
    if city_name.endswith('町'):
        return '町'
    if city_name.endswith('村'):
        return '村'
    return '市'

# ---- 実行 ----
# Step 1: 登録済み都道府県を確認
print("登録済み都道府県:")
prefs = get_registered_prefs()
for p in sorted(prefs):
    print(f"  {p}")
print(f"  合計: {len(prefs)}都道府県\n")

# Step 2: 追加対象の自治体リストを定義
# 総務省データを元に手動で構築 or parse_soumu.py で自動生成
# 形式: (都道府県名, 市区町村名, 5桁団体コード)
new_municipalities = [
    # 例（神奈川県の一部）:
    # ('神奈川県', '横浜市', '14100'),
    # ('神奈川県', '川崎市', '14130'),
    # ('神奈川県', '相模原市', '14150'),
    # ... 未登録都道府県の全自治体を追加
]

# Step 3: 重複チェックしながら挿入
results = {'insert': 0, 'skip': 0, 'error': 0}
for pref, city, code5 in new_municipalities:
    if exists_muni(pref, city):
        results['skip'] += 1
        continue
    size = classify_size(city)
    ok = insert_muni(pref, city, code5, size)
    if ok:
        results['insert'] += 1
        print(f'  INSERT: {pref} {city} ({code5}) [{size}]')
    else:
        results['error'] += 1
        print(f'  ERROR: {pref} {city}')

print(f"\n完了: 挿入{results['insert']}件 / SKIP{results['skip']}件 / ERROR{results['error']}件")
```

## 実行手順

1. 総務省サイト（`https://www.soumu.go.jp/denshijiti/code.html`）から団体コード一覧を取得
2. 登録済み都道府県を `get_registered_prefs()` で確認
3. 未登録都道府県の自治体リストを `new_municipalities` に追加
4. Pythonコードを実行し、重複チェック込みで一括挿入
5. 結果報告

## parse_soumu.py について

既存の `parse_soumu.py`（プロジェクト内）を以下の点で拡張することを推奨:
- 47都道府県全データのパース対応
- `pref_city_code`（5桁）の自動抽出
- `size_category` 自動判定ロジックの組み込み
- 実行後に `municipality_packages` テーブルの既存レコードと突合し、マスタ欠損による `mid not found` エラーを解消

## 注意事項

- `municipalities` テーブルは **読み取り専用参照** が基本。このAgentのみ書き込み可
- 追加後は各スカウトAgentの `get_mid()` が正常動作するか確認
- 政令市（20市）・中核市（62市）の `size_category` 分類は必ず正確に設定すること
- 同一都道府県の全自治体を一括処理する場合は **都道府県単位で分割実行** を推奨（API負荷軽減）
