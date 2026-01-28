/**
 * Node.js Hono - メインファイル（ルーティングのみ）
 */

const { Hono } = require('hono');
const { serve } = require('@hono/node-server');
const HonoDatabase = require('./db');

const app = new Hono();
const db = new HonoDatabase();
const PORT = process.env.PORT || 3002;

// ========== ルーティング ==========

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ message: 'Node.js Hono API', status: 'OK' });
});

// CREATE - ユーザー作成
app.post('/users', async (c) => {
  try {
    const { name, email, age } = await c.req.json();
    const user = await db.createUser(name, email, age);
    return c.json(
      {
        success: true,
        data: user,
        performance: db.getPerformanceReport()
      },
      201
    );
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// READ - 全ユーザー
app.get('/users', async (c) => {
  try {
    const users = await db.getAllUsers();
    return c.json({
      success: true,
      count: users.length,
      data: users,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// READ - 特定ユーザー
app.get('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const user = await db.getUser(id);
    return c.json({
      success: !!user,
      data: user,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// UPDATE - ユーザー更新
app.put('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const { name, email, age } = await c.req.json();
    const updated = await db.updateUser(id, name, email, age);
    return c.json({
      success: updated,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// DELETE - ユーザー削除
app.delete('/users/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const deleted = await db.deleteUser(id);
    return c.json({
      success: deleted,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// BENCHMARK - 1000件一括INSERT
app.post('/benchmark', async (c) => {
  try {
    const { count = 1000 } = await c.req.json();
    const result = await db.benchmark(count);
    return c.json({
      success: true,
      benchmark: result,
      performance: db.getPerformanceReport()
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

serve(
  {
    fetch: app.fetch,
    port: PORT
  },
  (info) => {
    console.log(`Node.js Hono サーバーが起動しました`);
    console.log(`リッスンポート: ${info.port}`);
  }
);
