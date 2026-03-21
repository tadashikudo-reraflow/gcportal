-- 005_scrape_snapshot.sql
-- スクレイピングジョブ管理 + 時系列スナップショット + rag_documents拡張

-- スクレイピングジョブ管理
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id SERIAL PRIMARY KEY,
  source_key TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  file_hash TEXT,
  etag TEXT,
  last_modified TEXT,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  result_document_id INTEGER REFERENCES rag_documents(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON scrape_jobs(status);

-- 時系列スナップショット
CREATE TABLE IF NOT EXISTS progress_snapshots (
  id SERIAL PRIMARY KEY,
  data_month TEXT NOT NULL,
  municipality_count INTEGER,
  avg_rate NUMERIC(5,2),
  completed_count INTEGER,
  critical_count INTEGER,
  snapshot_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(data_month)
);

-- rag_documentsにfile_hash追加
ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS file_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_docs_hash ON rag_documents(file_hash) WHERE file_hash IS NOT NULL;
