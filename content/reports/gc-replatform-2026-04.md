---
slug: gc-replatform-2026-04
title: "【会員限定】GCASガイドReplatformノウハウ完全版：4クラウド対応の移行実務ガイド【2026年4月号】"
publishedAt: "2026-04-20"
---

## はじめに：今月の最重要アップデート

2026年4月20日、デジタル庁のGCASガイドに**Replatformノウハウシリーズ**が一斉公開されました。

AWS・Microsoft Azure・Google Cloud・OCIの4クラウド横断で、以下4カテゴリの技術ガイドが整備されたことを意味します。

| カテゴリ | 内容の核心 |
|---------|-----------|
| ① 運用のマネージドサービス化 | 夜間バッチ廃止・イベントドリブン化・監視Observability |
| ② 共有ストレージのオブジェクトストレージ化 | NFS/SAN → クラウドオブジェクトストレージへの移行 |
| ③ RDBのマネージドサービス化 | 自前DBエンジン → マネージドDBサービスへの移行 |
| ④ クラウドサービス活用 | アプリケーションのクラウドネイティブ化ノウハウ |

GCASガイドは従来「どのクラウドを使うか」の情報が中心でしたが、今回の追加で**「移行後のシステムをどう作るか」**という実務レベルまで踏み込んだ内容になりました。これは移行フェーズに入った自治体にとって、最も求めていた情報です。

---

## カテゴリ① 運用のマネージドサービス化

**「夜間バッチをなくす」がゴール**

オンプレミスシステムに長年根付いてきた**夜間バッチ処理**。GCASガイドはこれを「廃止・極小化」し、**イベントドリブン処理**に置き換えることを明確に推奨しています。

### なぜ夜間バッチは問題か

GCASガイドが挙げる夜間バッチの問題点：

- システムの停止（閉局）が必要になり、24時間稼働に支障
- 夜間の監視要員が必要
- バッチ失敗時のリカバリーが朝の開局までに間に合わない
- ジョブ間の複雑な依存関係がシステム全体の脆弱点になる

### AWSでの実装アプローチ

AWS編では、ジョブ管理を「オーケストレーター/スケジューラー」と「実行コンピュート」に分離して選択する考え方を示しています。

**スケジューラー推奨選択肢：**
- 単純なスケジュール実行 → **Amazon EventBridge Scheduler**
- ETLジョブ → **AWS Glue**
- 複雑なジョブ連携 → **AWS Step Functions**

**実行コンピュート推奨選択肢：**
- 軽量・短時間処理 → **AWS Lambda**（最優先）
- コンテナ化可能 → **Amazon ECS on Fargate**
- 長時間・大容量 → **Amazon ECS on EC2**

### 3つのイベントドリブンデザインパターン

GCASガイドはAWS編で以下の3パターンを具体的に解説しています。

| パターン | 概要 | 向いているケース |
|---------|------|----------------|
| **コレオグラフィ** | 各サービスが自律的にメッセージを処理（SNS+SQS+Lambda） | サービス間を疎結合にしたい場合 |
| **コマンドクエリ責任分離（CQRS）** | 更新と参照を完全分離（Kinesis+Lambda+DynamoDB/Aurora） | 高スループット・参照と更新の要件が異なる場合 |
| **イベントソーシング** | 状態変化をイベントとして永続化・再生可能 | 監査ログ・複数サービスへの状態同期が必要な場合 |

### 監視のObservability化

夜間バッチ廃止と同時に、**監視体制のObservability化**も必須要件として挙げています。

Observabilityの3要素：
- **メトリクス**：特定時刻のシステム状態を示す数値（CPU・メモリ・レイテンシ等）
- **ログ**：システム内イベントの記録
- **トレース**：複数サービスを横断した連鎖イベントの記録

AWSでの実装：CloudWatch Logs・CloudWatch Metrics・X-Ray、通知はSNS+ChatBot経由でSlack/メール。

