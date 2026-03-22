-- packages テーブルに cloud_platform カラムを追加
ALTER TABLE packages ADD COLUMN IF NOT EXISTS cloud_platform TEXT;

CREATE INDEX IF NOT EXISTS idx_pkg_cloud ON packages(cloud_platform);

-- vendors.cloud_platform をデフォルトとして packages に継承
UPDATE packages
SET cloud_platform = v.cloud_platform
FROM vendors v
WHERE packages.vendor_id = v.id
  AND v.cloud_platform IS NOT NULL
  AND packages.cloud_platform IS NULL;

-- NEC GPRIME系のみ OCI に上書き（COKAS系はAWSのまま）
UPDATE packages
SET cloud_platform = 'OCI'
FROM vendors v
WHERE packages.vendor_id = v.id
  AND v.short_name = 'NEC'
  AND packages.package_name LIKE 'GPRIME%';
