---
name: data-scout-base
description: |
  GCPortal データ収集の共通ルール・ベーステンプレート。
  全スカウトAgentが参照する基底定義。単体では起動しない。
model: sonnet
---

# Data Scout Base — 共通ルール & テンプレート

## 目的

GCPortal（自治体標準化ダッシュボード）の `municipality_packages` テーブルに、
各ベンダーの自治体導入実績データを追加収集する共通フレームワーク。

---

## 鉄則（全Agentで厳守）

### 検索ツール
- 検索は **必ず `mcp__gemini__gemini-search`** を使用する
- WebFetch / WebSearch / playwright は検索確認用のフォールバックとしてのみ使用

### DB操作
- Supabase REST API への挿入は **Python `urllib`（標準ライブラリのみ）** で実装
- `requests` / `httpx` 等の外部ライブラリ不使用
- 変更対象テーブル: `municipality_packages` のみ（`municipalities` は読み取りのみ）

### 重複防止
- 挿入前に `exists(mid, pkg_id)` チェックを必ず実行
- 既存レコードの上書き・更新は行わない（append-only）

### 報告形式
- 実行終了時は必ず `挿入N件 / SKIP N件（重複）/ ERROR N件` 形式で報告

---

## Supabase 接続定数

```python
BASE = 'https://msbwmfggvtyexvhmlifn.supabase.co/rest/v1'
KEY  = '***REDACTED_SUPABASE_ANON***'
HEADERS = {
    'apikey': KEY,
    'Authorization': f'Bearer {KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}
```

---

## Confidence 判定基準

| 値 | 意味 | 根拠の例 |
|----|------|---------|
| `confirmed` | 確実 | 自治体公式サイトの調達仕様書・契約情報 |
| `high` | 高信頼 | 個人情報ファイル簿（自治体公式）、ベンダー公式ケーススタディ |
| `medium` | 中信頼 | 入札情報DB（njss.info等）、求人情報の担当エリア記載 |
| `likely` | 傍証あり | 総務省/デジタル庁資料でのシステム名言及、ニュース記事 |

**迷ったら下位に設定する。** `confirmed` の乱用禁止。

---

## 標準 Python テンプレート

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

def api(method: str, path: str, data: dict = None, params: dict = None) -> dict | list | None:
    url = BASE + path
    if params:
        url += '?' + urllib.parse.urlencode(params)
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        print(f'HTTP {e.code}: {e.read().decode()}')
        return None

def get_mid(pref: str, city: str) -> int | None:
    """自治体名から municipality_id を取得"""
    rows = api('GET', '/municipalities', params={
        'pref_name': f'eq.{pref}',
        'city_name': f'eq.{city}',
        'select': 'id'
    })
    return rows[0]['id'] if rows else None

def exists(mid: int, pkg_id: int) -> bool:
    """重複チェック"""
    rows = api('GET', '/municipality_packages', params={
        'municipality_id': f'eq.{mid}',
        'package_id': f'eq.{pkg_id}',
        'select': 'id'
    })
    return bool(rows)

def insert(mid: int, pkg_id: int, confidence: str, source: str, note: str = '') -> bool:
    """レコード挿入"""
    result = api('POST', '/municipality_packages', data={
        'municipality_id': mid,
        'package_id': pkg_id,
        'confidence': confidence,
        'source': source,
        'note': note
    })
    return result is not None

# --- メイン処理テンプレート ---
PKG_ID = 0  # 各Agentで上書き
results = {'insert': 0, 'skip': 0, 'error': 0}

candidates = [
    # ('都道府県名', '市区町村名', 'confidence', 'source_url', 'note'),
]

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
    else:
        results['error'] += 1

print(f"完了: 挿入{results['insert']}件 / SKIP{results['skip']}件 / ERROR{results['error']}件")
```

---

## 有効な検索アプローチ（精度順）

### 高精度
1. **個人情報ファイル簿**: `"{システム名}" 個人情報ファイル簿 site:*.lg.jp`
2. **ベンダー公式ケーススタディ**: ベンダー公式サイトの事例ページ直接閲覧
3. **入札情報DB**: `https://www2.njss.info/` でシステム名検索

### 中精度
4. **求人情報**: doda.jp、kagojob.jp の求人（顧客先リスト記載あり）
5. **総務省/デジタル庁公式PDF**: `site:soumu.go.jp` / `site:digital.go.jp`
6. **J-LIS事例**: `site:j-lis.go.jp`

### 低精度（非推奨）
- 汎用的なシステム名での検索（ノイズ多）
- JS描画必須サイトのスクレイピング
- ベンダー名のみでの検索

---

## 注意事項

- `source` フィールドには必ず **URL または文書名** を記入する
- 都道府県名は漢字フルネーム（例: `東京都` / `北海道` / `大阪府` / `京都府`）
- 市区町村名は正式名称（例: `千代田区` / `札幌市` / `那覇市`）
- 1回の実行で候補が多い場合は **都道府県単位で分割実行** を推奨
