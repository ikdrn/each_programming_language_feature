/**
 * Node.js + MongoDB DB層
 * ドキュメント指向のCRUD操作とパフォーマンス計測
 */

const { PerformanceTimer } = require('../language/core');

/**
 * MongoDB CRUD操作クラス
 * ドキュメント指向のデータ操作を提供
 */
class MongoDBCRUD {
  constructor() {
    this.collections = new Map();
    this.operations = [];
    this.transactions = [];
  }

  /**
   * コレクション取得（存在しなければ作成）
   */
  getCollection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, []);
    }
    return this.collections.get(name);
  }

  /**
   * トランザクション処理
   * MongoDB 4.0以降のマルチドキュメントトランザクションをシミュレート
   */
  async transaction(callback) {
    const transactionId = Date.now();
    const timer = new PerformanceTimer('TRANSACTION');
    timer.start();

    try {
      console.log(`[MongoDB] トランザクション開始: ${transactionId}`);

      const result = await callback(this);

      console.log(`[MongoDB] トランザクションコミット: ${transactionId}`);

      timer.stop();
      this.transactions.push({
        id: transactionId,
        status: 'COMMIT',
        duration: timer.getDurationMs(),
      });

      return result;
    } catch (error) {
      console.error(
        `[MongoDB] トランザクションロールバック: ${transactionId} - ${error.message}`
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
   * INSERT ONE: 1つのドキュメントを挿入
   */
  async insertOne(collectionName, doc) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('INSERT_ONE');
      timer.start();

      const collection = this.getCollection(collectionName);
      const _id = new Date().getTime();
      const document = {
        _id,
        ...doc,
        createdAt: new Date().toISOString(),
      };

      collection.push(document);

      timer.stop();
      this.operations.push({
        type: 'INSERT_ONE',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[MongoDB] insertOne完了 - Collection: ${collectionName}, ID: ${_id}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return { ...document, acknowledged: true };
    });
  }

  /**
   * INSERT MANY: 複数のドキュメントをバッチ挿入
   */
  async insertMany(collectionName, docs) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('INSERT_MANY');
      timer.start();

      const collection = this.getCollection(collectionName);
      const insertedIds = [];

      docs.forEach((doc) => {
        const _id = new Date().getTime() + Math.random();
        const document = {
          _id,
          ...doc,
          createdAt: new Date().toISOString(),
        };
        collection.push(document);
        insertedIds.push(_id);
      });

      timer.stop();
      this.operations.push({
        type: 'INSERT_MANY',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[MongoDB] insertMany完了 - Collection: ${collectionName}, 件数: ${docs.length}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return { acknowledged: true, insertedIds };
    });
  }

  /**
   * FIND ONE: 1つのドキュメントを検索
   */
  async findOne(collectionName, filter) {
    const timer = new PerformanceTimer('FIND_ONE');
    timer.start();

    const collection = this.getCollection(collectionName);
    const doc = collection.find((d) => this._matchesFilter(d, filter));

    timer.stop();
    this.operations.push({
      type: 'FIND_ONE',
      duration: timer.getDurationMs(),
      timestamp: new Date(),
    });

    console.log(
      `[MongoDB] findOne完了 - Collection: ${collectionName}, 所要時間: ${timer.getDurationFormatted()}`
    );
    return doc || null;
  }

  /**
   * FIND: 複数のドキュメントを検索
   */
  async find(collectionName, filter = {}) {
    const timer = new PerformanceTimer('FIND');
    timer.start();

    const collection = this.getCollection(collectionName);
    const docs = collection.filter((d) => this._matchesFilter(d, filter));

    timer.stop();
    this.operations.push({
      type: 'FIND',
      duration: timer.getDurationMs(),
      timestamp: new Date(),
    });

    console.log(
      `[MongoDB] find完了 - Collection: ${collectionName}, 件数: ${docs.length}, 所要時間: ${timer.getDurationFormatted()}`
    );
    return docs;
  }

  /**
   * UPDATE ONE: 1つのドキュメントを更新
   */
  async updateOne(collectionName, filter, update) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('UPDATE_ONE');
      timer.start();

      const collection = this.getCollection(collectionName);
      const index = collection.findIndex((d) =>
        this._matchesFilter(d, filter)
      );

      if (index === -1) {
        timer.stop();
        return { matchedCount: 0, modifiedCount: 0 };
      }

      collection[index] = {
        ...collection[index],
        ...update,
        updatedAt: new Date().toISOString(),
      };

      timer.stop();
      this.operations.push({
        type: 'UPDATE_ONE',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[MongoDB] updateOne完了 - Collection: ${collectionName}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return { matchedCount: 1, modifiedCount: 1 };
    });
  }

  /**
   * DELETE ONE: 1つのドキュメントを削除
   */
  async deleteOne(collectionName, filter) {
    return this.transaction(async () => {
      const timer = new PerformanceTimer('DELETE_ONE');
      timer.start();

      const collection = this.getCollection(collectionName);
      const index = collection.findIndex((d) =>
        this._matchesFilter(d, filter)
      );

      if (index === -1) {
        timer.stop();
        return { deletedCount: 0 };
      }

      collection.splice(index, 1);

      timer.stop();
      this.operations.push({
        type: 'DELETE_ONE',
        duration: timer.getDurationMs(),
        timestamp: new Date(),
      });

      console.log(
        `[MongoDB] deleteOne完了 - Collection: ${collectionName}, 所要時間: ${timer.getDurationFormatted()}`
      );
      return { deletedCount: 1 };
    });
  }

  /**
   * フィルター条件にマッチするか判定
   */
  _matchesFilter(doc, filter) {
    return Object.keys(filter).every((key) => doc[key] === filter[key]);
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

module.exports = MongoDBCRUD;
