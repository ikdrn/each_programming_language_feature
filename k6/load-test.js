/**
 * k6 負荷テストスクリプト
 * 3つのバックエンドフレームワークのパフォーマンスを比較
 * 仮想ユーザー数を徐々に増減させながらテストを実行
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

// テストシナリオの設定
export const options = {
  // 仮想ユーザー(VU)の段階的な増減
  stages: [
    { duration: '30s', target: 20 },   // 30秒かけて 20ユーザーに増加
    { duration: '1m30s', target: 20 }, // 1分30秒間 20ユーザーを維持
    { duration: '20s', target: 0 },    // 20秒かけて 0ユーザーに減少
  ],
  // 性能のしきい値設定
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95パーセンタイルが500ms未満
    http_req_failed: ['rate<0.1'],     // 失敗率が 10% 未満
  },
};

// テスト対象のバックエンドサービスのベースURL
const BASE_URLS = {
  nodeExpress: 'http://node-express:3000',
  goGin: 'http://go-gin:3000',
  pythonFastAPI: 'http://python-fastapi:3000',
};

/**
 * Node.js + Express のテスト
 * /api/hello エンドポイントをGETリクエストでテスト
 */
export function testNodeExpress() {
  const url = `${BASE_URLS.nodeExpress}/api/hello`;
  const response = http.get(url);

  // レスポンス検証
  check(response, {
    'Node.js status is 200': (r) => r.status === 200,
    'Node.js response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 次のリクエストまで1秒待機
  sleep(1);
}

/**
 * Go + Gin のテスト
 * /api/hello エンドポイントをGETリクエストでテスト
 */
export function testGoGin() {
  const url = `${BASE_URLS.goGin}/api/hello`;
  const response = http.get(url);

  // レスポンス検証
  check(response, {
    'Go status is 200': (r) => r.status === 200,
    'Go response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 次のリクエストまで1秒待機
  sleep(1);
}

/**
 * Python + FastAPI のテスト
 * /api/hello エンドポイントをGETリクエストでテスト
 */
export function testPythonFastAPI() {
  const url = `${BASE_URLS.pythonFastAPI}/api/hello`;
  const response = http.get(url);

  // レスポンス検証
  check(response, {
    'Python status is 200': (r) => r.status === 200,
    'Python response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 次のリクエストまで1秒待機
  sleep(1);
}

/**
 * データエンドポイントのテスト
 * /api/data エンドポイントをGETリクエストでテスト
 * 各フレームワークから100個のサンプルデータを取得
 */
export function testDataEndpoints() {
  const endpoints = [
    `${BASE_URLS.nodeExpress}/api/data`,
    `${BASE_URLS.goGin}/api/data`,
    `${BASE_URLS.pythonFastAPI}/api/data`,
  ];

  // 各エンドポイントをテスト
  endpoints.forEach((url) => {
    const response = http.get(url);
    check(response, {
      'Data endpoint status is 200': (r) => r.status === 200,
    });
  });

  // 次のリクエストまで1秒待機
  sleep(1);
}

/**
 * POSTエンドポイントのテスト
 * /api/echo エンドポイントをPOSTリクエストでテスト
 * リクエストボディをエコーバックすることを検証
 */
export function testPostEndpoints() {
  const endpoints = [
    `${BASE_URLS.nodeExpress}/api/echo`,
    `${BASE_URLS.goGin}/api/echo`,
    `${BASE_URLS.pythonFastAPI}/api/echo`,
  ];

  // テスト用のペイロード
  const payload = JSON.stringify({
    message: 'Hello from k6 benchmark',
  });

  // HTTPヘッダー設定
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // 各エンドポイントをテスト
  endpoints.forEach((url) => {
    const response = http.post(url, payload, params);
    check(response, {
      'POST status is 200': (r) => r.status === 200,
    });
  });

  // 次のリクエストまで1秒待機
  sleep(1);
}

/**
 * メインテスト関数
 * 各仮想ユーザーが実行するテストシナリオ
 */
export default function () {
  testNodeExpress();
  testGoGin();
  testPythonFastAPI();
  testDataEndpoints();
  testPostEndpoints();
}
