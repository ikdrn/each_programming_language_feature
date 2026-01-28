# テクノロジースタック比較・ベンチマーク

異なるプログラミング言語とフレームワークのテクノロジースタックの包括的な比較。このプロジェクトは、21個の異なるバックエンド実装と7個のフロントエンドフレームワークで同一のCRUD APIを実装し、完全なパフォーマンスベンチマークを備えています。

## プロジェクト構成

```
.
├── backend/                    # バックエンド実装（7言語 × 3フレームワーク）
│   ├── node/                   # Node.js（Vanilla, Express, Hono, NestJS）
│   ├── go/                     # Go（Vanilla, Gin, Echo）
│   ├── rust/                   # Rust（Vanilla, Axum, Actix-web）
│   ├── python/                 # Python（Vanilla, FastAPI, Django）
│   ├── php/                    # PHP（Vanilla, Laravel）
│   ├── java/                   # Java（Vanilla, Spring Boot）
│   └── ruby/                   # Ruby（Vanilla, Rails）
├── frontend/                   # フロントエンド実装（7フレームワーク）
│   ├── react/                  # React + Vite
│   ├── vue/                    # Vue.js 3 + Vite
│   ├── angular/                # Angular 17
│   ├── svelte/                 # Svelte + Vite
│   ├── solidjs/                # SolidJS + Vite
│   ├── nextjs/                 # Next.js 14
│   └── nuxt/                   # Nuxt 3
├── benchmark/                  # k6ロードテストスクリプト
├── docker-compose.yml          # すべてのサービスのオーケストレーション
└── database/                   # データベーススキーマ（PostgreSQL, MySQL, SQLite, MongoDB）
```

## バックエンド実装

### アーキテクチャ

各バックエンド実装は一貫した3層アーキテクチャに従います：

1. **データベースレイヤー**（`db.*`）：CRUD操作、トランザクション処理、パフォーマンス指標
2. **APIレイヤー**（`main.*`）：HTTPルーティングのみ
3. **コンテナ化**（`Dockerfile`）：言語固有のデプロイメント

### 実装操作

すべてのバックエンドは以下を実装します：

- **CRUD操作**：ユーザーの作成、読取、更新、削除
- **バッチ操作**：1000項目のトランザクションベンチマーク
- **パフォーマンス追跡**：操作タイミング（ミリ秒単位のmin/max/avg/total）
- **ヘルスチェック**：GET / エンドポイント

### APIエンドポイント

```
GET  /                    ヘルスチェック
GET  /users               すべてのユーザーを取得
POST /users               ユーザーを作成
GET  /users/:id           特定のユーザーを取得
PUT  /users/:id           ユーザーを更新
DELETE /users/:id         ユーザーを削除
POST /benchmark           1000項目のトランザクションベンチマークを実行
```

### ポート

| 言語 | フレームワーク | ポート | Docker | ネイティブ |
|------|---|------|--------|--------|
| Node.js | Vanilla | 3001 | ✓ | ✓ |
| Node.js | Express | 3002 | ✓ | ✓ |
| Node.js | Hono | 3003 | ✓ | ✓ |
| Go | Vanilla | 4001 | ✓ | ✓ |
| Go | Gin | 4002 | ✓ | ✓ |
| Go | Echo | 4003 | ✓ | ✓ |
| Rust | Vanilla | 5001 | ✓ | ✓ |
| Rust | Axum | 5002 | ✓ | ✓ |
| Rust | Actix-web | 5003 | ✓ | ✓ |
| Python | Vanilla | 6001 | ✓ | ✓ |
| Python | FastAPI | 6002 | ✓ | ✓ |
| Python | Django | 6003 | ✓ | ✓ |
| PHP | Vanilla | 7001 | ✓ | ✓ |
| PHP | Laravel | 7002 | ✓ | ✓ |
| Java | Vanilla | 8001 | ✓ | ✗ |
| Java | Spring Boot | 8002 | ✓ | ✗ |
| Ruby | Vanilla | 9001 | ✓ | ✓ |
| Ruby | Rails | 9002 | ✓ | ✓ |

## フロントエンド実装

バックエンド統合テスト用の軽量フロントエンドアプリケーション：

- **React** (18.2) + Vite
- **Vue.js** (3.3) + Vite
- **Angular** (17) スタンドアロンコンポーネント
- **Svelte** (4.2) + Vite
- **SolidJS** (1.8) + TypeScript
- **Next.js** (14) App Router
- **Nuxt** (3) Composition API

### 機能

すべてのフロントエンド実装に含まれるもの：

- ユーザーのCRUD操作
- ページネーション付きリスト表示
- リアルタイム更新
- ベンチマーク実行トリガー
- パフォーマンス指標表示

## クイックスタート

### 前提条件

- Docker と Docker Compose
- Node.js 18+（Dockerなしで実行する場合）
- Go 1.21+
- Rust 1.70+
- Python 3.11+
- PHP 8.2+
- Java 17+
- Ruby 3.2+
- k6（ベンチマーク用）

### Docker Composeで実行

```bash
# すべてのサービスを開始
docker-compose up -d

# ログを表示
docker-compose logs -f

# すべてのサービスを停止
docker-compose down
```

すべてのサービスはそれぞれのポート（3001-9002）で利用可能になります。