**4クラウド対応ガイドリンク：**
- [AWS編](https://guide.gcas.cloud.go.jp/aws/technology-guides/know-how-replatform-migrate-operation-and-maintenance) / [Azure編](https://guide.gcas.cloud.go.jp/azure/know-how-replatform-migrate-operation-and-maintenance/) / [Google Cloud編](https://guide.gcas.cloud.go.jp/google-cloud/know-how-replatform-migrate-operation-and-maintenance/) / [OCI編](https://guide.gcas.cloud.go.jp/oci/know-how-replatform-migrate-operation-and-maintenance/)

---

## カテゴリ② 共有ストレージのオブジェクトストレージ化

**「共有ファイルサーバーを捨てる」**

オンプレミス環境でよく使われているNFSやSANなどの共有ストレージは、クラウド環境では**オブジェクトストレージへの移行**が推奨されます。

### オブジェクトストレージへの移行メリット

- コスト：使った分だけ課金・容量上限なし
- スケーラビリティ：ペタバイト規模まで自動拡張
- 可用性：クラウド側で冗長化を担保
- 保守不要：ハードウェア管理から解放

### 4クラウドの対応サービス

| クラウド | オブジェクトストレージ |
|---------|----------------------|
| AWS | **Amazon S3** |
| Azure | **Azure Blob Storage** |
| Google Cloud | **Cloud Storage** |
| OCI | **Oracle Object Storage** |

**4クラウド対応ガイドリンク：**
- [AWS編](https://guide.gcas.cloud.go.jp/aws/technology-guides/know-how-replatform-object-storage) / [Azure編](https://guide.gcas.cloud.go.jp/azure/know-how-replatform-object-storage/) / [Google Cloud編](https://guide.gcas.cloud.go.jp/google-cloud/know-how-replatform-object-storage/) / [OCI編](https://guide.gcas.cloud.go.jp/oci/know-how-replatform-object-storage/)

---

## カテゴリ③ RDBのマネージドサービス化

**「DBの運用から解放される」**

自前でMySQLやOracleを運用する場合、パッチ適用・バックアップ・フェイルオーバー設定など**DBOps**の負荷が大きくなります。マネージドDBサービスへの移行で、これらを自動化できます。

### 4クラウドのマネージドDB比較

| クラウド | 主なマネージドDB | 特徴 |
|---------|----------------|------|
| AWS | **Amazon RDS / Aurora** | MySQL/PostgreSQL/Oracle対応。Aurora は最大5倍の性能 |
| Azure | **Azure Database for MySQL/PostgreSQL** | Flexible Serverで柔軟なスケーリング |
| Google Cloud | **Cloud SQL / AlloyDB** | AlloyDBはPostgreSQL互換で高性能分析も可 |
| OCI | **Oracle Autonomous Database** | Oracleワークロードは移行コスト最小。RKKCS/GCCに採用 |

### 自治体システムへの示唆

多くの自治体標準化パッケージは**Oracle DBを前提**とした実装が多く、OCI移行時はライセンス費の大幅削減が見込めます（Bring Your Own License: BYOL対応）。AWSへの移行はPostgreSQL互換Auroraへの変換が推奨されますが、パッケージ側の対応確認が先決です。

**4クラウド対応ガイドリンク：**
- [AWS編](https://guide.gcas.cloud.go.jp/aws/technology-guides/know-how-replatform-migrate-db) / [Azure編](https://guide.gcas.cloud.go.jp/azure/know-how-replatform-migrate-db/) / [Google Cloud編](https://guide.gcas.cloud.go.jp/google-cloud/know-how-replatform-migrate-db/) / [OCI編](https://guide.gcas.cloud.go.jp/oci/know-how-replatform-migrate-db/)

---

## カテゴリ④ クラウドサービス活用（システム移行ノウハウ）

**「Lift & Shift から先へ」**

単純なVMのクラウドへの引っ越し（Lift & Shift = Rehost）では、クラウドのコスト最適化効果が限定的です。GCASガイドのReplatformカテゴリ④は、アプリケーション自体をクラウドのマネージドサービスに対応させる**段階的なクラウドネイティブ化**のノウハウを提供しています。

**4クラウド対応ガイドリンク：**
- [AWS編](https://guide.gcas.cloud.go.jp/aws/technology-guides/know-how-replatform-migrate-system) / [Azure編](https://guide.gcas.cloud.go.jp/azure/know-how-replatform-migrate-system/) / [Google Cloud編](https://guide.gcas.cloud.go.jp/google-cloud/know-how-replatform-migrate-system/) / [OCI編](https://guide.gcas.cloud.go.jp/oci/know-how-replatform-migrate-system/)

---

## 自治体担当者のためのReplatform優先度ガイド

GCASガイドの4カテゴリを自治体の実情に合わせて優先度付けするとこうなります。

| 優先度 | カテゴリ | 理由 |
|-------|---------|------|
| 🔴 最優先 | **RDBのマネージドサービス化** | パッケージのDB要件が明確。ベンダーに確認しやすく効果大 |
| 🟠 高 | **共有ストレージのオブジェクトストレージ化** | ファイル格納コストの削減効果が最も即効性が高い |
| 🟡 中 | **運用のマネージドサービス化** | 夜間バッチの廃止はアプリ側改修を伴うため中期計画で |
| 🟢 長期 | **クラウドサービス活用** | パッケージ依存が強い自治体は次世代更新タイミングで |

---

## まとめ：今すぐできる3つのアクション

1. **CSP担当者にGCASガイドReplatformシリーズを転送する** — 現在契約中のクラウドの該当ガイドをベンダーと共有し、次回定例に議題として挙げる
2. **RDB種別を棚卸しする** — 各業務システムが使っているDBエンジンを確認。Oracle前提ならOCI、PostgreSQL互換ならAWS/GCP/Azureが有力
3. **夜間バッチ一覧を作る** — 廃止・縮小の余地があるバッチを洗い出す。これがイベントドリブン化の出発点

---

## 次号予告（2026年5月号）

**「デジタル庁情報システム調達改革 自治体・ベンダーへの影響分析」**

第2回検討会の内容を踏まえ、調達プロセスのDX化が自治体のIT発注・ベンダー選定にどう影響するかを解説します。

---

出典：[GCASガイド テーマ別技術ガイド（AWS/Azure/Google Cloud/OCI 各Replatformシリーズ）](https://guide.gcas.cloud.go.jp/) — デジタル庁、2026年4月公開

ご意見・取材依頼：noreply@gcinsight.jp
