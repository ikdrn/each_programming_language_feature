/**
 * Node.js Express - メインファイル（ルーティングのみ）
 */

const express = require('express');
const ExpressDatabase = require('./db');

const app = express();
const db = new ExpressDatabase();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// ========== ルーティング ==========

// ヘルスチェック
app.get('/', (req, res) => {
  res.json({ message: 'Node.js Express API', status: 'OK' });
});

// CREATE - ユーザー作成
app.post('/users', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const user = await db.createUser(name, email, age);
    res.status(201).json({
      success: true,
      data: user,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ - 全ユーザー
app.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json({
      success: true,
      count: users.length,
      data: users,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ - 特定ユーザー
app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.getUser(parseInt(req.params.id));
    res.json({
      success: !!user,
      data: user,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE - ユーザー更新
app.put('/users/:id', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const updated = await db.updateUser(parseInt(req.params.id), name, email, age);
    res.json({
      success: updated,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - ユーザー削除
app.delete('/users/:id', async (req, res) => {
  try {
    const deleted = await db.deleteUser(parseInt(req.params.id));
    res.json({
      success: deleted,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BENCHMARK - 1000件一括INSERT
app.post('/benchmark', async (req, res) => {
  try {
    const { count = 1000 } = req.body;
    const result = await db.benchmark(count);
    res.json({
      success: true,
      benchmark: result,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Node.js Express サーバーが起動しました`);
  console.log(`リッスンポート: ${PORT}`);
});
