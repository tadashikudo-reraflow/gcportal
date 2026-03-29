-- UXイベント収集テーブル
-- クリック座標・スクロール深度・滞在時間を記録して自作ヒートマップに使う

create table if not exists ux_events (
  id          bigserial primary key,
  page        text        not null,          -- 例: "/", "/costs", "/risks"
  event_type  text        not null,          -- "click" | "scroll" | "leave"
  -- クリック座標（viewport比率 0.0〜1.0）
  x_ratio     numeric(5,4),                  -- click時のみ
  y_ratio     numeric(5,4),                  -- click時のみ
  -- スクロール
  scroll_depth numeric(5,4),                 -- 0.0〜1.0 (scroll/leaveイベント)
  -- 滞在時間
  dwell_ms    integer,                       -- leave時のみ（ミリ秒）
  -- 端末情報
  viewport_w  smallint,
  viewport_h  smallint,
  is_mobile   boolean     default false,
  -- 集計用
  session_id  text,                          -- クライアント生成UUID（セッション単位）
  created_at  timestamptz default now()
);

-- 集計クエリ用インデックス
create index if not exists ux_events_page_type_idx
  on ux_events (page, event_type, created_at desc);

-- 古いデータ自動削除（90日）
-- Supabase pg_cron で定期実行する場合は別途設定
-- select cron.schedule('cleanup-ux-events', '0 3 * * *',
--   $$delete from ux_events where created_at < now() - interval '90 days'$$);

-- RLS: 書き込みはanon可（収集用）、読み取りはサービスロールのみ
alter table ux_events enable row level security;

create policy "ux_events_insert_anon"
  on ux_events for insert
  to anon
  with check (true);

create policy "ux_events_select_service"
  on ux_events for select
  to service_role
  using (true);
