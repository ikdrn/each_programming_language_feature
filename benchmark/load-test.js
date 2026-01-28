import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  scenarios: {
    benchmark: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m30s', target: 10 },
        { duration: '20s', target: 0 },
      ],
    },
  },
};

const services = [
  { name: 'Node Vanilla', url: 'http://localhost:3001' },
  { name: 'Node Express', url: 'http://localhost:3002' },
  { name: 'Node Hono', url: 'http://localhost:3003' },
  { name: 'Go Vanilla', url: 'http://localhost:4001' },
  { name: 'Go Gin', url: 'http://localhost:4002' },
  { name: 'Go Echo', url: 'http://localhost:4003' },
  { name: 'Rust Vanilla', url: 'http://localhost:5001' },
  { name: 'Rust Axum', url: 'http://localhost:5002' },
  { name: 'Rust Actix-web', url: 'http://localhost:5003' },
  { name: 'Python Vanilla', url: 'http://localhost:6001' },
  { name: 'Python FastAPI', url: 'http://localhost:6002' },
  { name: 'Python Django', url: 'http://localhost:6003' },
  { name: 'PHP Vanilla', url: 'http://localhost:7001' },
  { name: 'PHP Laravel', url: 'http://localhost:7002' },
  { name: 'Java Vanilla', url: 'http://localhost:8001' },
  { name: 'Java Spring Boot', url: 'http://localhost:8002' },
  { name: 'Ruby Vanilla', url: 'http://localhost:9001' },
  { name: 'Ruby Rails', url: 'http://localhost:9002' },
];

export default function () {
  services.forEach(service => {
    group(`${service.name}`, function () {
      // ヘルスチェック
      let healthRes = http.get(`${service.url}/`);
      check(healthRes, {
        'ヘルスチェックステータスが200': (r) => r.status === 200,
        'ヘルスチェックレスポンスにメッセージがある': (r) => r.body.includes('status'),
      });

      // ユーザー作成
      let createRes = http.post(
        `${service.url}/users`,
        JSON.stringify({
          name: `User${__VU}-${__ITER}`,
          email: `user${__VU}${__ITER}@example.com`,
          age: 25 + (__VU % 50),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      check(createRes, {
        'ユーザー作成ステータスが201か200': (r) => r.status === 201 || r.status === 200,
        'ユーザー作成レスポンスにsuccessがある': (r) => r.body.includes('success'),
        'ユーザー作成にdataがある': (r) => r.body.includes('data'),
      });

      // すべてのユーザーを取得
      let getAllRes = http.get(`${service.url}/users`);
      check(getAllRes, {
        'すべてのユーザー取得ステータスが200': (r) => r.status === 200,
        'すべてのユーザー取得にcountがある': (r) => r.body.includes('count'),
      });

      // ベンチマーク
      let benchmarkRes = http.post(
        `${service.url}/benchmark`,
        JSON.stringify({ count: 100 }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      check(benchmarkRes, {
        'ベンチマークステータスが200': (r) => r.status === 200,
        'ベンチマークに結果がある': (r) => r.body.includes('benchmark'),
        'ベンチマークにパフォーマンスがある': (r) => r.body.includes('performance'),
      });

      sleep(0.1);
    });
  });
}
