-- articles テーブル拡張（v2）
-- Supabase SQL Editor で実行してください

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS featured_image TEXT,
  ADD COLUMN IF NOT EXISTS category       TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reading_time   INT  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_format TEXT DEFAULT 'html';

-- 既存のMarkdownファイル由来レコードはcontent_format='markdown'のまま
-- adminから作成した新規記事はcontent_format='html'
