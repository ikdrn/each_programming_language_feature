/**
 * Node.js + Express フレームワーク層
 * DB層に対するRESTful APIエンドポイントを提供
 */

const express = require('express');
const PostgresCRUD = require('../db/postgres');
const MongoDBCRUD = require('../db/mongodb');
const RedisCRUD = require('../db/redis');

/**
 * Express APIサーバーの作成と設定
 */
function createExpressApp() {
  const app = express();

  // ミドルウェア
  app.use(express.json());

  // DB インスタンスの初期化
  const pgDb = new PostgresCRUD();
  const mongoDb = new MongoDBCRUD();
  const redisDb = new RedisCRUD();

  // =============================================
  // PostgreSQL エンドポイント
  // =============================================

  /**
   * POST /postgres/insert - ユーザーを挿入
   */
  app.post('/postgres/insert', async (req, res) => {
    try {
      const { name, email, age } = req.body;

      const result = await pgDb.insert({
        name,
        email,
        age,
      });

      res.json({
        success: true,
        message: 'PostgreSQL - INSERT成功',
        data: result,
        performance: pgDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'PostgreSQL - INSERT失敗',
        error: error.message,
      });
    }
  });

  /**
   * GET /postgres/select/:id - IDでユーザーを取得
   */
  app.get('/postgres/select/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pgDb.select(parseInt(id));

      res.json({
        success: true,
        message: 'PostgreSQL - SELECT成功',
        data: result,
        performance: pgDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'PostgreSQL - SELECT失敗',
        error: error.message,
      });
    }
  });

  /**
   * GET /postgres/selectall - 全ユーザーを取得
   */
  app.get('/postgres/selectall', async (req, res) => {
    try {
      const result = await pgDb.selectAll();

      res.json({
        success: true,
        message: 'PostgreSQL - SELECT ALL成功',
        dataCount: result.length,
        data: result,
        performance: pgDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'PostgreSQL - SELECT ALL失敗',
        error: error.message,
      });
    }
  });

  /**
   * PUT /postgres/update/:id - ユーザーを更新
   */
  app.put('/postgres/update/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, age } = req.body;

      const result = await pgDb.update(parseInt(id), {
        name,
        email,
        age,
      });

      res.json({
        success: true,
        message: 'PostgreSQL - UPDATE成功',
        data: result,
        performance: pgDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'PostgreSQL - UPDATE失敗',
        error: error.message,
      });
    }
  });

  /**
   * DELETE /postgres/delete/:id - ユーザーを削除
   */
  app.delete('/postgres/delete/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pgDb.delete(parseInt(id));

      res.json({
        success: true,
        message: 'PostgreSQL - DELETE成功',
        deleted: result,
        performance: pgDb.getPerformanceReport(),
        transactions: pgDb.getTransactionReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'PostgreSQL - DELETE失敗',
        error: error.message,
      });
    }
  });

  /**
   * POST /postgres/batch-insert - バッチ挿入
   */
  app.post('/postgres/batch-insert', async (req, res) => {
    try {
      const { records } = req.body;

      const result = await pgDb.batchInsert(records);

      res.json({
        success: true,
        message: 'PostgreSQL - BATCH INSERT成功',
        count: result.length,
        data: result,
        performance: pgDb.getPerformanceReport(),
        transactions: pgDb.getTransactionReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'PostgreSQL - BATCH INSERT失敗',
        error: error.message,
      });
    }
  });

  // =============================================
  // MongoDB エンドポイント
  // =============================================

  /**
   * POST /mongodb/insert - ドキュメントを挿入
   */
  app.post('/mongodb/insert', async (req, res) => {
    try {
      const { collectionName, document } = req.body;

      const result = await mongoDb.insertOne(collectionName, document);

      res.json({
        success: true,
        message: 'MongoDB - insertOne成功',
        data: result,
        performance: mongoDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'MongoDB - insertOne失敗',
        error: error.message,
      });
    }
  });

  /**
   * POST /mongodb/insert-many - 複数ドキュメントをバッチ挿入
   */
  app.post('/mongodb/insert-many', async (req, res) => {
    try {
      const { collectionName, documents } = req.body;

      const result = await mongoDb.insertMany(collectionName, documents);

      res.json({
        success: true,
        message: 'MongoDB - insertMany成功',
        data: result,
        performance: mongoDb.getPerformanceReport(),
        transactions: mongoDb.getTransactionReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'MongoDB - insertMany失敗',
        error: error.message,
      });
    }
  });

  /**
   * GET /mongodb/find - ドキュメントを検索
   */
  app.get('/mongodb/find/:collectionName', async (req, res) => {
    try {
      const { collectionName } = req.params;
      const filter = req.query.filter ? JSON.parse(req.query.filter) : {};

      const result = await mongoDb.find(collectionName, filter);

      res.json({
        success: true,
        message: 'MongoDB - find成功',
        count: result.length,
        data: result,
        performance: mongoDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'MongoDB - find失敗',
        error: error.message,
      });
    }
  });

  /**
   * PUT /mongodb/update - ドキュメントを更新
   */
  app.put('/mongodb/update/:collectionName', async (req, res) => {
    try {
      const { collectionName } = req.params;
      const { filter, update } = req.body;

      const result = await mongoDb.updateOne(
        collectionName,
        filter,
        update
      );

      res.json({
        success: true,
        message: 'MongoDB - updateOne成功',
        data: result,
        performance: mongoDb.getPerformanceReport(),
        transactions: mongoDb.getTransactionReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'MongoDB - updateOne失敗',
        error: error.message,
      });
    }
  });

  /**
   * DELETE /mongodb/delete - ドキュメントを削除
   */
  app.delete('/mongodb/delete/:collectionName', async (req, res) => {
    try {
      const { collectionName } = req.params;
      const { filter } = req.body;

      const result = await mongoDb.deleteOne(collectionName, filter);

      res.json({
        success: true,
        message: 'MongoDB - deleteOne成功',
        data: result,
        performance: mongoDb.getPerformanceReport(),
        transactions: mongoDb.getTransactionReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'MongoDB - deleteOne失敗',
        error: error.message,
      });
    }
  });

  // =============================================
  // Redis エンドポイント
  // =============================================

  /**
   * POST /redis/set - キー・バリューを設定
   */
  app.post('/redis/set', async (req, res) => {
    try {
      const { key, value, expiryMs } = req.body;

      const result = await redisDb.set(key, value, expiryMs);

      res.json({
        success: true,
        message: 'Redis - SET成功',
        result,
        performance: redisDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Redis - SET失敗',
        error: error.message,
      });
    }
  });

  /**
   * GET /redis/get/:key - キーからバリューを取得
   */
  app.get('/redis/get/:key', async (req, res) => {
    try {
      const { key } = req.params;

      const result = await redisDb.get(key);

      res.json({
        success: true,
        message: 'Redis - GET成功',
        data: result,
        performance: redisDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Redis - GET失敗',
        error: error.message,
      });
    }
  });

  /**
   * POST /redis/hset - ハッシュを設定
   */
  app.post('/redis/hset', async (req, res) => {
    try {
      const { key, field, value } = req.body;

      const result = await redisDb.hset(key, field, value);

      res.json({
        success: true,
        message: 'Redis - HSET成功',
        result,
        performance: redisDb.getPerformanceReport(),
        transactions: redisDb.getTransactionReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Redis - HSET失敗',
        error: error.message,
      });
    }
  });

  /**
   * GET /redis/hget/:key/:field - ハッシュからバリューを取得
   */
  app.get('/redis/hget/:key/:field', async (req, res) => {
    try {
      const { key, field } = req.params;

      const result = await redisDb.hget(key, field);

      res.json({
        success: true,
        message: 'Redis - HGET成功',
        data: result,
        performance: redisDb.getPerformanceReport(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Redis - HGET失敗',
        error: error.message,
      });
    }
  });

  // =============================================
  // ヘルスチェック
  // =============================================

  /**
   * GET / - ヘルスチェック
   */
  app.get('/', (req, res) => {
    res.json({
      message: 'Node.js + Express API Server',
      status: 'OK',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

module.exports = createExpressApp;
