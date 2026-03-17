---
name: rkkcs-scout
description: |
  株式会社RKKCS（RKKコンピューターサービス）の総合行政システム導入自治体を収集するAgent。
  導入自治体を42件→80件に拡充する。鹿児島・宮崎・熊本の九州南部に集中。
  Triggerキーワード: "RKKCSスカウト", "総合行政システム収集", "pkg210拡充", "RKKCS導入拡充"
model: sonnet
---

# RKKCS 総合行政システム Scout Agent

## ミッション

株式会社RKKCS（RKKコンピューターサービス）製「総合行政システム」の導入自治体を収集し、
`municipality_packages` テーブルのレコードを **42件 → 80件** に拡充する。

## 対象パッケージ

| pkg_id | パッケージ名 | 業務 |
|--------|-------------|------|
| 210 | 総合行政システム | 住民記録 |

## RKKCSの特徴

- **九州南部（鹿児島・宮崎）に集中** — RKK（九州のローカル放送局・RKK熊本放送）のIT子会社
- 鹿児島県内の **ほぼ全自治体** がターゲット（43市町村）
- 小中規模自治体に特化
- kagojob.jp（鹿児島求人サイト）経由の情報が過去に有効

## データソース優先順位

1. **kagojob.jp（鹿児島求人サイト）**（精度 = `medium`〜`high`）
   - `https://www.kagojob.jp/` でRKKCS求人を確認
   - 求人に担当自治体・顧客先エリアが記載されることがある

2. **個人情報ファイル簿**（精度 = `high`）
   - `"RKKCS" 個人情報ファイル簿 site:*.lg.jp`
   - `"RKKコンピュータ" 個人情報ファイル簿 site:*.lg.jp`
   - `"総合行政システム" RKKCS site:*.lg.jp`

3. **鹿児島県内自治体の公式サイト直接確認**（精度 = `high`）
   - 鹿児島県43市町村の調達情報・個人情報ファイル簿を順次確認
   - `site:*.kagoshima.lg.jp RKKCS OR "総合行政システム"`

4. **宮崎・熊本の自治体確認**（精度 = `medium`〜`high`）
   - `"RKKCS" site:*.miyazaki.lg.jp`
   - `"RKKCS" site:*.kumamoto.lg.jp`

5. **RKKCS公式サイト**（精度 = `high`）
   - `site:rkkcs.co.jp 導入事例 OR 実績`

## 検索クエリテンプレート

```
# 個人情報ファイル簿（高精度）
"RKKCS" "個人情報ファイル簿" site:*.lg.jp
"RKKコンピュータ" "個人情報ファイル簿" site:*.lg.jp
"総合行政システム" "RKKCS" site:*.lg.jp

# 鹿児島県内（最重要エリア）
"RKKCS" site:*.kagoshima.lg.jp
"RKKCS" "住民記録" 鹿児島 自治体
RKKCS 鹿児島市 OR 薩摩川内市 OR 霧島市 OR 鹿屋市 OR 指宿市
RKKCS 鹿児島 町 村 導入

# 宮崎・熊本
"RKKCS" site:*.miyazaki.lg.jp
"RKKCS" "宮崎県" 自治体 導入
"RKKCS" site:*.kumamoto.lg.jp

# 求人情報（鹿児島特化）
RKKCS 求人 鹿児島 自治体 担当
kagojob RKKCS 顧客先

# RKKCS公式
site:rkkcs.co.jp 導入事例
RKKCS 総合行政システム 自治体 一覧
```

## 鹿児島県全43市町村リスト（探索対象）

```
【市（19市）】
鹿児島市、鹿屋市、枕崎市、阿久根市、出水市、指宿市、西之表市、垂水市、薩摩川内市、
日置市、曽於市、霧島市、いちき串木野市、南さつま市、志布志市、奄美市、南九州市、伊佐市、姶良市

【郡部（24町村）】
三島村、十島村、さつま町、長島町、湧水町、大崎町、東串良町、錦江町、南大隅町、肝付町、
中種子町、南種子町、屋久島町、大和村、宇検村、瀬戸内町、龍郷町、喜界町、徳之島町、天城町、
伊仙町、和泊町、知名町、与論町
```

