/**
 * Node.js + Redis DB層
 * キャッシュストアとしての高速CRUD操作
 */

const { PerformanceTimer } = require('../language/core');

/**
 * Redis CRUD操作クラス
 * キー・バリュー形式のデータ操作を提供
 */
class RedisCRUD {
  constructor() {
    this.data = new Map();
    this.operations = [];
    this.transactions = [];
    this.expiry = new Map();
  }

  /**
   * トランザクション処理
   * Redis MULTI/EXEC をシミュレート
   */
  async transaction(callback) {
    const transactionId = Date.now();
    const timer = new PerformanceTimer('TRANSACTION');
    timer.start();

    try {
      console.log(
        `[Redis] トランザクション開始 (MULTI): ${transactionId}`
      );

      const result = await callback(this);

      console.log(
        `[Redis] トランザクションコミット (EXEC): ${transactionId}`
      );

      timer.stop();
      this.transactions.push({
        id: transactionId,
        status: 'COMMIT',
        duration: timer.getDurationMs(),
      });

      return result;
    } catch (error) {
      console.error(
        `[Redis] トランザクションロールバック (DISCARD): ${transactionId} - ${error.message}`
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
   * SET: キーにバリューを設定
   */
  async set(key, value, expiryMs = null) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('SET');
      timer.start();

      this.data.set(key, JSON.stringify(value));

      // 有効期限を設定
      if (expiryMs) {
        this.expiry.set(
          key,
          Date.now() + expiryMs
        );
      }

      timer.stop();
      this.operations.push({
        type: 'SET',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[Redis] SET完了 - Key: ${key}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return 'OK';
    });
  }

  /**
   * GET: キーからバリューを取得
   */
  async get(key) {
    const timer = new PerformanceTimer('GET');
    timer.start();

    // 有効期限チェック
    if (this.expiry.has(key) && Date.now() > this.expiry.get(key)) {
      this.data.delete(key);
      this.expiry.delete(key);
      timer.stop();
      console.log(
        `[Redis] GET完了 (期限切れ) - Key: ${key}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return null;
    }

    const value = this.data.get(key);
    const result = value ? JSON.parse(value) : null;

    timer.stop();
    this.operations.push({
      type: 'GET',
      duration: timer.getDurationMs(),
      timestamp: new Date(),
    });

    console.log(
      `[Redis] GET完了 - Key: ${key}, 所要時間: ${timer.getDurationFormatted()}`
    );
    return result;
  }

  /**
   * MGET: 複数のキーからバリューを取得
   */
  async mget(keys) {
    const timer = new PerformanceTimer('MGET');
    timer.start();

    const results = keys.map((key) => {
      if (
        this.expiry.has(key) &&
        Date.now() > this.expiry.get(key)
      ) {
        this.data.delete(key);
        this.expiry.delete(key);
        return null;
      }
      const value = this.data.get(key);
      return value ? JSON.parse(value) : null;
    });

    timer.stop();
    this.operations.push({
      type: 'MGET',
      duration: timer.getDurationMs(),
      timestamp: new Date(),
    });

    console.log(
      `[Redis] MGET完了 - キー数: ${keys.length}, 所要時間: ${timer.getDurationFormatted()}`
    );
    return results;
  }

  /**
   * INCR: 数値インクリメント
   */
  async incr(key) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('INCR');
      timer.start();

      const current = this.data.has(key)
        ? parseInt(JSON.parse(this.data.get(key)))
        : 0;
      const newValue = current + 1;

      this.data.set(key, JSON.stringify(newValue));

      timer.stop();
      this.operations.push({
        type: 'INCR',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[Redis] INCR完了 - Key: ${key}, 新値: ${newValue}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return newValue;
    });
  }

  /**
   * DEL: キーを削除
   */
  async del(key) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('DEL');
      timer.start();

      const existed = this.data.has(key);
      this.data.delete(key);
      this.expiry.delete(key);

      timer.stop();
      this.operations.push({
        type: 'DEL',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[Redis] DEL完了 - Key: ${key}, 削除: ${existed ? 'あり' : 'なし'}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return existed ? 1 : 0;
    });
  }

  /**
   * LPUSH: リストの左側にプッシュ
   */
  async lpush(key, values) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('LPUSH');
      timer.start();

      if (!this.data.has(key)) {
        this.data.set(key, JSON.stringify([]));
      }

      const list = JSON.parse(this.data.get(key));
      const newValues = Array.isArray(values) ? values : [values];
      const result = list.unshift(...newValues);

      this.data.set(key, JSON.stringify(list));

      timer.stop();
      this.operations.push({
        type: 'LPUSH',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[Redis] LPUSH完了 - Key: ${key}, 件数: ${result}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return result;
    });
  }

  /**
   * LPOP: リストの左側からポップ
   */
  async lpop(key) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('LPOP');
      timer.start();

      if (!this.data.has(key)) {
        timer.stop();
        return null;
      }

      const list = JSON.parse(this.data.get(key));
      const value = list.shift();

      this.data.set(key, JSON.stringify(list));

      timer.stop();
      this.operations.push({
        type: 'LPOP',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[Redis] LPOP完了 - Key: ${key}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return value;
    });
  }

  /**
   * HSET: ハッシュにフィールド・バリューを設定
   */
  async hset(key, field, value) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('HSET');
      timer.start();

      if (!this.data.has(key)) {
        this.data.set(key, JSON.stringify({}));
      }

      const hash = JSON.parse(this.data.get(key));
      const isNew = !hash.hasOwnProperty(field);
      hash[field] = value;

      this.data.set(key, JSON.stringify(hash));

      timer.stop();
      this.operations.push({
        type: 'HSET',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[Redis] HSET完了 - Key: ${key}, Field: ${field}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return isNew ? 1 : 0;
    });
  }

  /**
   * HGET: ハッシュのフィールドからバリューを取得
   */
  async hget(key, field) {
    const timer = new PerformanceTimer('HGET');
    timer.start();

    if (!this.data.has(key)) {
      timer.stop();
      return null;
    }

    const hash = JSON.parse(this.data.get(key));
    const value = hash[field] || null;

    timer.stop();
    this.operations.push({
      type: 'HGET',
      duration: timer.getDurationMs(),
      timestamp: new Date(),
    });

    console.log(
      `[Redis] HGET完了 - Key: ${key}, Field: ${field}, 所要時間: ${timer.getDurationFormatted()}`
    );
    return value;
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

module.exports = RedisCRUD;
