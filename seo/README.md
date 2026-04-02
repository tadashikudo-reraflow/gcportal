# PJ19 GCInsight — SEO ツール

## ファイル一覧

| ファイル | 用途 |
|---------|------|
| `update_kw_planner.py` | KWプランナー更新 |
| `collect_x_voices.py` | X現場の声 週次収集 |
| `gsc_cli.py` | GSC（Search Console）検索クエリ・順位・インデックス確認 |
| `serpapi_cli.py` | SerpAPI 検索順位・競合ドメイン確認 |
| `ga4_cli.py` | GA4 セッション・PV・流入元取得（プロパティID要設定） |

---

## collect_x_voices.py — X現場の声 週次収集

xactions CLI（無料）で検索し、いいね数上位の投稿をMDファイルに蓄積する。
記事の「現場の声」セクションの引用ソースとして使用。

### 使い方

```bash
# 週1実行（手動 or cron）
python3 seo/collect_x_voices.py

# ドライラン（保存せず確認）
python3 seo/collect_x_voices.py --dry-run

# カスタムクエリ
python3 seo/collect_x_voices.py --query "ガバクラ モダン化" --min-likes 5
```

### 前提

- xactions CLI がインストール済み & ログイン済み（`~/.npm-global/bin/xactions`）
- セッション切れの場合: `echo "$(cat ~/.claude/xauth.txt)" | xactions login`

### 出力先

```
$GDRIVE_WORKSPACE/datasets/PJ19/x-voices/YYYY-MM-DD.md
```

### デフォルト検索クエリ（5本）

1. `ガバクラ コスト`
2. `ガバメントクラウド 費用`
3. `自治体標準化 ガバクラ`
4. `ガバクラ 移行 ベンダー`
5. `ガバメントクラウド モダン化`

### フィルタ

- いいね3以上
- いいね数降順ソート
- クエリ間の重複は自動除去

### コスト

xactions CLI = **無料**（セッションcookie認証）。X API公式は使わない。

### ウォッチ対象アカウント

X + note.com 両方で活発なガバクラ界隈の実務者:

| アカウント | 名前 | 属性 |
|-----------|------|------|
| `@techniczna` | 高橋広和 | 名古屋市デジタル改革推進課 課長補佐 |
| `@local_devya` | 標準化どうしましょう | 自治体SE / 標どう塾塾長 |
| `@goingmywill` | Meteor | 地場ベンダー / ガバクラ+20業務担当 |
| `@honeycomb_bnbn` | はちみつ | データ整理型（都道府県別利用状況） |
| `@kokumin_a` | kokumin_a | 国会質疑文字起こし |

### 記事への引用方法

1. 蓄積された `YYYY-MM-DD.md` を開く
2. いいね数上位 & テーマ合致の投稿をピック
3. 記事の「現場の声」セクションに blockquote + URL で引用
4. 異なる立場（自治体SE / ベンダー / コンサル等）から最低2件選ぶ
