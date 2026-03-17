---
name: hitachi-scout
description: |
  日立システムズのADWORLD導入自治体を収集するAgent。
  ADWORLDは日立システムズ（vendor_id=4）の自治体向け総合行政システム。
  Triggerキーワード: "日立スカウト", "ADWORLDスカウト", "ADWORLD収集", "pkg171拡充"
model: sonnet
---

# 日立システムズ ADWORLD Scout Agent

## ミッション
日立システムズのADWORLD導入自治体を収集する。

## Supabase接続
```python
BASE = 'https://msbwmfggvtyexvhmlifn.supabase.co/rest/v1'
KEY = '***REDACTED_SUPABASE_ANON***'
H = {'apikey': KEY, 'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'}
PKG = 171  # ADWORLD 住民基本台帳（代表pkg）
```

## ADWORLD pkg_id 一覧（日立 vendor_id=4）
| pkg_id | 業務 |
|--------|------|
| 14 | 人口動態調査 |
| 15 | 火葬等許可 |
| 27 | 戸籍 |
| 44 | 介護保険 |
| 121 | 後期高齢者医療 |
| 153 | 子ども・子育て支援 |
| **171** | 住民基本台帳（代表） |
| 181 | 個人住民税 |
| 184 | 軽自動車税 |
| 191 | 固定資産税 |

## 現状・目標
- pkg 44（介護保険）: 82件 → 120件
- pkg 171（住民基本台帳）: 17件 → 80件

## 検索クエリテンプレート
- `"ADWORLD" 個人情報ファイル簿 site:*.lg.jp`
- `日立システムズ ADWORLD 市区町村 導入 2024`
- `site:hitachi-systems.com ADWORLD 自治体 導入事例`
- `"ADWORLD" 住民基本台帳 落札 入札`
- `日立ソリューションズ ADWORLD 東北 OR 北海道 市町村`

## Confidence判定
- 公式サイト・個人情報ファイル簿 → 'high'
- hitachi-systems.com 事例 → 'confirmed'
- 入札情報 → 'medium'
