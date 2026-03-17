# GCPortal Data Scout Agents

GCPortal（自治体標準化ダッシュボード）のデータ収集を自動化するClaude Code Agentの一覧。
自治体ごとの行政システム導入実績を `municipality_packages` テーブルに蓄積する。

---

## Agent一覧

| ファイル | Agent名 | 用途 | 対象pkg_id | 現在/目標 |
|---------|---------|------|-----------|----------|
| `data-scout-base.md` | data-scout-base | 共通ルール・テンプレート（全Agentが参照） | — | — |
| `tkc-scout.md` | tkc-scout | TKC TASKクラウドシステム | 39, 44, 52 | 171→300件 |
| `ines-scout.md` | ines-scout | アイネス WebRings | 16 | 194→250件 |
| `densan-scout.md` | densan-scout | 電算 Reams | 211 | 168→220件 |
| `gcom-scout.md` | gcom-scout | Gcom Acrocity | 74 | 231→300件 |
| `nec-scout.md` | nec-scout | NEC ADWORLD | 95 | 115→180件 |
| `rkkcs-scout.md` | rkkcs-scout | RKKCS 総合行政システム | 210 | 42→80件 |
| `confidence-normalizer.md` | confidence-normalizer | confidence値の数値→文字列正規化 | — | 31件修正 |
| `muni-master-builder.md` | muni-master-builder | 自治体マスタ全国化 | — | 1741→3300件 |

---

## 起動方法

Claude Code で以下のキーワードを入力することで対応Agentが起動する:

```
# ベンダースカウト
「TKCスカウト」「TASKクラウド収集」「pkg39拡充」
「アイネススカウト」「WebRings収集」「pkg16拡充」
「電算スカウト」「Reams収集」「pkg211拡充」
「Gcomスカウト」「Acrocity収集」「pkg74拡充」
「NECスカウト」「ADWORLD収集」「pkg95拡充」
「RKKCSスカウト」「総合行政システム収集」「pkg210拡充」

# メンテナンス
「confidence正規化」「データクレンジング」
「自治体マスタ補完」「47都道府県化」「municipalities追加」
```

---

## 前提知識

### Supabase 接続情報

```
BASE = 'https://msbwmfggvtyexvhmlifn.supabase.co/rest/v1'
KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYndtZmdndnR5ZXh2aG1saWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDcwNDYsImV4cCI6MjA4OTI4MzA0Nn0.xIdchE4aRetrzCeWRvkcW0-p-asDz7fU-McLeQHjKIg'
```

### テーブル構造

```
municipalities          自治体マスタ（id, pref_name, city_name, pref_city_code, size_category）
municipality_packages   導入実績（municipality_id, package_id, confidence, source, note）
```

### confidence 値の定義

| 値 | 意味 |
|----|------|
| `confirmed` | 確実（自治体公式サイトの契約情報等） |
| `high` | 高信頼（個人情報ファイル簿、ベンダー公式事例） |
| `medium` | 中信頼（入札情報DB、求人情報） |
| `likely` | 傍証あり（ニュース記事、近隣自治体からの推測） |

---

## 有効な検索アプローチ（全Agent共通）

### 高精度（推奨）
1. `"{システム名}" 個人情報ファイル簿 site:*.lg.jp`
2. ベンダー公式事例ページ直接確認
3. njss.info 入札情報DB

### 中精度
4. doda.jp・kagojob.jp 求人情報
5. `site:soumu.go.jp` / `site:digital.go.jp` 公式PDF

### 非推奨（ノイズ多）
- 汎用的なシステム名のみでの検索
- JS描画必須サイトのスクレイピング

---

## ベンダー別 現状まとめ（2026-03-17時点）

| ベンダー | システム | 現在 | 目標 | 主要エリア |
|---------|---------|------|------|-----------|
| Gcomホールディングス | Acrocity | 231件 | 300件 | 東北・北海道（大翔社）、関西 |
| アイネス | WebRings | 194件 | 250件 | 東北・愛知・関西 |
| TKC | TASKクラウド | 171件 | 300件 | 九州（熊本・長崎）、東北 |
| 電算 | Reams | 168件 | 220件 | 長野・北海道 |
| NEC | ADWORLD | 115件 | 180件 | 関東（神奈川・埼玉・千葉） |
| RKKCS | 総合行政システム | 42件 | 80件 | 鹿児島・宮崎・熊本 |

---

## 実行フロー（標準）

```
1. Agentを起動（キーワード入力）
2. mcp__gemini__gemini-search で検索クエリ実行
3. 発見した自治体を candidates リストに追加
4. exists() チェックで重複確認
5. insert() で DB 挿入
6. 「挿入N件 / SKIP N件 / ERROR N件」で報告
```

---

## 関連ファイル

| パス | 内容 |
|------|------|
| `../README.md` | GCPortalプロジェクト全体の説明 |
| `../supabase/schema.sql` | DBスキーマ定義 |
| `../scripts/parse_soumu.py` | 総務省データパーサ（muni-master-builderで使用） |
| `../../gcportal-frontend/` | Next.jsフロントエンド |
