import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m30s', target: 20 }, // Stay at 20 users
    { duration: '20s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URLS = {
  nodeExpress: 'http://node-express:3000',
  goGin: 'http://go-gin:3000',
  pythonFastAPI: 'http://python-fastapi:3000',
};

export function testNodeExpress() {
  const url = `${BASE_URLS.nodeExpress}/api/hello`;
  const response = http.get(url);

  check(response, {
    'Node.js status is 200': (r) => r.status === 200,
    'Node.js response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function testGoGin() {
  const url = `${BASE_URLS.goGin}/api/hello`;
  const response = http.get(url);

  check(response, {
    'Go status is 200': (r) => r.status === 200,
    'Go response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function testPythonFastAPI() {
  const url = `${BASE_URLS.pythonFastAPI}/api/hello`;
  const response = http.get(url);

  check(response, {
    'Python status is 200': (r) => r.status === 200,
    'Python response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function testDataEndpoints() {
  const endpoints = [
    `${BASE_URLS.nodeExpress}/api/data`,
    `${BASE_URLS.goGin}/api/data`,
    `${BASE_URLS.pythonFastAPI}/api/data`,
  ];

  endpoints.forEach((url) => {
    const response = http.get(url);
    check(response, {
      'Data endpoint status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}

export function testPostEndpoints() {
  const endpoints = [
    `${BASE_URLS.nodeExpress}/api/echo`,
    `${BASE_URLS.goGin}/api/echo`,
    `${BASE_URLS.pythonFastAPI}/api/echo`,
  ];

  const payload = JSON.stringify({
    message: 'Hello from k6 benchmark',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  endpoints.forEach((url) => {
    const response = http.post(url, payload, params);
    check(response, {
      'POST status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);
}

export default function () {
  testNodeExpress();
  testGoGin();
  testPythonFastAPI();
  testDataEndpoints();
  testPostEndpoints();
}
