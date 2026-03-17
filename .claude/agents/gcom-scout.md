---
name: gcom-scout
description: |
  GcomホールディングスのAcrocity導入自治体を収集するAgent。
  Acrocityの導入自治体を231件→300件に拡充する。（現在最多ベンダー）
  Triggerキーワード: "Gcomスカウト", "Acrocity収集", "pkg74拡充", "Gcom導入拡充"
model: sonnet
---

# Gcom Acrocity Scout Agent

## ミッション

Gcomホールディングス製 Acrocity の導入自治体を収集し、
`municipality_packages` テーブルの Acrocity レコードを **231件 → 300件** に拡充する。
現在 **最多収集数（231件）** のベンダー。

## 対象パッケージ

| pkg_id | パッケージ名 | 業務 |
|--------|-------------|------|
| 74 | Acrocity | 住民記録・税務・福祉等（多業務統合） |

## Gcom/Acrocityの特徴

- **大翔社（daishou.co.jp）** が東北・北海道の公式 reseller
- 西日本はGcom直販が多い
- セキュリティインシデント記録（piyolog等）にシステム名が掲載されることがある
- 中規模以上の市に強い傾向

## データソース優先順位

1. **大翔社 導入実績ページ**（最高精度 = `high`）
   - `https://www.daishou.co.jp/record01/` — 東北・北海道の実績リスト
   - `"Acrocity" site:daishou.co.jp`

2. **個人情報ファイル簿**（精度 = `high`）
   - `"Acrocity" 個人情報ファイル簿 site:*.lg.jp`
   - `"Acrocity" 住民記録 site:*.lg.jp`

3. **Gcom公式サイト**（精度 = `high`）
   - `"Acrocity" site:gcom.co.jp`
   - `Gcom Acrocity 導入事例 site:gcom.co.jp`

4. **セキュリティインシデント記録**（精度 = `medium`）
   - `site:piyolog.hatenadiary.jp Acrocity` — インシデント報告にシステム名あり
   - `"Acrocity" 情報漏洩 自治体 site:*.lg.jp`

5. **入札情報DB**（精度 = `medium`）
   - `https://www2.njss.info/` で「Acrocity」検索
   - `"Acrocity" 保守 入札 落札`

## 検索クエリテンプレート

```
# 大翔社（東北・北海道の reseller、最優先）
"Acrocity" site:daishou.co.jp
大翔社 Acrocity 導入自治体
"Acrocity" "東北" OR "北海道" 大翔社

# 個人情報ファイル簿
"Acrocity" "個人情報ファイル簿" site:*.lg.jp
"Acrocity" "住民基本台帳" site:*.lg.jp

# Gcom公式
"Acrocity" site:gcom.co.jp 自治体 導入事例
Gcom Acrocity 市 区 町 村

# セキュリティインシデント経由（有効な傍証）
site:piyolog.hatenadiary.jp "Acrocity"
"Acrocity" 不正アクセス OR 情報漏洩 自治体

# 地域絞り込み（未探索エリア優先）
"Acrocity" "北海道" 導入 自治体
"Acrocity" "青森県" 導入
"Acrocity" "岩手県" 導入
"Acrocity" "宮城県" 導入
"Acrocity" "山形県" 導入
"Acrocity" "福島県" 導入
"Acrocity" "関西" OR "大阪" OR "兵庫" 導入

# 入札
"Acrocity" njss 落札 自治体
```

## 未探索エリア（優先度高）

| 優先度 | エリア | アプローチ |
|--------|--------|-----------|
| 最高 | 東北6県（大翔社担当） | daishou.co.jp の実績リスト直接確認 |
| 高 | 北海道（大翔社担当） | 同上 |
| 高 | 関西（大阪・兵庫・京都） | Gcom直販エリア、個人情報ファイル簿検索 |
| 中 | 中国・四国 | 個人情報ファイル簿検索 |
| 中 | 九州北部（福岡・佐賀・大分） | 個人情報ファイル簿検索 |

## Confidence 判定

| 根拠 | confidence |
|------|-----------|
| daishou.co.jp 導入実績ページに記載 | `high` |
| 自治体公式サイトの個人情報ファイル簿 | `high` |
| Gcom公式ケーススタディ | `high` |
| njss.info 落札情報（Acrocity明記） | `medium` |
| piyolog等セキュリティインシデント記録 | `medium` |
| ニュース記事・プレスリリース | `likely` |

## DB挿入コード

```python
import urllib.request
import urllib.parse
import json

BASE = 'https://msbwmfggvtyexvhmlifn.supabase.co/rest/v1'
KEY  = '***REDACTED_SUPABASE_ANON***'
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

PKG_ID = 74  # Acrocity（Gcomホールディングス）

candidates = [
    # (都道府県, 市区町村, confidence, source_url, note)
    # 例:
    # ('宮城県', '石巻市', 'high', 'https://www.daishou.co.jp/record01/', '大翔社導入実績'),
    # ('大阪府', '東大阪市', 'high', 'https://www.city.higashiosaka.lg.jp/...', 'Acrocity個人情報ファイル簿'),
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

1. `https://www.daishou.co.jp/record01/` を WebFetch で取得し、東北・北海道の全実績を確認（最優先）
2. Gcom公式サイト（gcom.co.jp）の事例ページを確認
3. 個人情報ファイル簿検索で関西・中国地方を調査
4. piyolog.hatenadiary.jp で「Acrocity」インシデント記録を確認（傍証）
5. njss.info で「Acrocity」入札情報を検索
6. 発見した自治体を candidates に追加し、Pythonコード実行
7. 結果報告

## 現状サマリー

- 現在: 231件（全ベンダー中最多）
- 目標: 300件
- 必要追加数: 約69件
- 最有望エリア: 東北6県（大翔社担当の大量実績）・関西（直販エリア）
