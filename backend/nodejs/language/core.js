/**
 * Node.js 言語層 - コア機能
 * 基本的なCRUD操作とユーティリティを提供
 */

// パフォーマンス計測用のユーティリティ
class PerformanceTimer {
  constructor(name) {
    this.name = name;
    this.startTime = null;
    this.endTime = null;
  }

  start() {
    this.startTime = process.hrtime.bigint();
  }

  stop() {
    this.endTime = process.hrtime.bigint();
  }

  // ナノ秒からミリ秒に変換
  getDurationMs() {
    if (!this.startTime || !this.endTime) return 0;
    return Number(this.endTime - this.startTime) / 1_000_000;
  }

  // ミリ秒での期間を返す
  getDurationFormatted() {
    return `${this.getDurationMs().toFixed(3)}ms`;
  }
}

/**
 * ユーザーモデル
 */
class User {
  constructor(id, name, email, age) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.age = age;
    this.createdAt = new Date();
  }

  // JSON化
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      age: this.age,
      createdAt: this.createdAt,
    };
  }
}

/**
 * CRUD操作の基本インターフェース
 */
class CRUDBase {
  constructor() {
    this.items = [];
    this.nextId = 1;
    this.operations = [];
  }

  // CREATE: データを作成・挿入
  async create(data) {
    const timer = new PerformanceTimer('CREATE');
    timer.start();

    const item = { id: this.nextId++, ...data, createdAt: new Date() };
    this.items.push(item);

    timer.stop();
    this.recordOperation('CREATE', timer.getDurationMs());

    return item;
  }

  // READ: IDでデータを取得
  async read(id) {
    const timer = new PerformanceTimer('READ');
    timer.start();

    const item = this.items.find((i) => i.id === id);

    timer.stop();
    this.recordOperation('READ', timer.getDurationMs());

    return item || null;
  }

  // READ ALL: 全データを取得
  async readAll() {
    const timer = new PerformanceTimer('READ_ALL');
    timer.start();

    const items = [...this.items];

    timer.stop();
    this.recordOperation('READ_ALL', timer.getDurationMs());

    return items;
  }

  // UPDATE: データを更新
  async update(id, data) {
    const timer = new PerformanceTimer('UPDATE');
    timer.start();

    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      timer.stop();
      return null;
    }

    this.items[index] = { ...this.items[index], ...data, updatedAt: new Date() };

    timer.stop();
    this.recordOperation('UPDATE', timer.getDurationMs());

    return this.items[index];
  }

  // DELETE: データを削除
  async delete(id) {
    const timer = new PerformanceTimer('DELETE');
    timer.start();

    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      timer.stop();
      return false;
    }

    const deleted = this.items.splice(index, 1);

    timer.stop();
    this.recordOperation('DELETE', timer.getDurationMs());

    return deleted.length > 0;
  }

  // 操作を記録
  recordOperation(type, duration) {
    this.operations.push({
      type,
      duration,
      timestamp: new Date(),
    });
  }

  // パフォーマンスレポート取得
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

    // 平均を計算
    Object.keys(report).forEach((key) => {
      report[key].avgMs = report[key].totalMs / report[key].count;
    });

    return report;
  }
}

module.exports = {
  PerformanceTimer,
  User,
  CRUDBase,
};
