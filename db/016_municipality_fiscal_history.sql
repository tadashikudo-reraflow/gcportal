-- 自治体 財政指標 時系列テーブル (R2〜R6 5年分)
CREATE TABLE IF NOT EXISTS municipality_fiscal_history (
  id                        BIGSERIAL PRIMARY KEY,
  municipality_id           BIGINT    NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
  fiscal_year               INTEGER   NOT NULL,  -- 2020, 2021, ..., 2024
  fiscal_strength           NUMERIC(5,2),        -- 財政力指数
  current_expenditure_ratio NUMERIC(5,1),        -- 経常収支比率 (%)
  real_debt_ratio           NUMERIC(5,1),        -- 実質公債費比率 (%)
  future_burden_ratio       NUMERIC(6,1),        -- 将来負担比率 (%)
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (municipality_id, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_mfh_municipality_year
  ON municipality_fiscal_history (municipality_id, fiscal_year);

ALTER TABLE municipality_fiscal_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'municipality_fiscal_history' AND policyname = 'anon_select_fiscal_history'
  ) THEN
    CREATE POLICY anon_select_fiscal_history
      ON municipality_fiscal_history FOR SELECT
      TO anon USING (true);
  END IF;
END $$;
