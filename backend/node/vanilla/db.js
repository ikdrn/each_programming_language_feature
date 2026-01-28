/**
 * Node.js Vanilla - DB層（メモリ内シミュレーション）
 * 実行時間計測とトランザクション処理を含む
 */

const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(dbPath = ':memory:') {
    this.db = new sqlite3.Database(dbPath);
    this.operations = [];
    this.initSchema();
  }

  initSchema() {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          age INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }

  /**
   * CREATE - ユーザーを作成
   */
  createUser(name, email, age) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();

      this.db.run(
        'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
        [name, email, age],
        function (err) {
          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1_000_000;

          this.recordOperation('CREATE', durationMs);

          if (err) reject(err);
          else resolve({ id: this.lastID, name, email, age });
        }
      );
    });
  }

  /**
   * READ - ユーザーを取得
   */
  getUser(id) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();

      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        this.recordOperation('READ', durationMs);

        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  /**
   * READ ALL - 全ユーザーを取得
   */
  getAllUsers() {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();

      this.db.all('SELECT * FROM users', (err, rows) => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        this.recordOperation('READ_ALL', durationMs);

        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * UPDATE - ユーザーを更新
   */
  updateUser(id, name, email, age) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();

      this.db.run(
        'UPDATE users SET name = ?, email = ?, age = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, email, age, id],
        function (err) {
          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1_000_000;

          this.recordOperation('UPDATE', durationMs);

          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * DELETE - ユーザーを削除
   */
  deleteUser(id) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();

      this.db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1_000_000;

        this.recordOperation('DELETE', durationMs);

        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  /**
   * BENCHMARK - 1000件の一括INSERT（トランザクション付き）
   */
  async benchmark(count = 1000) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();

      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        const stmt = this.db.prepare(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)'
        );

        for (let i = 0; i < count; i++) {
          stmt.run(
            `ベンチユーザー${i}`,
            `bench${i}@example.com`,
            20 + (i % 50)
          );
        }

        stmt.finalize();
        this.db.run('COMMIT', (err) => {
          const endTime = process.hrtime.bigint();
          const durationMs = Number(endTime - startTime) / 1_000_000;

          this.recordOperation('BENCHMARK', durationMs);

          if (err) reject(err);
          else {
            resolve({
              count,
              durationMs,
              durationFormatted: `${durationMs.toFixed(3)}ms`,
              rps: (count / (durationMs / 1000)).toFixed(2)
            });
          }
        });
      });
    });
  }

  /**
   * 操作を記録
   */
  recordOperation(type, duration) {
    this.operations.push({ type, duration, timestamp: new Date() });
  }

  /**
   * パフォーマンスレポート
   */
  getPerformanceReport() {
    const report = {};

    this.operations.forEach((op) => {
      if (!report[op.type]) {
        report[op.type] = {
          count: 0,
          totalMs: 0,
          minMs: Infinity,
          maxMs: 0
        };
      }
      report[op.type].count += 1;
      report[op.type].totalMs += op.duration;
      report[op.type].minMs = Math.min(report[op.type].minMs, op.duration);
      report[op.type].maxMs = Math.max(report[op.type].maxMs, op.duration);
    });

    Object.keys(report).forEach((key) => {
      const stats = report[key];
      stats.avgMs = (stats.totalMs / stats.count).toFixed(3);
    });

    return report;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = Database;
