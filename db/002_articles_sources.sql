-- ============================================================
-- PJ19 GCInsight — 記事出典システム マイグレーション
-- 実行場所: Supabase Dashboard > SQL Editor
-- ============================================================

-- articles テーブルに sources カラムを追加
-- 形式: [{ "url": "...", "title": "...", "org": "...", "accessed": "2026-03-20" }]
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]';

-- COMMENT
COMMENT ON COLUMN articles.sources IS 'Article source citations as JSON array: [{ url, title, org, accessed }]';
