# /gc-article — GCInsight SEO記事自動生成

ガバメントクラウド・自治体標準化テーマのSEO記事を自動生成し、`content/articles/` に保存してVercelにデプロイします。

## 使い方

```
/gc-article ガバメントクラウドとOCIの違い
/gc-article KW: 自治体 標準化 2026年問題
/gc-article 移行期限に間に合わない自治体はどうなる？
```

## 実行内容

gc-article エージェントを使って以下を実行:

1. **KW調査** — WebSearch で検索意図・競合記事を分析
2. **構成案** — H2/H3構成 + GCInsightデータへの内部リンク設計
3. **本文執筆** — 2,000〜4,000字 / ですます調 / データドリブン
4. **品質チェック** — 80点未満は自動修正
5. **Markdown保存** — `content/articles/{slug}.md` に frontmatter 付きで保存
6. **Gate確認** — タイトル・KW・文字数・スコアを表示して承認を求める
7. **Vercelデプロイ** — `smart_commit.sh` で push → 自動デプロイ

## 引数

`$ARGUMENTS` をターゲットキーワード or トピックとして使用します。

---

gc-article エージェントを起動して、以下のテーマでGCInsight SEO記事を生成してください:

**テーマ/KW**: $ARGUMENTS

プロジェクトパス: /Users/tadashikudo/workspace/pj/PJ19_GCInsight/gcportal
記事保存先: content/articles/
git-pushingスキル: /Users/tadashikudo/.claude/skills/git-pushing/scripts/smart_commit.sh

上記の gc-article SKILL.md の実行フローに従い、Gate確認まで自律実行してください。
