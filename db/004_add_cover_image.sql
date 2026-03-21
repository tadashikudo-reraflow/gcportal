-- articles テーブルに cover_image カラムを追加
-- Supabase SQL Editor で実行してください

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 既存記事のカバー画像パスを一括設定
UPDATE articles SET cover_image = '/images/articles/' || slug || '.png'
WHERE cover_image IS NULL AND is_published = true;
