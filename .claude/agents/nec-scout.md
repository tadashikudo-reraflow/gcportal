---
name: nec-scout
description: |
  日本電気株式会社（NEC）のADWORLD導入自治体を収集するAgent。
  ADWORLDの導入自治体を115件→180件に拡充する。
  Triggerキーワード: "NECスカウト", "ADWORLD収集", "pkg95拡充", "NEC導入拡充"
model: sonnet
---

# NEC ADWORLD Scout Agent

## ミッション

日本電気株式会社（NEC）製 ADWORLD の導入自治体を収集し、
`municipality_packages` テーブルの ADWORLD レコードを **115件 → 180件** に拡充する。

## 対象パッケージ

| pkg_id | パッケージ名 | 業務 |
|--------|-------------|------|
| 95 | ADWORLD | 住民記録・税務・福祉等（多業務統合） |

## ADWORLDの特徴

- **OCI（Oracle Cloud Infrastructure）使用** が特徴 — 他ベンダーと差別化できる検索クエリ
- 神奈川・埼玉・千葉の **大規模自治体（政令市・中核市）** に多い
- NECは自治体向けのITインフラ案件も多く、ADWORLDとの複合受注パターンあり
- 関東圏に集中している傾向

## データソース優先順位

1. **入札情報DB**（精度 = `medium`〜`high`）
   - `https://www2.njss.info/` で「ADWORLD」検索 — 過去に有効実績あり
   - `"ADWORLD" 落札 保守`

2. **個人情報ファイル簿**（精度 = `high`）
   - `"ADWORLD" 個人情報ファイル簿 site:*.lg.jp`
   - `"ADWORLD" 住民記録 site:*.lg.jp`

3. **NEC公式サイト**（精度 = `high`）
   - `"ADWORLD" site:nec.com`
   - `NEC ADWORLD 自治体 導入事例`

4. **OCI（Oracle Cloud）相関検索**（精度 = `medium`）
   - `"ADWORLD" "Oracle Cloud" 自治体`
   - `NEC OCI 自治体DX ADWORLD`
   - `"ADWORLD" "Oracle" 神奈川 OR 埼玉 OR 千葉`

5. **総務省/デジタル庁資料**（精度 = `medium`）
   - `"ADWORLD" site:digital.go.jp`
   - `"ADWORLD" site:soumu.go.jp`

## 検索クエリテンプレート

```
# 入札情報（ADWORLDは入札検索が有効）
"ADWORLD" njss 落札 自治体
"ADWORLD" 保守 入札 神奈川 OR 埼玉 OR 千葉

# 個人情報ファイル簿
"ADWORLD" "個人情報ファイル簿" site:*.lg.jp
"ADWORLD" "住民基本台帳" site:*.lg.jp

# OCI相関（NECの特徴的な技術スタック）
"ADWORLD" "Oracle Cloud Infrastructure" 自治体
NEC ADWORLD OCI 導入 自治体

# NEC公式
"ADWORLD" site:nec.com 事例
NEC ADWORLD 市 自治体 住民記録

# 地域絞り込み
"ADWORLD" "神奈川県" 導入 自治体
"ADWORLD" "埼玉県" 導入
"ADWORLD" "千葉県" 導入
"ADWORLD" "東京都" 区 導入
"ADWORLD" "愛知県" 名古屋 導入
"ADWORLD" "大阪府" 導入
```

## 優先探索エリア

| 優先度 | 都道府県/エリア | 理由 |
|--------|---------------|------|
| 最高 | 神奈川県 | 大規模自治体多、ADWORLD集中エリア |
| 最高 | 埼玉県 | 同上 |
| 最高 | 千葉県 | 同上 |
| 高 | 東京都 | 区部・多摩地区 |
| 高 | 愛知県 | 名古屋市・政令指定都市 |
| 高 | 大阪府 | 大阪市・堺市等 |
| 中 | 福岡県 | 福岡市・北九州市等 |
| 中 | 宮城県 | 仙台市等 |

## Confidence 判定

| 根拠 | confidence |
|------|-----------|
| 自治体公式サイトの個人情報ファイル簿 | `high` |
| NEC公式ケーススタディ（nec.com掲載） | `high` |
| njss.info 落札情報（ADWORLD明記） | `medium` |
| OCI導入事例との相関（公式文書） | `medium` |
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

PKG_ID = 95  # ADWORLD（NEC）

candidates = [
    # (都道府県, 市区町村, confidence, source_url, note)
    # 例:
    # ('神奈川県', '相模原市', 'high', 'https://www.city.sagamihara.kanagawa.jp/...', 'ADWORLD個人情報ファイル簿'),
    # ('埼玉県', '川越市', 'medium', 'https://www2.njss.info/...', 'ADWORLD保守入札落札'),
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

1. njss.info で「ADWORLD」を検索（入札検索が特に有効なベンダー）
2. 個人情報ファイル簿で関東大規模自治体（神奈川・埼玉・千葉）を調査
3. NEC公式サイト（nec.com）のADWORLD事例ページを確認
4. OCI + ADWORLD の相関で検索（ユニークな差別化クエリ）
5. 発見した自治体を candidates に追加し、Pythonコード実行
6. 結果報告

## 現状サマリー

- 現在: 115件
- 目標: 180件
- 必要追加数: 約65件
- 最有望エリア: 神奈川・埼玉・千葉（大規模自治体密集、OCI導入パターン）
