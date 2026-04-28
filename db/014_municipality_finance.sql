-- 014: municipalities テーブルに財政プロフィールカラム追加
-- データソース:
--   財政力指数: 総務省「全市町村の主要財政指標」令和5年度
--   標準財政規模・人口: 総務省「市町村別決算状況調」令和6年度

ALTER TABLE municipalities
  ADD COLUMN IF NOT EXISTS population INTEGER,
  ADD COLUMN IF NOT EXISTS standard_fiscal_scale BIGINT,   -- 単位: 千円
  ADD COLUMN IF NOT EXISTS fiscal_strength NUMERIC(4,2),   -- 財政力指数
  ADD COLUMN IF NOT EXISTS financial_data_year TEXT;       -- データ年度 e.g. "R5" / "R6"
