-- gcportal Supabase スキーマ
-- 実行: Supabase SQL Editor に貼り付け

CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  cloud_platform TEXT,
  cloud_confirmed BOOLEAN DEFAULT false,
  multitenancy BOOLEAN DEFAULT false,
  municipality_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id),
  package_name TEXT NOT NULL,
  business TEXT NOT NULL,
  cloud_platform TEXT,
  exemption_number TEXT,
  confirmed_date DATE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS municipalities (
  id SERIAL PRIMARY KEY,
  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,
  pref_city_code TEXT,
  size_category TEXT,
  overall_rate NUMERIC(5,4),
  data_month TEXT,
  UNIQUE(prefecture, city)
);

CREATE TABLE IF NOT EXISTS municipality_progress (
  id SERIAL PRIMARY KEY,
  municipality_id INTEGER REFERENCES municipalities(id),
  business TEXT NOT NULL,
  completion_rate NUMERIC(5,4),
  data_month TEXT,
  UNIQUE(municipality_id, business, data_month)
);

CREATE TABLE IF NOT EXISTS cost_reports (
  id SERIAL PRIMARY KEY,
  municipality_id INTEGER REFERENCES municipalities(id),
  vendor_id INTEGER REFERENCES vendors(id),
  before_cost_annual BIGINT,
  after_cost_annual BIGINT,
  change_ratio NUMERIC(6,3),
  scope TEXT,
  source_url TEXT,
  reported_year INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS municipality_packages (
  id SERIAL PRIMARY KEY,
  municipality_id INTEGER REFERENCES municipalities(id),
  package_id INTEGER REFERENCES packages(id),
  business TEXT,
  adoption_year INTEGER,
  source TEXT,
  confidence TEXT DEFAULT 'unknown',
  UNIQUE(municipality_id, package_id, business)
);

CREATE INDEX IF NOT EXISTS idx_muni_pref ON municipalities(prefecture);
CREATE INDEX IF NOT EXISTS idx_pkg_vendor ON packages(vendor_id);
CREATE INDEX IF NOT EXISTS idx_pkg_business ON packages(business);
CREATE INDEX IF NOT EXISTS idx_pkg_cloud ON packages(cloud_platform);
CREATE INDEX IF NOT EXISTS idx_progress_muni ON municipality_progress(municipality_id);
CREATE INDEX IF NOT EXISTS idx_cost_muni ON cost_reports(municipality_id);
