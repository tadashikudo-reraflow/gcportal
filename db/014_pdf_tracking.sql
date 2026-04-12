-- PDF ダウンロードトラッキング
-- leads テーブルに pdf_downloaded_at カラムを追加

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS pdf_downloaded_at TIMESTAMPTZ;
