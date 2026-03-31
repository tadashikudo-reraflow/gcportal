-- ベンダーマスタ初期データ
INSERT INTO vendors (name, short_name, cloud_platform, cloud_confirmed, multitenancy, municipality_count, notes) VALUES
('株式会社ＴＫＣ',        'TKC',   'AWS',   true,  true,  170, '164団体が2026年2月時点で全面切替完了（2026/2実績）。マルチテナント方式'),
('日本電気株式会社',       'NEC',   'AWS',   true,  false, null, 'COKAS系=AWS、GPRIME行政経営=OCI（2024/10 NEC×Oracle発表）。パッケージ単位でcloud_platform管理'),
('富士通Japan株式会社',    '富士通', 'AWS',   true,  false, 300, '約300自治体担当。移行遅延で期限内完了不可を通知。MICJET/MCWEL全パッケージAWS稼働'),
('株式会社日立システムズ', '日立',  null,    false, false, null, 'ADWORLD等。クラウド基盤未確認'),
('行政システム株式会社',   '行政S', null,    false, false, null, null),
('京都府自治体情報化推進協議会', '京都GIS', null, false, true, null, '共同利用型'),
('株式会社アイネス',       'アイネス', null,  false, false, null, null),
('Gcomホールディングス株式会社', 'Gcom', null, false, false, null, null)
ON CONFLICT DO NOTHING;

-- コストレポート初期データ（既知の調査結果）
-- municipality_idは自治体マスタ投入後に更新
INSERT INTO cost_reports (municipality_id, vendor_id, change_ratio, scope, source_url, reported_year, notes) VALUES
(null, null, 0.920, '個別自治体',     'https://www.digital.go.jp/policies/local_governments/government-cloud-interim-report', 2024, '岩手県盛岡市 8%削減（好事例）'),
(null, null, 1.600, '東京都特別区',   'https://www.soumu.go.jp', 2025, '東京都特別区平均 1.6倍増'),
(null, null, 2.300, '中核市平均',     'https://www.soumu.go.jp', 2025, '中核市平均 2.3倍増（中核市市長会調査 2025/1）'),
(null, null, 5.700, '中核市最悪事例', 'https://www.soumu.go.jp', 2025, '中核市最悪事例 5.7倍増')
ON CONFLICT DO NOTHING;
