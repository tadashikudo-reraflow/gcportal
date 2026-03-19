-- GCInsight articles テーブル
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS articles (
  id          BIGSERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  content     TEXT DEFAULT '',      -- Markdown本文
  date        TEXT DEFAULT '',      -- 表示用日付 YYYY-MM-DD
  tags        TEXT[] DEFAULT '{}',
  author      TEXT DEFAULT 'GCInsight編集部',
  is_published BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: anon は公開記事のみ読み取り可
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read published" ON articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "service role full access" ON articles
  USING (auth.role() = 'service_role');
