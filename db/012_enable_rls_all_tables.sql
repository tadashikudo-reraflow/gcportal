-- 012_enable_rls_all_tables.sql
-- RLS有効化 + ポリシー設定（全未保護テーブル）
--
-- 設計方針:
--   - 公開読み取りテーブル: anon SELECT可、書き込みはservice_roleのみ
--   - admin専用テーブル: 全操作service_roleのみ
--   - 既存RLS済み(rag_documents, rag_chunks, articles): スキップ

BEGIN;

-- ============================================================
-- 公開読み取りテーブル（サイト表示に使用）
-- municipalities, municipality_packages, packages,
-- cost_reports, vendors, progress_snapshots
-- ============================================================

-- municipalities
ALTER TABLE municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "municipalities_public_read" ON municipalities
  FOR SELECT USING (true);
CREATE POLICY "municipalities_service_write" ON municipalities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- municipality_packages
ALTER TABLE municipality_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "municipality_packages_public_read" ON municipality_packages
  FOR SELECT USING (true);
CREATE POLICY "municipality_packages_service_write" ON municipality_packages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- packages
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_public_read" ON packages
  FOR SELECT USING (true);
CREATE POLICY "packages_service_write" ON packages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- cost_reports
ALTER TABLE cost_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cost_reports_public_read" ON cost_reports
  FOR SELECT USING (true);
CREATE POLICY "cost_reports_service_write" ON cost_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_public_read" ON vendors
  FOR SELECT USING (true);
CREATE POLICY "vendors_service_write" ON vendors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- progress_snapshots
ALTER TABLE progress_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_snapshots_public_read" ON progress_snapshots
  FOR SELECT USING (true);
CREATE POLICY "progress_snapshots_service_write" ON progress_snapshots
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- admin専用テーブル（サイト表示には不使用）
-- campaigns, email_events, scrape_jobs, municipality_progress
-- ============================================================

-- campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_service_only" ON campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- email_events
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_events_service_only" ON email_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- scrape_jobs
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scrape_jobs_service_only" ON scrape_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- municipality_progress
ALTER TABLE municipality_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "municipality_progress_service_only" ON municipality_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- rag_* 既存ポリシー修正
-- 現状: public FOR ALL → 修正: service_role FOR ALL
-- ============================================================

DROP POLICY IF EXISTS "rag_documents_write" ON rag_documents;
DROP POLICY IF EXISTS "rag_chunks_write" ON rag_chunks;

CREATE POLICY "rag_documents_write" ON rag_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "rag_chunks_write" ON rag_chunks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMIT;
