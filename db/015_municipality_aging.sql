-- 高齢化率・財政比率カラム追加
ALTER TABLE municipalities
  ADD COLUMN IF NOT EXISTS aging_rate NUMERIC(4,1),
  ADD COLUMN IF NOT EXISTS current_expenditure_ratio NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS real_debt_ratio NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS future_burden_ratio NUMERIC(6,1);
