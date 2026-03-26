-- X Article ペーストHTML生成済みフラグ
-- x_posted（投稿完了）→ x_paste_ready（HTML生成済み）に変更
-- Supabase SQL Editor で実行してください
-- https://msbwmfggvtyexvhmlifn.supabase.co

ALTER TABLE articles ADD COLUMN IF NOT EXISTS x_paste_ready BOOLEAN DEFAULT false;

-- 既存の x_posted=true な記事を x_paste_ready=true に移行
UPDATE articles SET x_paste_ready = true WHERE x_posted = true;
