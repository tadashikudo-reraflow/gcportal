# spec-2026-05-04-article-cta-improvement

> 記事ページ→ニュースレター登録(NL登録)動線の改善仕様
> ref: seo-weekly-2026-05-04 (記事ページ→NL CTA 動線改善セクション)

## 1. 背景・問題

### データ根拠
- `leads` table source 別内訳（直近30日）:
  - newsletter_hero: 9件 / newsletter_header: 9件 / newsletter_homepage: 9件 / newsletter_footer: 6件
  - **newsletter_article: わずか1件（全体の2%）**
- Clarity データ: 平均スクロール深度 69.3% — つまり3割のユーザーは記事ボトムに到達せず
- `app/articles/[slug]/page.tsx` の NL CTA は 212行目 `<ArticleNewsletterBanner />` の **ボトム1箇所のみ**
- GA4: `newsletter_signup` イベント 7日間 6件・全体 PV 2,016件 → CVR 約 0.3%

### organization_type データ
- it_vendor: 49% / other: 30% / municipality: **12%** / consultant: 9%
- 本来のターゲット「自治体担当者」が最少。コンテンツとCTA文言を自治体向けに絞れば municipality 比率を改善可能

### 結論
記事経由のCV機能が事実上機能していない。改善余地は大きい（流入の99%は CTA 表示前に離脱）。

## 2. 目標・成功条件

| KPI | 現状 | 目標（6週後・2026-06-15測定） |
|---|---|---|
| 記事経由 NL登録 | 1件/30日 (source=newsletter_article) | **5件/30日**（5倍） |
| 記事経由 source 比率 | 2% | **10%以上** |
| 記事ページ CVR (NL登録/PV) | 約0.05% | **0.5%** |
| organization_type=municipality 比率 | 12% | **25%** |
| 記事ページ平均スクロール深度（Clarity） | 69.3% | 75%以上（読了率改善の副次効果） |

> **計測方法**: `~/workspace/scripts/nl_subscribers_cli.py --by-source` を週次レポートで定点観測。GA4 `newsletter_signup` イベントを `pagePath` でセグメント。

## 3. 設計

### 3.1 ミッドアーティクル CTA 挿入（最優先）

#### 配置ロジック
- MarkdownContent パーサーで `<h2>` の **2つ目の直前** にインライン CTA を挿入
- 短い記事（h2 が3個未満）は配置しない
- スクロール深度 50% 地点で IntersectionObserver で発火 → impression を GA4 に送信

#### 新コンポーネント: `components/InlineNewsletterCTA.tsx`

```tsx
interface Props {
  variant?: 'default' | 'municipality' | 'finops';
  source: string; // newsletter_article_mid_default など
}
```

レンダリング:
- 控えめなボーダーカード（背景色 #FFF5D1 ブランドアクセント）
- ヘッドライン: 「📊 この記事の元データを毎週受け取る」
- 本文: 「総務省・デジタル庁公表データを GCInsight が要約して毎週お届け。3ヶ月で 51 自治体担当者が登録済み。」
- メアド入力 + 送信ボタン（既存 `ArticleNewsletterBanner` のフォーム POST 先と同じ `/api/newsletter/subscribe`）
- ボタン直下に「※登録は無料・解約はワンクリック」

source パラメータ: `newsletter_article_mid_<slug>` で記事別計測

### 3.2 StickyCTA を記事に適用（モバイル）

- 既存 `components/StickyCTA.tsx` を `app/articles/[slug]/page.tsx` に追加
- モバイル（width < 768px）のみ表示・スクロール 30% 地点で出現
- 閉じるボタン付き・LocalStorage で1セッション内 dismiss 状態保持
- source: `newsletter_article_sticky_<slug>`

### 3.3 自治体担当者専用 CTA 枠

#### 配置
- 記事末（既存 `<ArticleNewsletterBanner />` の直前）に新セクション追加
- `<MunicipalityCTASection />` コンポーネント新設

#### 内容
- ヘッドライン: 「自治体IT担当者の方へ」
- 本文: 「GCInsight は自治体担当者向けに特化した移行進捗ダッシュボードを無料で公開しています。1,788団体・34,592システムの最新データを毎日更新。」
- 行動喚起: 「ニュースレターで毎週受け取る」+ 「あなたの自治体ページを見る」（/progress?pref=...）の二択
- source: `newsletter_article_municipality_<slug>`

