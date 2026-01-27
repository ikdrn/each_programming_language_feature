# 技術スタック比較 & ベンチマークスイート

フロントエンドフレームワーク、バックエンド言語・フレームワーク、データベースなど、最新のWeb開発技術を包括的に比較・ベンチマークするスイートです。

## 概要

このプロジェクトは以下を提供します:
- **コードサンプル** (React, Vue.js, Svelte, Node.js, Go, Python, Express, Gin, FastAPI)
- **Docker Compose セットアップ** で簡単にテスト・比較可能
- **k6 による負荷テストスクリプト** でパフォーマンスベンチマーク実施
- **詳細な比較資料** (COMPARISON.md)

## プロジェクト構造

```
.
├── frontend/
│   ├── react/              # Reactサンプル (Hello World + API呼び出し)
│   ├── vue/                # Vue.jsサンプル
│   └── svelte/             # Svelteサンプル
├── backend/
│   ├── node-express/       # Node.js + Express API
│   ├── go-gin/             # Go + Gin API
│   └── python-fastapi/     # Python + FastAPI
├── k6/
│   └── load-test.js        # 負荷テストスクリプト
├── docker-compose.yml      # Docker Compose設定
├── COMPARISON.md           # 技術比較資料
└── README.md               # このファイル
```

## クイックスタート

### 前提条件
- Docker と Docker Compose がインストール済み
- k6 (オプション、ローカルテスト用)

### サービスの起動

```bash
# 全サービスをビルド・起動
docker-compose up -d

# サービスステータス確認
docker-compose ps

# ログを表示
docker-compose logs -f

# エンドポイントをテスト
curl http://localhost:3001/api/hello  # Node.js + Express
curl http://localhost:3002/api/hello  # Go + Gin
curl http://localhost:3003/api/hello  # Python + FastAPI
```

### 負荷テストの実行

```bash
# Docker Composeで実行
docker-compose run k6 run /scripts/load-test.js

# またはローカルで実行 (k6がインストール済みの場合)
k6 run k6/load-test.js
```

### サービスの停止

```bash
docker-compose down
```

## APIエンドポイント

全サービスで同じAPIインターフェースを実装しています:

### GET /api/hello
タイムスタンプ付きのグリーティングメッセージを返す

**レスポンス:**
```json
{
  "message": "Hello from [Framework]",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "framework": "[Framework Name]"
}
```

### GET /api/data
100個のサンプルデータアイテムを返す

**レスポンス:**
```json
{
  "data": [
    {
      "id": 1,
      "value": 0.0
    },
    ...
  ]
}
```

### POST /api/echo
ポストされたデータをエコーバックする

**リクエスト:**
```json
{
  "message": "メッセージ内容"
}
```

**レスポンス:**
```json
{
  "echo": {
    "message": "メッセージ内容"
  },
  "received": "2025-01-27T12:00:00.000Z"
}
```

## データベース接続

Docker Compose セットアップには 3 つのデータベースが含まれています:

### PostgreSQL
- **ホスト**: localhost:5432
- **ユーザー名**: benchuser
- **パスワード**: benchpass
- **データベース**: benchmark_db

```bash
# 接続
psql -h localhost -U benchuser -d benchmark_db
```

### MongoDB
- **ホスト**: localhost:27017
- **ユーザー名**: benchuser
- **パスワード**: benchpass
- **データベース**: benchmark_db

```bash
# 接続
mongosh "mongodb://benchuser:benchpass@localhost:27017/benchmark_db"
```

### Redis
- **ホスト**: localhost:6379
- **認証**: なし (デフォルト設定)

```bash
# 接続
redis-cli -h localhost
```

## パフォーマンス比較

詳細なパフォーマンス指標、DX比較、推奨事項については [COMPARISON.md](./COMPARISON.md) を参照してください。

### クイック比較
| フレームワーク | 平均応答時間 | RPS | メモリ |
|-------------|-----------|-----|--------|
| Go + Gin | ~2ms | 3,500+ | ~30MB |
| Node.js + Express | ~8ms | 1,800+ | ~120MB |
| Python + FastAPI | ~12ms | 1,200+ | ~90MB |

## 技術詳細

### フロントエンド
- **React**: コンポーネントベースのUIライブラリ
- **Vue.js**: リアクティブなデータバインディングを備えたプログレッシブフレームワーク
- **Svelte**: 最小限のランタイムでコンパイルするフレームワーク

### バックエンド言語
- **Node.js**: ノンブロッキングI/Oを備えたJavaScriptランタイム
- **Go**: 組み込み並行処理を備えたコンパイル言語
- **Python**: 優れたエコシステムを備えたインタプリタ言語

### バックエンドフレームワーク
- **Express**: Node.js用のミニマリストWebフレームワーク
- **Gin**: Go用の高速で軽量なWebフレームワーク
- **FastAPI**: Python用の最新非同期Webフレームワーク

### データベース
- **PostgreSQL**: 高度な機能を備えた強力なRDBMS
- **MongoDB**: 柔軟なスキーマを備えたNoSQL文書データベース
- **Redis**: キャッシングとセッション管理用のインメモリデータストア

## 開発Tips

### 新しいバックエンドフレームワークを追加する
1. ディレクトリを作成: `backend/[lang]-[framework]/`
2. APIインターフェースに合わせたエンドポイントを実装
3. Dockerfile を作成
4. docker-compose.yml にサービスを追加
5. k6 ロードテストスクリプトを更新

### ロードテストを変更する
`k6/load-test.js` を編集して:
- VU (仮想ユーザー) の数を変更
- テスト期間を調整
- テスト対象の新しいエンドポイントを追加
- 閾値を変更

### ベンチマーク結果を確認する
```bash
# 結果を抽出
docker cp bench_k6:/app/results/results.json ./results.json

# JSON形式で表示
cat results.json
```

## トラブルシューティング

### サービスが起動しない場合
```bash
# コンテナをクリアして再度実行
docker-compose down -v
docker-compose up -d
```

### ポート競合が発生した場合
`docker-compose.yml` でポートマッピングを変更:
```yaml
ports:
  - "3001:3000"  # 最初の数字を未使用ポートに変更
```

### データベース接続エラーが発生した場合
- サービスが健全な状態か確認: `docker-compose ps`
- ログを確認: `docker-compose logs [service-name]`
- ネットワーク接続を確認: `docker-compose exec [service] ping [other-service]`

## 貢献

貢献を歓迎します。以下のルールに従ってください:
1. 既存のコードスタイルに従う
2. 提出前にローカルでテスト
3. ドキュメントを更新
4. 新しい技術のベンチマークを追加

## ライセンス

MIT ライセンス - 詳細は LICENSE ファイルを参照

## リソース

- [React ドキュメント](https://react.dev)
- [Vue.js ドキュメント](https://vuejs.org)
- [Svelte ドキュメント](https://svelte.dev)
- [Node.js ドキュメント](https://nodejs.org)
- [Go ドキュメント](https://golang.org/doc)
- [Python ドキュメント](https://python.org/doc)
- [Express ドキュメント](https://expressjs.com)
- [Gin ドキュメント](https://gin-gonic.com)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com)
- [k6 ドキュメント](https://k6.io/docs)

---

**最終更新**: 2025年1月
