-- 購読者管理強化マイグレーション
-- メール正規化用インデックス（重複防止は既存のUNIQUE制約で対応済み）
-- unsubscribedフラグ追加
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;
-- 注意のメモ
COMMENT ON COLUMN leads.unsubscribed IS '購読解除フラグ';
