# GCInsight — ガバメントクラウド移行 可視化ダッシュボード

> 日本全国1,741自治体のガバメントクラウド移行進捗をリアルタイムで可視化するオープンダッシュボード

🌐 **本番サイト**: [gcinsight.jp](https://gcinsight.jp)

---

## 概要

デジタル庁が公開する標準準拠システム移行状況データをもとに、自治体・都道府県・業務システム別の移行進捗を可視化します。

### 主な機能

- **全国ダッシュボード** — 移行率・完了団体数をリアルタイム表示
- **都道府県別分析** — 47都道府県の進捗比較
- **業務システム別分析** — 20業務システムの移行状況
- **リスク団体マップ** — 移行遅延リスクの高い自治体を可視化
- **パッケージ比較** — ベンダー別シェア・移行状況
- **PDFレポート配信** — メール登録者にレポートを自動配信（Resend）
- **ニュースレター** — 最新情報をメールで定期配信

---

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 15 (App Router) + React 19 |
| データベース | Supabase (PostgreSQL) |
| スタイリング | Tailwind CSS v4 |
| メール配信 | Resend |
| ニュースレター | Beehiiv |
| デプロイ | Vercel |
| データ取得 | デジタル庁 標準準拠システム移行状況API |

---

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/gcinsight.git
cd gcinsight
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各サービスのAPIキーを設定してください。

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトURL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseサービスロールキー | ✅ |
| `ADMIN_PASSWORD` | 管理画面パスワード | ✅ |
| `RESEND_API_KEY` | Resend APIキー（PDF配信） | ✅ |
| `BEEHIIV_API_KEY` | Beehiiv APIキー | △ |
| `BEEHIIV_PUBLICATION_ID` | Beehiiv Publication ID | △ |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token（管理者通知） | △ |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | △ |
| `CRON_SECRET` | Vercel Cron認証シークレット | △ |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID | △ |

### 3. Supabaseのセットアップ

```sql
create table leads (
  id bigserial primary key,
  email text not null unique,
  organization_type text,
  source text default 'report',
  created_at timestamptz default now()
);
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認できます。

---

## データソース

- **デジタル庁** — [標準準拠システム移行状況](https://www.digital.go.jp/policies/local_governments/govcloud-migration-status/)
- 更新頻度: 月次（Vercel Cronで自動取得）

---

## ディレクトリ構成

```
app/
├── page.tsx              # トップ（全国ダッシュボード）
├── prefectures/          # 都道府県別
├── businesses/           # 業務システム別
├── packages/             # パッケージ比較
├── risks/                # リスク団体
├── report/               # PDFレポート登録
├── admin/                # 管理画面
└── api/
    ├── leads/            # メール登録 + PDF配信
    ├── report/           # レポート関連
    └── snapshots/        # データスナップショット
etl/                      # データ取得・変換スクリプト
scripts/                  # ユーティリティスクリプト
```

---

## ライセンス

MIT

---

## 作者

[@tadkud](https://x.com/tadkud) — GCInsight編集部
