/**
 * Node.js + Express API サーバー
 * ベンチマーク用の基本的なRESTful APIエンドポイントを実装
 */

const express = require('express');
const app = express();
// ポート番号: 環境変数から取得、ない場合は 3000
const PORT = process.env.PORT || 3000;

// JSON リクエストボディのパース設定
app.use(express.json());

/**
 * GET /api/hello
 * グリーティングメッセージを返す
 */
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Node.js + Express',
    timestamp: new Date().toISOString(),
    framework: 'Express',
  });
});

/**
 * GET /api/data
 * 100個のサンプルデータを返す
 */
app.get('/api/data', (req, res) => {
  res.json({
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      value: Math.random() * 100,
    })),
  });
});

/**
 * POST /api/echo
 * リクエストボディをエコーバックする
 */
app.post('/api/echo', (req, res) => {
  res.json({
    echo: req.body,
    received: new Date().toISOString(),
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
