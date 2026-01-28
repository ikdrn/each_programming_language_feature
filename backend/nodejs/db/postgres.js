/**
 * Node.js + PostgreSQL DB層
 * トランザクション処理とパフォーマンス計測を含むCRUD操作
 */

const { PerformanceTimer } = require('../language/core');

/**
 * PostgreSQL CRUD操作クラス
 * 実際のDB接続の代わりにメモリ上でシミュレーション
 */
class PostgresCRUD {
  constructor() {
    this.data = [];
    this.nextId = 1;
    this.operations = [];
    this.transactions = [];
  }

  /**
   * トランザクション開始
   * @param {Function} callback - トランザクション内で実行する処理
   */
  async transaction(callback) {
    const transactionId = Date.now();
    const timer = new PerformanceTimer('TRANSACTION');
    timer.start();

    try {
      // トランザクション開始ログ
      console.log(
        `[PostgreSQL] トランザクション開始: ${transactionId}`
      );

      // コールバック実行
      const result = await callback(this);

      // コミット
      console.log(
        `[PostgreSQL] トランザクションコミット: ${transactionId}`
      );

      timer.stop();
      this.transactions.push({
        id: transactionId,
        status: 'COMMIT',
        duration: timer.getDurationMs(),
      });

      return result;
    } catch (error) {
      // ロールバック
      console.error(
        `[PostgreSQL] トランザクションロールバック: ${transactionId} - ${error.message}`
      );

      timer.stop();
      this.transactions.push({
        id: transactionId,
        status: 'ROLLBACK',
        duration: timer.getDurationMs(),
      });

      throw error;
    }
  }

  /**
   * CREATE: INSERT処理（トランザクション対応）
   */
  async insert(userData) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('INSERT');
      timer.start();

      const id = this.nextId++;
      const record = {
        id,
        ...userData,
        createdAt: new Date().toISOString(),
      };

      this.data.push(record);

      timer.stop();
      this.operations.push({
        type: 'INSERT',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[PostgreSQL] INSERT完了 - ID: ${id}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return record;
    });
  }

  /**
   * READ: SELECT処理
   */
  async select(id) {
    const timer = new PerformanceTimer('SELECT');
    timer.start();

    const record = this.data.find((r) => r.id === id);

    timer.stop();
    this.operations.push({
      type: 'SELECT',
      duration: timer.getDurationMs(),
      timestamp: new Date(),
    });

    console.log(
      `[PostgreSQL] SELECT完了 - ID: ${id}, 所要時間: ${timer.getDurationFormatted()}`
    );
    return record || null;
  }

  /**
   * READ ALL: 全データ取得
   */
  async selectAll() {
    const timer = new PerformanceTimer('SELECT_ALL');
    timer.start();

    const records = [...this.data];

    timer.stop();
    this.operations.push({
      type: 'SELECT_ALL',
      duration: timer.getDurationMs(),
      timestamp: new Date(),
    });

    console.log(
      `[PostgreSQL] SELECT_ALL完了 - 件数: ${records.length}, 所要時間: ${timer.getDurationFormatted()}`
    );
    return records;
  }

  /**
   * UPDATE: 更新処理（トランザクション対応）
   */
  async update(id, updateData) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('UPDATE');
      timer.start();

      const index = this.data.findIndex((r) => r.id === id);
      if (index === -1) {
        timer.stop();
        return null;
      }

      this.data[index] = {
        ...this.data[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      timer.stop();
      this.operations.push({
        type: 'UPDATE',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[PostgreSQL] UPDATE完了 - ID: ${id}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return this.data[index];
    });
  }

  /**
   * DELETE: 削除処理（トランザクション対応）
   */
  async delete(id) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('DELETE');
      timer.start();

      const index = this.data.findIndex((r) => r.id === id);
      if (index === -1) {
        timer.stop();
        return false;
      }

      this.data.splice(index, 1);

      timer.stop();
      this.operations.push({
        type: 'DELETE',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[PostgreSQL] DELETE完了 - ID: ${id}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return true;
    });
  }

  /**
   * バッチ挿入（複数件をトランザクションで挿入）
   */
  async batchInsert(dataArray) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('BATCH_INSERT');
      timer.start();

      const results = [];
      for (const data of dataArray) {
        const id = this.nextId++;
        const record = {
          id,
          ...data,
          createdAt: new Date().toISOString(),
        };
        this.data.push(record);
        results.push(record);
      }

      timer.stop();
      this.operations.push({
        type: 'BATCH_INSERT',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[PostgreSQL] BATCH_INSERT完了 - 件数: ${results.length}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return results;
    });
  }

  /**
   * パフォーマンスレポート取得
   */
  getPerformanceReport() {
    const report = {};

    this.operations.forEach((op) => {
      if (!report[op.type]) {
        report[op.type] = {
          count: 0,
          totalMs: 0,
          minMs: Infinity,
          maxMs: 0,
        };
      }
      report[op.type].count += 1;
      report[op.type].totalMs += op.duration;
      report[op.type].minMs = Math.min(report[op.type].minMs, op.duration);
      report[op.type].maxMs = Math.max(report[op.type].maxMs, op.duration);
    });

    Object.keys(report).forEach((key) => {
      report[key].avgMs = (
        report[key].totalMs / report[key].count
      ).toFixed(3);
    });

    return report;
  }

  /**
   * トランザクションレポート取得
   */
  getTransactionReport() {
    return {
      totalTransactions: this.transactions.length,
      committedTransactions: this.transactions.filter(
        (t) => t.status === 'COMMIT'
      ).length,
      rolledBackTransactions: this.transactions.filter(
        (t) => t.status === 'ROLLBACK'
      ).length,
      transactions: this.transactions,
    };
  }
}

module.exports = PostgresCRUD;
