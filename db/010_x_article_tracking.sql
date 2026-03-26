-- X Article投稿トラッキング
-- Supabase SQL Editor で実行してください
-- https://msbwmfggvtyexvhmlifn.supabase.co

ALTER TABLE articles ADD COLUMN IF NOT EXISTS x_posted BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS x_posted_at TIMESTAMPTZ;