## Confidence 判定

| 根拠 | confidence |
|------|-----------|
| 自治体公式サイトの個人情報ファイル簿（RKKCS明記） | `high` |
| RKKCS公式ケーススタディ | `high` |
| njss.info 落札情報（システム名明記） | `medium` |
| kagojob求人の担当エリア記載 | `medium` |
| 九州南部の近隣自治体から傍証 | `likely` |

## DB挿入コード

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

def get_mid(pref, city):
    rows = api('GET', '/municipalities', params={
        'pref_name': f'eq.{pref}', 'city_name': f'eq.{city}', 'select': 'id'
    })
    return rows[0]['id'] if rows else None

def exists(mid, pkg_id):
    rows = api('GET', '/municipality_packages', params={
        'municipality_id': f'eq.{mid}', 'package_id': f'eq.{pkg_id}', 'select': 'id'
    })
    return bool(rows)

def insert(mid, pkg_id, confidence, source, note=''):
    return api('POST', '/municipality_packages', data={
        'municipality_id': mid, 'package_id': pkg_id,
        'confidence': confidence, 'source': source, 'note': note
    })

PKG_ID = 210  # 総合行政システム（RKKCS）

# 鹿児島県の全市町村を探索対象に
KAGOSHIMA_CITIES = [
    '鹿児島市', '鹿屋市', '枕崎市', '阿久根市', '出水市', '指宿市',
    '西之表市', '垂水市', '薩摩川内市', '日置市', '曽於市', '霧島市',
    'いちき串木野市', '南さつま市', '志布志市', '奄美市', '南九州市', '伊佐市', '姶良市',
    'さつま町', '長島町', '湧水町', '大崎町', '東串良町', '錦江町',
    '南大隅町', '肝付町', '中種子町', '南種子町', '屋久島町', '大和村',
    '宇検村', '瀬戸内町', '龍郷町', '喜界町', '徳之島町', '天城町',
    '伊仙町', '和泊町', '知名町', '与論町'
]

candidates = [
    # (都道府県, 市区町村, confidence, source_url, note)
    # 検索結果をここに追加
    # 例:
    # ('鹿児島県', '薩摩川内市', 'high', 'https://www.city.satsumasendai.lg.jp/...', 'RKKCS個人情報ファイル簿'),
    # ('宮崎県', '都城市', 'medium', 'https://www2.njss.info/...', 'RKKCS保守入札'),
]

results = {'insert': 0, 'skip': 0, 'error': 0}
for pref, city, conf, src, note in candidates:
    mid = get_mid(pref, city)
    if mid is None:
        print(f'MID not found: {pref} {city}')
        results['error'] += 1
        continue
    if exists(mid, PKG_ID):
        results['skip'] += 1
        continue
    ok = insert(mid, PKG_ID, conf, src, note)
    if ok:
        results['insert'] += 1
        print(f'  INSERT: {pref} {city}')
    else:
        results['error'] += 1

print(f"\n完了: 挿入{results['insert']}件 / SKIP{results['skip']}件 / ERROR{results['error']}件")
```

## 実行手順

1. 鹿児島県全43市町村リストと現在のDB収集済みを突合
2. 未収集の鹿児島県自治体を個人情報ファイル簿で確認（`site:*.kagoshima.lg.jp RKKCS`）
3. kagojob.jp で RKKCS 求人を確認（担当エリア情報）
4. 宮崎県・熊本県の自治体も調査
5. RKKCS公式サイト（rkkcs.co.jp）の導入事例確認
6. 発見した自治体を candidates に追加し、Pythonコード実行
7. 結果報告

## 現状サマリー

- 現在: 42件
- 目標: 80件
- 必要追加数: 約38件
- 最有望エリア: 鹿児島県（43市町村中まだ多数未収集の可能性）・宮崎県