#### 出し分け
- IP/UAから自治体ドメイン（`*.lg.jp` など）を判定して優先表示...は将来の拡張。MVPでは全ユーザー表示

### 3.4 CTA文言A/Bテスト基盤

#### 実装
- `components/InlineNewsletterCTA.tsx` で `variant` prop 切替
- 50/50 ランダム振り分け（cookie で session 内固定）
- variant 別 source で計測:
  - `newsletter_article_mid_v1`: 「📊 この記事の元データを毎週受け取る」
  - `newsletter_article_mid_v2`: 「自治体担当者向け：移行最新動向を週1メールで」

#### 評価期間
- 4週間（最低 NL登録 20件 / variant 達成想定）
- 統計的有意差 p < 0.10 で勝者確定 → 次4週で次のテスト

## 4. 実装手順

### Phase 1（今週）: MVP 実装
1. `components/InlineNewsletterCTA.tsx` 新規作成（variant=default 1パターン先行）
2. `app/articles/[slug]/page.tsx` の MarkdownContent ラッパーに H2 検出ロジック追加
3. `components/MunicipalityCTASection.tsx` 新規作成
4. ArticleNewsletterBanner 直前に挿入

### Phase 2（次週）: A/B テスト基盤
1. cookie ベース variant 割当 hook 追加（`hooks/useABVariant.ts`）
2. variant=v1, v2 を InlineNewsletterCTA に実装
3. GA4 カスタムディメンション登録（`cta_variant`）

### Phase 3（再来週）: モバイル最適化
1. StickyCTA を記事ページに適用
2. モバイル幅でのみ表示するレスポンシブ制御

## 5. 検証基準

### 機能検証
- [ ] 記事ページ（H2 が3個以上）で InlineNewsletterCTA が表示される
- [ ] 短い記事（H2 が2個以下）では非表示
- [ ] フォーム送信で `leads` テーブルに source=`newsletter_article_mid_*` で記録される
- [ ] MunicipalityCTASection が記事末に表示される
- [ ] StickyCTA がモバイル時のみ・スクロール30%以降で表示
- [ ] dismiss 後は同セッション内で再表示されない

### KPI 検証（6週後）
- [ ] 記事経由 NL登録が 月5件以上
- [ ] organization_type=municipality 比率が 25%以上
- [ ] CTA impression / click / subscribe ファネル CVR が GA4 で計測可能

## 6. ロールバック計画

### 即時ロールバック
```bash
git revert <commit-hash>   # 記事 CTA 関連 commit を全部戻す
```

### 段階的ロールバック
- Phase 1 → 2 → 3 の順に commit が分かれていれば、問題のあるフェーズのみ revert
- 各 commit は独立して revert 可能なように設計

### モニタリング
- 本番反映後 7日間:
  - 記事ページの直帰率増加（>+5%）→ ロールバック判断
  - フォーム送信エラー率増加（>+1%）→ ロールバック判断
  - スクロール深度低下（<60%）→ CTA配置調整 or ロールバック

## 7. 関連ファイル

### 既存（参照のみ）
- `app/articles/[slug]/page.tsx`
- `components/ArticleNewsletterBanner.tsx`
- `components/StickyCTA.tsx`
- `components/NewsletterModal.tsx`
- `app/api/newsletter/subscribe/route.ts`

### 新規作成
- `components/InlineNewsletterCTA.tsx`
- `components/MunicipalityCTASection.tsx`
- `hooks/useABVariant.ts`（Phase 2）
- `lib/ab-variant.ts`（Phase 2）

## 8. リスク・注意事項

| リスク | 対策 |
|---|---|
| 記事の読みやすさが損なわれる | スクロール深度・直帰率を定点観測。+5%悪化で配置見直し |
| フォーム送信エラー率増加 | 既存 /api/newsletter/subscribe を流用（ロジック変更なし） |
| モバイルで複数CTA表示で煩雑 | StickyCTA はモバイルのみ・MidCTA は1記事1個・末尾Banner はそのまま |
| GA4 events スパム化 | impression は IntersectionObserver で発火・1回のみ |
| organization_type 自動判定の精度低下 | 既存の手動入力フォーム維持。CTA変更でも入力UIは変えない |

## 9. 着手判断

> このSpecの承認後、Phase 1 から着手。Phase 2 は Phase 1 の KPI 中間レビュー（2週後）を経てから。

承認者: Founder（工藤）
作成: 2026-05-04
