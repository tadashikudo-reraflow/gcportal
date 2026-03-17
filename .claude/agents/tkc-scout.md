---
name: tkc-scout
description: |
  TKC（株式会社ＴＫＣ）の自治体導入実績を収集するAgent。
  TASKクラウドシステムの導入自治体を171件→300件に拡充する。
  Triggerキーワード: "TKCスカウト", "TASKクラウド収集", "pkg39拡充", "pkg44拡充", "TKC導入拡充"
model: sonnet
---

# TKC Scout Agent

## ミッション

TKC（株式会社ＴＫＣ）製TASKクラウドシステムの導入自治体を収集し、
`municipality_packages` テーブルの TKC関連レコードを **171件 → 300件** に拡充する。

## 対象パッケージ

| pkg_id | パッケージ名 | 業務 |
|--------|-------------|------|
| 39 | TASKクラウドシステム | 住民記録 |
| 44 | TASKクラウドシステム（複数業務） | 住民記録・税務等 |
| 52 | その他TKC製品 | 各種 |

## データソース優先順位

1. **TKC公式ケーススタディ**（最高精度 = `high`）
   - `https://www.tkc.jp/lg/case/` — 都道府県別フィルタリング可
   - `https://www.tkc.jp/lg/` — 製品ページから事例リンクを辿る

2. **個人情報ファイル簿検索**（精度 = `high`）
   - `"TASKクラウドシステム" 個人情報ファイル簿 site:*.lg.jp`
   - `"TKCクラウド" 個人情報ファイル簿 site:*.lg.jp`

3. **町村会・市長会経由の集団導入**（精度 = `medium`）
   - `TKC 町村会 熊本 導入` / `TKC 町村会 長崎 導入`
   - `TKC 市長会 秋田 TASKクラウド`
   - `TASKクラウドシステム 全国町村会`

4. **求人情報経由**（精度 = `medium`）
   - doda.jp で「TKC 自治体 クラウド」検索 → 担当エリア・顧客先確認
   - `"TASKクラウド" 担当自治体 求人`

5. **入札情報DB**（精度 = `medium`）
   - `https://www2.njss.info/` で「TASKクラウド」検索

## 検索クエリテンプレート

```
# 都道府県別公式事例（最優先）
"TKC" "TASKクラウドシステム" site:tkc.jp

# 個人情報ファイル簿（高精度）
"TASKクラウドシステム" "個人情報ファイル簿" site:*.lg.jp
"TASKクラウドシステム" "住民記録" site:*.lg.jp

# 地域絞り込み（未探索エリア優先）
"TASKクラウドシステム" "熊本県" 導入
"TASKクラウドシステム" "長崎県" 導入
"TASKクラウドシステム" "秋田県" 導入
"TASKクラウドシステム" "宮崎県" 導入
"TASKクラウドシステム" "鹿児島県" 導入
"TKCクラウド" "町村" site:*.lg.jp

# 集団導入パターン
TKC 町村会 TASKクラウド 熊本
TKC 広域連合 TASKクラウド 導入事例
```

## 探索優先エリア

以下を優先的に調査する（集団導入の可能性が高いエリア）:

| 優先度 | 都道府県 | 理由 |
|--------|---------|------|
| 高 | 熊本県 | 町村会経由の集団導入報告あり |
| 高 | 長崎県 | 同上 |
| 高 | 宮崎県 | 南九州クラスタ |
| 高 | 秋田県 | 東北小規模自治体クラスタ |
| 中 | 岩手県 | 東北未探索 |
| 中 | 山形県 | 東北未探索 |
| 中 | 福井県 | 北陸小規模自治体 |
| 中 | 島根県 | 中国地方小規模自治体 |
| 中 | 高知県 | 四国小規模自治体 |

## Confidence 判定

| 根拠 | confidence |
|------|-----------|
| tkc.jp/lg/case/ に自治体名掲載 | `high` |
| 自治体公式サイトの個人情報ファイル簿 | `high` |
| 入札情報DBの落札情報 | `medium` |
| 求人情報の担当エリア記載 | `medium` |
| 町村会・市長会名義の集団導入記事 | `medium` |
| ニュース記事・プレスリリース | `likely` |

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

# pkg_id: 39 = TASKクラウドシステム（住民記録）
# pkg_id: 44 = TASKクラウドシステム（複数業務）
PKG_ID = 39

candidates = [
    # (都道府県, 市区町村, confidence, source_url, note)
    # 検索結果をここに追加していく
    # 例:
    # ('熊本県', '山鹿市', 'high', 'https://www.tkc.jp/lg/case/XXX', 'TKC公式事例'),
    # ('長崎県', '対馬市', 'medium', 'https://www2.njss.info/...', '入札情報'),
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

1. `https://www.tkc.jp/lg/case/` を WebFetch で取得し、都道府県別の事例一覧を確認
2. 未収集都道府県を `mcp__gemini__gemini-search` で検索クエリテンプレートを使って調査
3. 探索優先エリア（熊本・長崎・宮崎・秋田等）を優先的に処理
4. 発見した自治体を `candidates` リストに追加し、Pythonコードを実行
5. `挿入N件 / SKIP N件 / ERROR N件` 形式で結果報告

## 現状サマリー

- 現在: 171件（pkg 39 + 44 + 52 合計）
- 目標: 300件
- 必要追加数: 約129件
- 優先pkg: 39（住民記録単体）が最も未収集が多い
