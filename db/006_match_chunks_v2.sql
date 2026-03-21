-- ============================================================
-- PJ19 GCInsight — match_chunks_v2: 拡張セマンティック検索関数
-- 実行場所: Supabase Dashboard > SQL Editor
-- 前提: 003_rag_schema.sql が適用済みであること
-- ============================================================

-- カテゴリ・組織フィルタ付きセマンティック検索関数
CREATE OR REPLACE FUNCTION match_chunks_v2(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  filter_organization text DEFAULT NULL
)
RETURNS TABLE (
  id int,
  document_id int,
  content text,
  similarity float,
  metadata jsonb,
  doc_title text,
  doc_organization text,
  doc_source_url text,
  doc_category text,
  doc_created_at timestamptz
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
    d.source_url AS doc_source_url,
    d.category AS doc_category,
    d.created_at AS doc_created_at
  FROM rag_chunks c
  JOIN rag_documents d ON d.id = c.document_id
  WHERE d.status = 'indexed'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR d.category = filter_category)
    AND (filter_organization IS NULL OR d.organization = filter_organization)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_chunks_v2 IS 'Enhanced semantic search with category/organization filters and full document metadata';
