-- packages 初期データ（デジタル庁 経過措置対象パッケージ 207件）
INSERT INTO packages (vendor_id, package_name, business, exemption_number, confirmed_date) VALUES
  ((SELECT id FROM vendors WHERE name='株式会社アール・シー・エス' LIMIT 1), 'G-TrustⅢ', '障害者福祉', '022-0_9470001000472_1', '2025-04-24'),
  ((SELECT id FROM vendors WHERE name='北日本コンピューターサービス株式会社' LIMIT 1), '生活保護システム　ふれあい', '生活保護', '021_3410001000946_1', '2025-05-07'),
  ((SELECT id FROM vendors WHERE name='株式会社ジーシーシー' LIMIT 1), 'e-SUITEv2 for Government Cloud', '障害者福祉', '022-0_8070001001545_1', '2025-05-30'),
  ((SELECT id FROM vendors WHERE name='株式会社ジーシーシー' LIMIT 1), 'e-SUITEv2 for Government Cloud', '障害者福祉', '022-4_8070001001545_1', '2025-05-30'),
  ((SELECT id FROM vendors WHERE name='株式会社ＩＪＣ' LIMIT 1), '総合福祉システムあゆむくん', '障害者福祉', '022-0_7500001011195_1', '2025-05-30'),
  ((SELECT id FROM vendors WHERE name='株式会社熊本計算センター' LIMIT 1), 'KKCWEL+(うぇるたす)', '障害者福祉', '022-0_8330001001378_1', '2025-05-30'),
  ((SELECT id FROM vendors WHERE name='株式会社法研' LIMIT 1), '生活保護版レセプト情報管理システム', 'レセプト管理（生活保護）', '035_7010001057148_1', '2025-06-10'),
  ((SELECT id FROM vendors WHERE name='株式会社エービッツ' LIMIT 1), 'A-LEAP健康', '健康管理', '019-0_4420001000102_1', '2025-06-10'),
  ((SELECT id FROM vendors WHERE name='株式会社ＲＫＫＣＳ' LIMIT 1), '総合行政システム', '健康管理', '019-0_2330001000063_1', '2025-06-10'),
  ((SELECT id FROM vendors WHERE name='株式会社ＮＴＴデータ関西' LIMIT 1), '政令市版住記印鑑標準準拠システム（仮称）', '住民基本台帳', '001_4120001054120_1', '2025-06-10'),
  ((SELECT id FROM vendors WHERE name='株式会社ＮＴＴデータ関西' LIMIT 1), '政令市版住記印鑑標準準拠システム（仮称）', '印鑑登録', '002_4120001054120_1', '2025-06-10'),
  ((SELECT id FROM vendors WHERE name='株式会社九州電算' LIMIT 1), 'AcrocityPLUS就学援助システム', '就学援助', '018_9340001001442_1', '2025-06-10'),
  ((SELECT id FROM vendors WHERE name='富士フイルムシステムサービス株式会社' LIMIT 1), '戸籍総合システム・ブックレス', '戸籍の附票', '004_2011401007325_1', '2025-06-11'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '人口動態調査', '038_6010701025710_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '火葬等許可', '039_6010701025710_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社アイネス' LIMIT 1), 'WebRings', '健康管理', '019-0_2020001030067_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社アイネス' LIMIT 1), 'WebRings', '障害者福祉', '022-0_2020001030067_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '介護保険', '023-0_9050001022914_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '介護保険', '023-0_9040001066012_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社リーディングシステム' LIMIT 1), 'Apple''s行政システム', '学齢簿編製', '017_2420001006753_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社リーディングシステム' LIMIT 1), 'Apple''s行政システム', '就学援助', '018_2420001006753_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社内田洋行' LIMIT 1), '就学事務システム', '学齢簿編製', '017_1010001034730_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '学齢簿編製', '017_9050001022914_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '就学援助', '018_9050001022914_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '学齢簿編製', '017_9040001066012_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '就学援助', '018_9040001066012_1', '2025-06-20'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '戸籍', '003_6010701025710_2
(旧：003_6010701025710_1)', '2025/9/25
(旧：2025/6/20)'),
  ((SELECT id FROM vendors WHERE name='株式会社アイティフォー' LIMIT 1), '就学援助システム', '就学援助', '018_3010001022865_1', '2025-06-25'),
  ((SELECT id FROM vendors WHERE name='株式会社アイネス' LIMIT 1), 'WebRings', '児童扶養手当', '020_2020001030067_1', '2025-06-26'),
  ((SELECT id FROM vendors WHERE name='株式会社熊本計算センター' LIMIT 1), 'KKCWEL+(うぇるたす)', '児童扶養手当', '020_8330001001378_1', '2025-06-26'),
  ((SELECT id FROM vendors WHERE name='株式会社熊本計算センター' LIMIT 1), 'KKCWEL+(うぇるたす)', '生活保護', '021_8330001001378_2
(旧：021_8330001001378_1)', '2025/9/17
(旧：2025/6/26)'),
  ((SELECT id FROM vendors WHERE name='株式会社アイネス' LIMIT 1), 'WebRings', '生活保護', '021_2020001030067_1', '2025-06-26'),
  ((SELECT id FROM vendors WHERE name='株式会社アール・シー・エス' LIMIT 1), 'G-TrustⅢ', '児童扶養手当', '020_9470001000472_1', '2025-06-27'),
  ((SELECT id FROM vendors WHERE name='株式会社内田洋行' LIMIT 1), '福祉総合システム', '児童扶養手当', '020_1010001034730_1', '2025-06-27'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '児童扶養手当', '020_9050001022914_1', '2025-06-27'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '児童扶養手当', '020_9040001066012_1', '2025-06-27'),
  ((SELECT id FROM vendors WHERE name='株式会社南日本情報処理センター' LIMIT 1), 'e-AFFECT', '健康管理', '019-0_7340001004265_2
(旧：019-0_7340001004265_1)', '2025/10/2
(旧：2025/6/27)'),
  ((SELECT id FROM vendors WHERE name='株式会社両備システムズ' LIMIT 1), '健康かるてＶ８', '健康管理', '019-0_8260001007077_2
(旧：019-0_8260001007077_1)', '2025/9/19
(旧：2025/6/27)'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '児童扶養手当', '020_5060001002844_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'GPRIME福祉総合システム', '児童扶養手当', '020_7010401022916_2
(旧：020_7010401022916_1)', '2025/9/18
(旧：2025/6/30)'),
  ((SELECT id FROM vendors WHERE name='日本コンピューター株式会社' LIMIT 1), 'WEL-MOTHER', '健康管理', '019-1_2290801002908_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='四国情報管理センター株式会社' LIMIT 1), 'LOGHEALTH', '健康管理', '019-0_6490001001232_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社両毛システムズ' LIMIT 1), 'Civic-station戸籍情報総合システム', '人口動態調査', '038_2070001016771_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '介護保険', '023-0_6010701025710_2
(旧：023-0_6010701025710_1)', '2025/9/16
(旧：2025/6/30)'),
  ((SELECT id FROM vendors WHERE name='株式会社両毛システムズ' LIMIT 1), 'Civic-station戸籍情報総合システム', '火葬等許可', '039_2070001016771_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社ニック' LIMIT 1), '障害者福祉管理システム(標準化対応版)', '障害者福祉', '022-0_6290001041026_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社ニック' LIMIT 1), '障害者福祉管理システム(標準化対応版)', '障害者福祉', '022-1_6290001041026_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MCWEL', '障害者福祉', '022-0_5010001006767_2
(旧：022-0_5010001006767_1)', '2025/9/17
(旧：2025/6/30)'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MCWEL', '障害者福祉', '022-1_5010001006767_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MCWEL', '障害者福祉', '022-2_5010001006767_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MCWEL', '障害者福祉', '022-4_5010001006767_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '国民年金', '026_5010001006767_2
(旧：026_5010001006767_1)', '2025/9/24
(旧：2025/6/30)'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono住民情報', '国民年金', '026_1012801000382_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '国民年金', '026_5060001002844_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '健康管理', '019-0_5060001002844_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '国民年金', '026_6700150026495_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社日情システムソリューションズ' LIMIT 1), '健康管理システム　健康つばさ', '健康管理', '019-0_3390001006640_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社BCC' LIMIT 1), 'G-AFFECT', '健康管理', '019-0_3290001005603_2
(旧：019-0_3290001005603_1)', '2025/10/2
(旧：2025/6/30)'),
  ((SELECT id FROM vendors WHERE name='株式会社BCC' LIMIT 1), '生活保護システム　GOVLIPLAS', '生活保護', '021_3290001005603_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'GPRIME福祉総合システム', '障害者福祉', '022-4_7010401022916_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '国民年金', '026_7010401022916_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社両毛システムズ' LIMIT 1), 'Civic-station戸籍情報総合システム', '戸籍の附票', '004_2070001016771_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '印鑑登録', '002_5010001006767_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono住民情報', '住民基本台帳', '001_1012801000382_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社日立ソリューションズ西日本' LIMIT 1), 'ADWORLD就学事務システム', '就学援助', '018_9240001009850_2
(旧：018_9240001009850_1)', '2025/9/19
(旧：2025/6/30)'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '就学援助', '018_6700150026495_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社両毛システムズ' LIMIT 1), 'Civic-station戸籍情報総合システム', '戸籍', '003_2070001016771_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社ＩＪＣ' LIMIT 1), '総合福祉システムあゆむくん', '生活保護', '021_7500001011195_1', '2025-06-30'),
  ((SELECT id FROM vendors WHERE name='株式会社アイネス' LIMIT 1), 'WebRings', '児童手当', '027_2020001030067_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='株式会社熊本計算センター' LIMIT 1), 'KKCWEL+(うぇるたす)', '児童手当', '027_8330001001378_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '児童手当', '027_6700150026495_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '児童手当', '027_9050001022914_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '児童手当', '027_9040001066012_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='Gcomホールディングス株式会社' LIMIT 1), 'Acrocity', '児童手当', '027_8290001040100_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '申請管理', '029_5060001002844_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '選挙（共通）', '005_6700150026495_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '期日前・不在者投票管理', '007_6700150026495_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '選挙（共通）', '005_7010401022916_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '選挙人名簿管理', '006_7010401022916_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '期日前・不在者投票管理', '007_7010401022916_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '就学援助', '018_5010001006767_1', '2025-07-01'),
  ((SELECT id FROM vendors WHERE name='株式会社ピーズカンパニー' LIMIT 1), '子ども子育て支援システムさくら３', '子ども・子育て支援', '028_6020001041770_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='株式会社アイネス' LIMIT 1), 'WebRings', '子ども・子育て支援', '028_2020001030067_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '子ども・子育て支援', '028_6700150026495_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '子ども・子育て支援', '028_9050001022914_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '子ども・子育て支援', '028_9040001066012_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='株式会社ジーシーシー' LIMIT 1), 'e-SUITEv2 for Government Cloud', '障害者福祉', '022-1_8070001001545_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='中央コンピューターサービス株式会社' LIMIT 1), 'Web-TAWN', '住民基本台帳', '001_5462501000147_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='中央コンピューターサービス株式会社' LIMIT 1), 'Web-TAWN', '選挙人名簿管理', '006_5462501000147_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='中央コンピューターサービス株式会社' LIMIT 1), 'Web-TAWN', '期日前・不在者投票管理', '007_5462501000147_1', '2025-07-04'),
  ((SELECT id FROM vendors WHERE name='株式会社熊本計算センター' LIMIT 1), 'KKCWEL+(うぇるたす)', '子ども・子育て支援', '028_8330001001378_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='株式会社内田洋行' LIMIT 1), '福祉総合システム', '児童手当', '027_1010001034730_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '子ども・子育て支援', '028_5060001002844_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='株式会社内田洋行' LIMIT 1), '福祉総合システム', '子ども・子育て支援', '028_1010001034730_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '児童手当', '027_7010401022916_2', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '子ども・子育て支援', '028_7010401022916_3
(旧：028_7010401022916_2)', '2025/9/18
(旧：2025/7/11)'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'GPRIME福祉総合システム', '障害者福祉', '022-0_7010401022916_2
(旧：022-0_7010401022916_1)', '2025/9/19
(旧：2025/7/11)'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'RezeptPlus', 'レセプト管理（生活保護）', '035_5010001006767_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '介護保険', '023-0_6700150026495_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '住民基本台帳', '001_5060001002844_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='NTT西日本株式会社／日本電気株式会社
(旧：西日本電信電話株式会社／日本電気株式会社)' LIMIT 1), '改製除票システム', '住民基本台帳', '001_7120001077523／7010401022916_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '印鑑登録', '002_5060001002844_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='Gcomホールディングス株式会社' LIMIT 1), 'Acrocity', '選挙（共通）', '005_8290001040100_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='Gcomホールディングス株式会社' LIMIT 1), 'Acrocity', '選挙人名簿管理', '006_8290001040100_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '住民基本台帳', '001_5010001006767_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '就学援助', '018_7010401022916_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='株式会社ワイイーシーソリューションズ' LIMIT 1), 'Seagull-LCすくすく就学援助', '就学援助', '018_9020001029549_1', '2025-07-11'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '学齢簿編製', '017_5010001006767_2
(旧：017_5010001006767_1)', '2025/9/24
(旧：2025/7/11)'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '児童手当', '027_5060001002844_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '団体内統合宛名', '032_5060001002844_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '介護保険', '023-0_5060001002844_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '介護保険', '023-0_7010401022916_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono住民情報', '印鑑登録', '002_1012801000382_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '選挙人名簿管理', '006_6700150026495_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '選挙人名簿管理', '006_9050001022914_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '選挙人名簿管理', '006_9040001066012_1', '2025-07-14'),
  ((SELECT id FROM vendors WHERE name='中央コンピューターサービス株式会社' LIMIT 1), 'Web-TAWN', '児童扶養手当', '020_5462501000147_1', '2025-07-16'),
  ((SELECT id FROM vendors WHERE name='株式会社アイティフォー' LIMIT 1), '学齢簿システム', '学齢簿編製', '017_3010001022865_1', '2025-07-16'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '就学援助', '018_5060001002844_1', '2025-07-16'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '後期高齢者医療', '025_5060001002844_1', '2025-07-17'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '後期高齢者医療', '025_6010701025710_2
(旧：025_6010701025710_1)', '2025/9/19
(旧：2025/7/17)'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), '生活保護システム', '生活保護', '021_5010001006767_1', '2025-07-25'),
  ((SELECT id FROM vendors WHERE name='株式会社アイネス' LIMIT 1), 'WebRings', '後期高齢者医療', '025_2020001030067_1', '2025-07-25'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '国民健康保険', '024_5060001002844_1', '2025-07-25'),
  ((SELECT id FROM vendors WHERE name='株式会社ワイイーシーソリューションズ' LIMIT 1), 'Seagull-LCすくすく学齢簿編製', '学齢簿編製', '017_9020001029549_1', '2025-07-25'),
  ((SELECT id FROM vendors WHERE name='株式会社日立ソリューションズ西日本' LIMIT 1), 'ADWORLD就学事務システム', '学齢簿編製', '017_9240001009850_2
(旧：017_9240001009850_1)', '2025/10/3
(旧：2025/7/25)'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MCWEL', '介護保険', '023-0_5010001006767_2
(旧：023-0_5010001006767_1)', '2025/10/7
(旧：2025/7/31)'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MCWEL', '介護保険', '023-1_5010001006767_1', '2025-07-31'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '学齢簿編製', '017_5060001002844_1', '2025-07-31'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'GPRIME福祉総合システム', '児童手当', '027_7010401022916_3
(旧：027_7010401022916_1)', '2025/9/30
(旧：2025/8/4)'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'GPRIME福祉総合システム', '子ども・子育て支援', '028_7010401022916_4
(旧：028_7010401022916_1)', '2025/9/18
(旧：2025/8/4)'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET番号連携サーバ', '団体内統合宛名', '032_5010001006767_1', '2025-08-08'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET番号連携サーバ', '団体内統合宛名', '032_5010001006767_2', '2025-08-08'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '後期高齢者医療', '025_6700150026495_1', '2025-08-08'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '国民健康保険', '024_6700150026495_1', '2025-08-08'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '学齢簿編製', '017_7010401022916_1', '2025-08-08'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '後期高齢者医療', '025_7010401022916_1', '2025-08-15'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '国民健康保険', '024_7010401022916_1', '2025-08-15'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '国民健康保険', '024_7010401022916_3
(旧：024_7010401022916_2)', '2025/9/29
(旧：2025/8/15)'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MCWEL', '後期高齢者医療', '025_5010001006767_2
(旧：025_5010001006767_1)', '2025/9/24
(旧：2025/8/19)'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '後期高齢者医療', '025_7010401022916_3
(旧：025_7010401022916_2)', '2025/9/29
(旧：2025/8/19)'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '当日投票管理', '008_5060001002844_1', '2025-08-22'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '学齢簿編製', '017_6700150026495_1', '2025-08-28'),
  ((SELECT id FROM vendors WHERE name='Gcomホールディングス株式会社' LIMIT 1), 'Acrocity', '後期高齢者医療', '025_8290001040100_1', '2025-09-03'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono選挙', '選挙（共通）', '005_1012801000382_1', '2025-09-03'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '選挙人名簿管理', '006_7010401022916_3
(旧：006_7010401022916_2)', '2025/9/29
(旧：2025/9/4)'),
  ((SELECT id FROM vendors WHERE name='株式会社ディー・エス・ケイ' LIMIT 1), 'ＤＳＫ行政情報システム', '個人住民税', '010_9040001066012_1', '2025-09-12'),
  ((SELECT id FROM vendors WHERE name='株式会社茨城計算センター' LIMIT 1), 'ＩＡＣ行政情報システム', '個人住民税', '010_9050001022914_1', '2025-09-12'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '軽自動車税', '013_5060001002844_1', '2025-09-12'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '法人住民税', '011_5010001006767_2
(旧：011_5010001006767_1)', '2025/10/15
(旧：2025/9/12)'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono住民情報', '法人住民税', '011_1012801000382_1', '2025-09-12'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'RJ', '介護保険', '023-1_7010401022916_1', '2025-09-16'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '子ども・子育て支援', '028_6010701025710_1', '2025-09-16'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono選挙for期日前・不在者投票管理システム', '期日前・不在者投票管理', '007_1012801000382_1', '2025-09-17'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '選挙人名簿管理', '006_5060001002844_1', '2025-09-17'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '期日前・不在者投票管理', '007_5060001002844_1', '2025-09-17'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '統合滞納管理', '037_5010001006767_1', '2025-09-17'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '選挙（共通）', '005_5060001002844_1', '2025-09-18'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'GPRIME保健総合システム', '健康管理', '019-0_7010401022916_1', '2025-09-19'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono選挙for当日投票管理システム', '当日投票管理', '008_1012801000382_1', '2025-09-24'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono選挙for在外選挙管理システム', '在外選挙管理', '009_1012801000382_1', '2025-09-24'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono選挙for名簿管理システム', '選挙人名簿管理', '006_1012801000382_1', '2025-09-24'),
  ((SELECT id FROM vendors WHERE name='株式会社ジーシーシー' LIMIT 1), 'e-SUITEv2 for Government Cloud', '統合収納管理', '036_8070001001545_1', '2025-09-26'),
  ((SELECT id FROM vendors WHERE name='株式会社ＲＫＫＣＳ' LIMIT 1), '総合行政システム', '固定資産税', '012_2330001000063_1', '2025-09-26'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '固定資産税', '012_5060001002844_1', '2025-09-26'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '地方税（共通）', '016_5060001002844_1', '2025-09-26'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono住民情報', '固定資産税', '012_1012801000382_1', '2025-09-26'),
  ((SELECT id FROM vendors WHERE name='Gcomホールディングス株式会社' LIMIT 1), 'Acrocity', '固定資産税', '012_8290001040100_1', '2025-09-26'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '国民年金', '026_7010401022916_2', '2025-09-29'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '固定資産税', 'ー', 'ー'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '住民基本台帳', '001_6010701025710_1', '2025-09-30'),
  ((SELECT id FROM vendors WHERE name='株式会社日立ソリューションズ西日本' LIMIT 1), 'ADWORLD就学事務システム', '庁内データ連携', '030_9240001009850_2', '2025-09-30'),
  ((SELECT id FROM vendors WHERE name='株式会社日立ソリューションズ西日本' LIMIT 1), 'ADWORLD就学事務システム', 'EUC', '034_9240001009850_1', '2025-09-30'),
  ((SELECT id FROM vendors WHERE name='株式会社リードコナン' LIMIT 1), '税務LAN 法人住民税システム', '法人住民税', '011_2400001001748_1', '2025-09-30'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '住民基本台帳', '001_7010401022916_2', '2025-09-30'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '印鑑登録', '002_7010401022916_1', '2025-09-30'),
  ((SELECT id FROM vendors WHERE name='株式会社東北電子計算センター' LIMIT 1), 'ADWORLD 介護保険認定審査会支援システム', '介護保険', '023-1_7370001006432_1', '2025-10-03'),
  ((SELECT id FROM vendors WHERE name='株式会社リードコナン' LIMIT 1), '税務LAN 法人住民税システム', '収納管理（税務システム）', '014_2400001001748_1', '2025-10-03'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '個人住民税', '010_7010401022916_1', '2025-10-03'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '個人住民税', '010_5060001002844_1', '2025-10-06'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '個人住民税', '010_6010701025710_1', '2025-10-06'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '個人住民税', '010_6700150026495_1', '2025-10-06'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono住民情報', '軽自動車税', '013_1012801000382_1', '2025-10-06'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '軽自動車税', '013_6010701025710_1', '2025-10-06'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '介護保険', '023-0_7010401022916_2', '2025-10-07'),
  ((SELECT id FROM vendors WHERE name='株式会社リードコナン' LIMIT 1), '税務LAN 法人住民税システム', '地方税（共通）', '016_2400001001748_1', '2025-10-07'),
  ((SELECT id FROM vendors WHERE name='Gcomホールディングス株式会社' LIMIT 1), 'Acrocity', '地方税（共通）', '016_8290001040100_1', '2025-10-07'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '個人住民税', '010_7010401022916_2', '2025-10-07'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '地方税（共通）', '016_7010401022916_2', '2025-10-07'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '固定資産税', '012_6700150026495_1', '2025-10-14'),
  ((SELECT id FROM vendors WHERE name='株式会社日立システムズ' LIMIT 1), 'ADWORLD', '固定資産税', '012_6010701025710_1', '2025-10-14'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '収納管理（税務システム）', '014_7010401022916_1', '2025-10-14'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '滞納管理（税務システム）', '015_7010401022916_1', '2025-10-14'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '収納管理（税務システム）', '014_5010001006767_1', '2025-10-15'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '個人住民税', '010_5010001006767_1', '2025-10-15'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '固定資産税', '012_5010001006767_1', '2025-10-15'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '軽自動車税', '013_5010001006767_1', '2025-10-15'),
  ((SELECT id FROM vendors WHERE name='富士通Japan株式会社' LIMIT 1), 'MICJET', '地方税（共通）', '016_5010001006767_1', '2025-10-17'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '固定資産税', '012_7010401022916_1', '2025-10-17'),
  ((SELECT id FROM vendors WHERE name='株式会社アイティフォー' LIMIT 1), '滞納管理システム', '統合滞納管理', '037_3010001022865_1', '2025-10-23'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '統合収納管理', '036_5060001002844_1', '2025-10-27'),
  ((SELECT id FROM vendors WHERE name='京都府自治体情報化推進協議会' LIMIT 1), 'TRY-X4', '統合収納管理', '036_6700150026495_1', '2025-10-27'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-R for Gov-Cloud', '統合収納管理', '036_7010401022916_1', '2025-10-27'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '統合収納管理', '036_7010401022916_2', '2025-10-27'),
  ((SELECT id FROM vendors WHERE name='日本電気株式会社' LIMIT 1), 'COKAS-i', '統合滞納管理', '037_7010401022916_1', '2025-10-27'),
  ((SELECT id FROM vendors WHERE name='株式会社ＴＫＣ' LIMIT 1), 'ＴＡＳＫクラウドシステム', '統合滞納管理', '037_5060001002844_1', '2025-10-29'),
  ((SELECT id FROM vendors WHERE name='行政システム株式会社' LIMIT 1), 'Probono住民情報', '統合収納管理', '036_1012801000382_1', '2025-10-29')
ON CONFLICT DO NOTHING;