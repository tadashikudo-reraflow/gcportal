# 記事MDの管理場所が移動しました

記事Markdownファイルは Google Drive に移動しました:

```
$GDRIVE_WORKSPACE/contents/PJ19/articles/
```

## DB投入コマンド

```bash
ARTICLES_DIR="$GDRIVE_WORKSPACE/contents/PJ19/articles" \
  npx tsx scripts/migrate-articles-to-db.ts
```

環境変数 `ARTICLES_DIR` を省略すると、従来通りこのディレクトリ（`content/articles/`）をフォールバック参照します。
