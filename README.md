# 技術スタック比較 & ベンチマークスイート

各プログラミング言語、フレームワーク、データベースの技術スタック比較とベンチマーク計測スイート。

**言語層・フレームワーク層・DB層を完全に分離**し、実行速度の詳細な計測とトランザクション処理の実装を行います。

## プロジェクト構造

```
.
├── backend/
│   ├── nodejs/
│   │   ├── language/                  # Node.js言語層
│   │   │   └── core.js               # CRUD基本実装
│   │   ├── db/                        # DB層
│   │   │   ├── postgres.js           # PostgreSQL実装
│   │   │   ├── mongodb.js            # MongoDB実装
│   │   │   └── redis.js              # Redis実装
│   │   ├── express-fw/                # Express フレームワーク層
│   │   │   ├── server.js
│   │   │   └── index.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── go/
│   │   ├── language/
│   │   │   └── core.go                # Go言語層
│   │   ├── db/
│   │   │   ├── postgres.go            # PostgreSQL実装
│   │   │   └── (mongodb.go, redis.go) # 他DB実装予定
│   │   ├── gin-fw/
│   │   │   └── main.go                # Gin フレームワーク層
│   │   ├── go.mod
│   │   └── Dockerfile
│   │
│   ├── python/
│   │   ├── language/
│   │   │   └── core.py                # Python言語層
│   │   ├── db/
│   │   │   ├── postgres.py            # PostgreSQL実装
│   │   │   └── (mongodb.py, redis.py) # 他DB実装予定
│   │   ├── fastapi-fw/
│   │   │   ├── server.py              # FastAPI フレームワーク層
│   │   │   └── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── (MySQL, MariaDB 等の拡張対応可能)
│
├── docker-compose.yml                 # Docker Compose設定
└── README.md                          # このファイル
```

## 技術スタック

### バックエンド言語
- **Node.js** (20)
- **Go** (1.21)
- **Python** (3.11)

### フレームワーク
- **Express.js** (Node.js用)
- **Gin** (Go用)
- **FastAPI** (Python用)

### データベース
- **PostgreSQL** (16) - RDBMS
- **MongoDB** (7.0) - NoSQL Document DB
- **Redis** (7.2) - In-Memory Cache

## 特徴

### 1. 層の分離
```
言語層     → 基本的なCRUD操作、ユーティリティ機能
   ↓
DB層      → トランザクション処理、パフォーマンス計測
   ↓
FW層      → REST APIエンドポイント
```

### 2. トランザクション処理
- PostgreSQL: BEGIN COMMIT ROLLBACK ロジック
- MongoDB: マルチドキュメント トランザクション風処理
- Redis: MULTI EXEC DISCARD ロジック

### 3. パフォーマンス計測
各操作の実行時間を**ナノ秒精度**で計測し、以下を提供:
- 最小実行時間 (minMs)
- 最大実行時間 (maxMs)
- 平均実行時間 (avgMs)
- 実行回数 (count)
- 総実行時間 (totalMs)

### 4. CRUD操作
各DBに対応した CRUD操作を実装:
- **CREATE** (INSERT / insertOne / insertMany)
- **READ** (SELECT / find / GET)
- **UPDATE** (UPDATE / updateOne / SET)
- **DELETE** (DELETE / deleteOne / DEL)

## クイックスタート

### 前提条件
- Docker & Docker Compose がインストール済み
- ポート 3001, 3002, 3003, 5432, 27017, 6379 が利用可能

### サービス起動

```bash
# 全サービスをビルド・起動
docker-compose up -d

# サービスステータス確認
docker-compose ps

# ログを表示
docker-compose logs -f
```

### APIエンドポイント テスト

#### Node.js + Express (ポート 3001)
```bash
# ヘルスチェック
curl http://localhost:3001

# PostgreSQL - INSERT
curl -X POST http://localhost:3001/postgres/insert \
  -H "Content-Type: application/json" \
  -d '{
    "name": "田中 太郎",
    "email": "tanaka@example.com",
    "age": 30
  }'

# PostgreSQL - SELECT
curl http://localhost:3001/postgres/select/1

# PostgreSQL - SELECT ALL
curl http://localhost:3001/postgres/selectall

# PostgreSQL - UPDATE
curl -X PUT http://localhost:3001/postgres/update/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "田中 次郎",
    "email": "tanaka2@example.com",
    "age": 31
  }'

# PostgreSQL - DELETE
curl -X DELETE http://localhost:3001/postgres/delete/1
```

