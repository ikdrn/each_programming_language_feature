import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';

export const options = {
  vus: 1,
  iterations: 1,
};

const errorRate = new Rate('errors');

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
    group(`ベンチマーク: ${service.name}`, function () {
      // 1000項目のINSERTでベンチマークを実行
      let benchmarkRes = http.post(
        `${service.url}/benchmark`,
        JSON.stringify({ count: 1000 }),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: '60s',
        }
      );

      let success = check(benchmarkRes, {
        'ステータスが200': (r) => r.status === 200,
        'ベンチマークデータがある': (r) => r.body.includes('durationMs'),
      });

      errorRate.add(!success);

      if (benchmarkRes.status === 200) {
        try {
          let response = JSON.parse(benchmarkRes.body);
          if (response.benchmark) {
            console.log(`${service.name}:
              実行時間: ${response.benchmark.durationMs}ms
              RPS: ${response.benchmark.rps}
              件数: ${response.benchmark.count}`);
          }
        } catch (e) {
          console.error(`${service.name}からのレスポンスをパースできませんでした`);
        }
      }
    });
  });
}