### 個別バックエンドサービスの実行

#### Node.js Vanilla
```bash
cd backend/node/vanilla
npm install
npm start
```

#### Python FastAPI
```bash
cd backend/python/fastapi
pip install -r requirements.txt
python main.py
```

#### Go Gin
```bash
cd backend/go/gin
go mod download
go run main.go db.go
```

#### Rust Axum
```bash
cd backend/rust/axum
cargo run
```

## ベンチマーク

### k6ロードテスト

```bash
# 比較ベンチマークを実行（各サービスで1000項目のトランザクション）
k6 run benchmark/comparison.js

# ロードテストを実行（ユーザー増加）
k6 run benchmark/load-test.js
```

### レスポンスフォーマット

すべてのエンドポイントは一貫したJSON構造を返します：

```json
{
  "success": true,
  "data": { ... },
  "count": 1,
  "performance": {
    "CREATE": {
      "count": 5,
      "totalMs": 2.345,
      "minMs": 0.423,
      "maxMs": 0.589,
      "avgMs": "0.469"
    }
  }
}
```

## パフォーマンス指標

### 追跡

操作は以下で追跡されます：
- **タイプ**：操作タイプ（CREATE、READ、UPDATE、DELETE、BENCHMARK）
- **継続時間**：実行時間（ミリ秒）
- **タイムスタンプ**：操作が発生した時刻

### 集約

パフォーマンスレポートには操作タイプごとに以下が含まれます：
- カウント：操作数
- 合計：すべての継続時間の合計
- 最小：最小継続時間
- 最大：最大継続時間
- 平均：平均継続時間

## 技術的決定

### データベース

- **SQLiteインメモリ**：軽量でポータブルなテスト用
- **トランザクショナルベンチマーク**：単一トランザクション内での1000項目INSERT
- **パフォーマンス測定**：ナノ秒精度をミリ秒に変換

### API設計

- **REST JSON API**：すべての実装で一貫したインターフェース
- **エラー処理**：標準HTTPステータスコード
- **CORS**：フロントエンド統合用に有効化
- **ポート割り当て**：言語ごとに重複しないポート範囲

### コンテナ化

- **マルチステージビルド**：イメージサイズを最適化
- **言語固有の最適化**：Alpine/slimベースイメージ
- **ヘルスチェック**：本番運用時のオプション

## 開発ガイドライン

### 新しい実装の追加

1. ディレクトリを作成：`backend/{language}/{framework}/`
2. 以下を実装するDatabaseクラスを持つ`db.*`ファイルを作成：
   - `create_user(name, email, age)`
   - `get_user(id)`
   - `get_all_users()`
   - `update_user(id, name, email, age)`
   - `delete_user(id)`
   - `benchmark(count)`
   - `get_performance_report()`
3. HTTPルーティングを含む`main.*`ファイルを作成
4. `Dockerfile`を作成
5. 設定ファイル（package.json、requirements.txtなど）を作成
6. docker-compose.ymlにエントリを追加

### データベースレイヤーコントラクト

```
class Database:
    def create_user(name, email, age) -> dict
    def get_user(id) -> dict | null
    def get_all_users() -> list[dict]
    def update_user(id, name, email, age) -> bool
    def delete_user(id) -> bool
    def benchmark(count) -> dict
    def get_performance_report() -> dict
```

## 貢献

各実装は以下を満たす必要があります：
- API仕様に厳密に従う
- 7つのエンドポイントをすべて実装
- 操作パフォーマンスを追跡
- 一貫したJSONレスポンスを返す
- Dockerfileを含める
- Docker Composeでデプロイ可能

## バージョン履歴

- **初版 (v1)**：データベーススキーマとNode.js Vanilla
- **2版 (v2)**：Node.js Express、Hono、NestJS
- **3版 (v3)**：Go Vanilla、Gin
- **4版 (v4)**：Go Echo、Rust Vanilla
- **5版 (v5)**：Rust Axum、Actix-web
- **6版 (v6)**：Python Vanilla、FastAPI、Django
- **7版 (v7)**：PHP Vanilla、Laravel
- **8版 (v8)**：Java Vanilla、Spring Boot
- **9版 (v9)**：Ruby Vanilla、Rails
- **10版 (v10)**：フロントエンド実装（React、Vue、Angular、Svelte、SolidJS、Next.js、Nuxt）
- **11版 (v11)**：Docker Composeオーケストレーション、k6ベンチマーク

## テスト

### 手動テスト

```bash
# ヘルスチェック
curl http://localhost:3001/

# ユーザー作成
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","age":30}'

# ユーザー取得
curl http://localhost:3001/users

# ベンチマーク実行
curl -X POST http://localhost:3001/benchmark \
  -H "Content-Type: application/json" \
  -d '{"count":1000}'
```

### 自動化テスト

すべての実装を同時にテスト可能：

```bash
k6 run benchmark/load-test.js
k6 run benchmark/comparison.js
```

## ライセンス

このプロジェクトは教育目的および比較目的です。

## 注記

- すべての実装はテスト用にインメモリSQLiteを使用します
- フロントエンド実装はAPI テスト用の簡略化されたUI
- パフォーマンス指標はリクエスト処理中に収集
- サービスは独立しており、個別に実行可能
