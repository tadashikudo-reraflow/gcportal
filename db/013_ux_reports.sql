-- UX週次集計レポートテーブル
-- Vercel Cronが毎週月曜に書き込む、ux-optimizerが読み込む

create table if not exists ux_reports (
  id          bigint generated always as identity primary key,
  report_date date        not null unique,       -- 集計基準日（月曜日）
  period_days int         not null default 7,
  data        jsonb       not null,              -- ページ別集計データ
  warnings    jsonb       not null default '[]', -- 閾値超えページリスト
  created_at  timestamptz not null default now()
);

-- RLS
alter table ux_reports enable row level security;

-- service_role のみ読み書き可（anon不可）
create policy "service_role full access" on ux_reports
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
