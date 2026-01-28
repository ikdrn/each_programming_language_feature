# テクノロジースタック ベンチマークスイート

異なるテクノロジースタック間のパフォーマンス比較用k6ロードテストスクリプト。

## 前提条件

- k6がシステムにインストールされていること
- すべてのバックエンドサービスが実行されていること（Docker Composeを使用）

## ベンチマークの実行

### すべてのサービスを開始

```bash
docker-compose up -d
```

### 比較ベンチマークを実行

このスクリプトは各サービスで単一のベンチマークテスト（1000項目のINSERT）を実行します：

```bash
k6 run benchmark/comparison.js
```

出力には各実装の実行時間（ミリ秒）とリクエスト/秒（RPS）が表示されます。

### ロードテストを実行

このスクリプトはすべてのサービス上で段階的なロードテストを実行します：

```bash
k6 run benchmark/load-test.js
```

このテストは30秒で10の同時ユーザーまで増加し、1.5分その負荷を維持してから減少します。

## 利用可能なテストエンドポイント

すべてのサービスは以下のエンドポイントを実装します：

- `GET /` - ヘルスチェック
- `GET /users` - すべてのユーザーを取得
- `POST /users` - ユーザーを作成
- `GET /users/:id` - 特定のユーザーを取得
- `PUT /users/:id` - ユーザーを更新
- `DELETE /users/:id` - ユーザーを削除
- `POST /benchmark` - ベンチマークを実行（デフォルト1000項目のINSERT）

## サービスとポート

### Node.js
- Vanilla: 3001
- Express: 3002
- Hono: 3003

### Go
- Vanilla: 4001
- Gin: 4002
- Echo: 4003

### Rust
- Vanilla: 5001
- Axum: 5002
- Actix-web: 5003

### Python
- Vanilla: 6001
- FastAPI: 6002
- Django: 6003

### PHP
- Vanilla: 7001
- Laravel: 7002

### Java
- Vanilla: 8001
- Spring Boot: 8002

### Ruby
- Vanilla: 9001
- Rails: 9002
