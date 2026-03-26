-- ニュースレター設定テーブル（シングルトン: id=1固定）
create table if not exists newsletter_config (
  id integer primary key default 1,
  -- 著者設定
  author_name text not null default 'GCInsight編集部',
  author_title text not null default '元JTC自治体担当 × 外資IT営業 × 政策ウォッチャー × 地方在住',
  author_style text not null default '部外者がズバッと正論で指摘する',
  author_signature_html text default '',
  -- 読者ペルソナ
  reader_persona text not null default '自治体DX担当者・ITベンダー営業・政策関心層',
  reader_tone text not null default 'わかりやすく・現場感重視・専門用語は必ず平易に解説',
  reader_topics text not null default 'ガバメントクラウド移行遅延・ベンダー動向・予算・住民影響',
  -- 収集キーワード
  x_keywords text not null default 'ガバメントクラウド,自治体標準化,ガバクラ,自治体DX',
  note_keywords text not null default 'ガバメントクラウド,自治体DX,標準化基盤',
  updated_at timestamptz default now()
);

-- シングルトン初期レコード
insert into newsletter_config (id) values (1) on conflict (id) do nothing;