#### Go + Gin (ポート 3002)
```bash
# ヘルスチェック
curl http://localhost:3002

# PostgreSQL - INSERT
curl -X POST http://localhost:3002/postgres/insert \
  -H "Content-Type: application/json" \
  -d '{
    "name": "山田 太郎",
    "email": "yamada@example.com",
    "age": 25
  }'

# その他のエンドポイントは Node.js と同じ
```

#### Python + FastAPI (ポート 3003)
```bash
# ヘルスチェック
curl http://localhost:3003

# Swagger UI で API 確認
# http://localhost:3003/docs

# PostgreSQL - INSERT
curl -X POST http://localhost:3003/postgres/insert \
  -H "Content-Type: application/json" \
  -d '{
    "name": "佐藤 太郎",
    "email": "sato@example.com",
    "age": 28
  }'
```

### サービス停止

```bash
docker-compose down
```

## レスポンス例

### 成功時
```json
{
  "success": true,
  "message": "PostgreSQL - INSERT成功",
  "data": {
    "id": 1,
    "name": "田中 太郎",
    "email": "tanaka@example.com",
    "age": 30,
    "createdAt": "2025-01-28T10:30:45.123456",
    "updatedAt": null
  },
  "performance": {
    "INSERT": {
      "count": 1,
      "totalMs": 0.456,
      "minMs": 0.456,
      "maxMs": 0.456,
      "avgMs": 0.456
    }
  },
  "transactions": {
    "totalTransactions": 1,
    "committedTransactions": 1,
    "rolledBackTransactions": 0,
    "transactions": [
      {
        "id": 1642051845123,
        "status": "COMMIT",
        "duration": 1.234
      }
    ]
  }
}
```

## パフォーマンス計測の見方

### performance フィールド
各DB操作の実行時間統計:

```json
"performance": {
  "INSERT": {
    "count": 10,          // 実行回数
    "totalMs": 4.567,     // 総実行時間(ms)
    "minMs": 0.123,       // 最小実行時間
    "maxMs": 0.789,       // 最大実行時間
    "avgMs": 0.457        // 平均実行時間
  }
}
```

### transactions フィールド
トランザクション処理の統計:

```json
"transactions": {
  "totalTransactions": 10,        // 総トランザクション数
  "committedTransactions": 9,     // コミット成功数
  "rolledBackTransactions": 1,    // ロールバック数
  "transactions": [
    {
      "id": 1642051845123,
      "status": "COMMIT",         // "COMMIT" または "ROLLBACK"
      "duration": 1.234           // トランザクション処理時間(ms)
    }
  ]
}
```

## 実装例: バッチ挿入でのパフォーマンス比較

```bash
# Node.js
curl -X POST http://localhost:3001/postgres/batch-insert \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"name": "ユーザー1", "email": "user1@example.com", "age": 20},
      {"name": "ユーザー2", "email": "user2@example.com", "age": 21},
      ...
    ]
  }'

# Go
curl -X POST http://localhost:3002/postgres/batch-insert \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"name": "ユーザー1", "email": "user1@example.com", "age": 20},
      ...
    ]
  }'

# Python
curl -X POST http://localhost:3003/postgres/batch-insert \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {"name": "ユーザー1", "email": "user1@example.com", "age": 20},
      ...
    ]
  }'
```

各レスポンスの `performance` と `transactions` フィールドを比較して、実行速度を計測できます。

## データベース接続情報

### PostgreSQL
- ホスト: localhost:5432
- ユーザー: benchuser
- パスワード: benchpass
- データベース: benchmark_db

```bash
psql -h localhost -U benchuser -d benchmark_db
```

### MongoDB
- ホスト: localhost:27017
- ユーザー: benchuser
- パスワード: benchpass

```bash
mongosh "mongodb://benchuser:benchpass@localhost:27017"
```

### Redis
- ホスト: localhost:6379

```bash
redis-cli -h localhost
```

## 今後の拡張予定

- [ ] MongoDB, Redis の DB層実装（Node.js, Go, Python）
- [ ] MySQL/MariaDB 対応
- [ ] GraphQL エンドポイント
- [ ] gRPC 実装
- [ ] キャッシュ戦略のベンチマーク
- [ ] 複雑なクエリのパフォーマンス比較
- [ ] 負荷テスト（k6）スクリプト

## ライセンス

MIT License

## 備考

各層は独立しており、組み合わせを変更することで様々なパターンでベンチマークが可能です。

**例:**
- Node.js言語層 + PostgreSQL DB層 + FastAPI フレームワーク層
- Go言語層 + Redis DB層 + Express フレームワーク層

など、柔軟に組み合わせできます。
