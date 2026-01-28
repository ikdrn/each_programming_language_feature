/**
 * Node.js Hono - DB層
 * SQLite接続、CRUD操作、ベンチマーク関数
 */

const sqlite3 = require('sqlite3').verbose();

class HonoDatabase {
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

  async benchmark(count = 1000) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        const stmt = this.db.prepare(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)'
        );
        for (let i = 0; i < count; i++) {
          stmt.run(`User${i}`, `user${i}@example.com`, 20 + (i % 50));
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
              durationMs: durationMs.toFixed(3),
              rps: (count / (durationMs / 1000)).toFixed(2)
            });
          }
        });
      });
    });
  }

  recordOperation(type, duration) {
    this.operations.push({ type, duration, timestamp: new Date() });
  }

  getPerformanceReport() {
    const report = {};
    this.operations.forEach((op) => {
      if (!report[op.type]) {
        report[op.type] = { count: 0, totalMs: 0, minMs: Infinity, maxMs: 0 };
      }
      report[op.type].count += 1;
      report[op.type].totalMs += op.duration;
      report[op.type].minMs = Math.min(report[op.type].minMs, op.duration);
      report[op.type].maxMs = Math.max(report[op.type].maxMs, op.duration);
    });
    Object.keys(report).forEach((key) => {
      report[key].avgMs = (report[key].totalMs / report[key].count).toFixed(3);
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

module.exports = HonoDatabase;
