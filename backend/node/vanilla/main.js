/**
 * Node.js Vanilla - メインファイル（ルーティングのみ）
 * 標準ライブラリ http のみを使用
 */

const http = require('http');
const Database = require('./db');

const db = new Database();
const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  // CORS対応
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // ========== ルーティング ==========

    // ヘルスチェック
    if (pathname === '/' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ message: 'Node.js Vanilla API', status: 'OK' }));
      return;
    }

    // CREATE - ユーザー作成
    if (pathname === '/users' && method === 'POST') {
      const body = await getRequestBody(req);
      const { name, email, age } = JSON.parse(body);
      const user = await db.createUser(name, email, age);
      res.writeHead(201);
      res.end(JSON.stringify({
        success: true,
        data: user,
        performance: db.getPerformanceReport()
      }));
      return;
    }

    // READ - 全ユーザー取得
    if (pathname === '/users' && method === 'GET') {
      const users = await db.getAllUsers();
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        count: users.length,
        data: users,
        performance: db.getPerformanceReport()
      }));
      return;
    }

    // READ - 特定ユーザー取得
    const userIdMatch = pathname.match(/^\/users\/(\d+)$/);
    if (userIdMatch && method === 'GET') {
      const userId = parseInt(userIdMatch[1]);
      const user = await db.getUser(userId);
      res.writeHead(user ? 200 : 404);
      res.end(JSON.stringify({
        success: !!user,
        data: user,
        performance: db.getPerformanceReport()
      }));
      return;
    }

    // UPDATE - ユーザー更新
    if (userIdMatch && method === 'PUT') {
      const userId = parseInt(userIdMatch[1]);
      const body = await getRequestBody(req);
      const { name, email, age } = JSON.parse(body);
      const updated = await db.updateUser(userId, name, email, age);
      res.writeHead(updated ? 200 : 404);
      res.end(JSON.stringify({
        success: updated,
        updated,
        performance: db.getPerformanceReport()
      }));
      return;
    }

    // DELETE - ユーザー削除
    if (userIdMatch && method === 'DELETE') {
      const userId = parseInt(userIdMatch[1]);
      const deleted = await db.deleteUser(userId);
      res.writeHead(deleted ? 200 : 404);
      res.end(JSON.stringify({
        success: deleted,
        deleted,
        performance: db.getPerformanceReport()
      }));
      return;
    }

    // BENCHMARK - 1000件一括INSERT
    if (pathname === '/benchmark' && method === 'POST') {
      const body = await getRequestBody(req);
      const { count = 1000 } = JSON.parse(body);
      const result = await db.benchmark(count);
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        benchmark: result,
        performance: db.getPerformanceReport()
      }));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));

  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }));
  }
});

// リクエストボディを取得するユーティリティ
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`Node.js Vanilla サーバーが起動しました`);
  console.log(`リッスンポート: ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
