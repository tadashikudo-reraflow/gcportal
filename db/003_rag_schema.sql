-- ============================================================
-- PJ19 GCInsight — RAG (Retrieval-Augmented Generation) スキーマ
-- 実行場所: Supabase Dashboard > SQL Editor
-- 前提: pgvector 拡張が有効であること
-- ============================================================

-- pgvector 拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- ドキュメント管理テーブル
CREATE TABLE IF NOT EXISTS rag_documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,               -- 'pdf', 'xlsx', 'docx', 'html', 'text'
  source_url TEXT,
  organization TEXT,            -- 発行元組織
  category TEXT,                -- 'official', 'report', 'article', 'regulation'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'indexed', 'error'
  chunk_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- チャンクテーブル（ベクトル検索の単位）
CREATE TABLE IF NOT EXISTS rag_chunks (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,  -- ドキュメント内の順序
  content TEXT NOT NULL,
  token_count INTEGER,
  embedding vector(1536),        -- OpenAI text-embedding-3-small
  metadata JSONB DEFAULT '{}',   -- ページ番号、セクション名など
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_rag_docs_status ON rag_documents(status);
CREATE INDEX IF NOT EXISTS idx_rag_docs_category ON rag_documents(category);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_doc ON rag_chunks(document_id);

-- ベクトル類似検索用のIVFFlat インデックス（チャンク数が増えたら作成）
-- 少量の場合は正確な検索のためインデックスなしでOK
-- CREATE INDEX idx_rag_chunks_embedding ON rag_chunks
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- セマンティック検索関数
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id int,
  document_id int,
  content text,
  similarity float,
  metadata jsonb,
  doc_title text,
  doc_organization text,
  doc_source_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.metadata,
    d.title AS doc_title,
    d.organization AS doc_organization,
    d.source_url AS doc_source_url
  FROM rag_chunks c
  JOIN rag_documents d ON d.id = c.document_id
  WHERE d.status = 'indexed'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS
ALTER TABLE rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員可能（公開データ）
CREATE POLICY "rag_documents_read" ON rag_documents FOR SELECT USING (true);
CREATE POLICY "rag_chunks_read" ON rag_chunks FOR SELECT USING (true);

-- 書き込みはservice_roleのみ（API経由の管理者操作）
CREATE POLICY "rag_documents_write" ON rag_documents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "rag_chunks_write" ON rag_chunks FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE rag_documents IS 'RAG system: ingested documents (PDF, XLSX, etc.)';
COMMENT ON TABLE rag_chunks IS 'RAG system: document chunks with vector embeddings for semantic search';
COMMENT ON FUNCTION match_chunks IS 'Semantic search: find chunks similar to query embedding';
