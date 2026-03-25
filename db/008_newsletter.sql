-- ニュースレター管理スキーマ
-- 実行: Supabase SQL Editor に貼り付け

-- メールキャンペーン
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- メールイベント（開封・クリック）
CREATE TABLE IF NOT EXISTS email_events (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id),
  lead_id INTEGER NOT NULL REFERENCES leads(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_lead ON email_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
