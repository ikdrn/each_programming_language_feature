# Technology Stack Benchmark Suite

Load testing scripts using k6 for comparing performance across different technology stacks.

## Prerequisites

- k6 must be installed on your system
- All backend services must be running (use Docker Compose)

## Running Benchmarks

### Start all services

```bash
docker-compose up -d
```

### Run comparison benchmark

This script runs a single benchmark test (1000 insertions) on each service:

```bash
k6 run benchmark/comparison.js
```

Output will show duration in milliseconds and requests per second (RPS) for each implementation.

### Run load test

This script performs a ramping load test across all services:

```bash
k6 run benchmark/load-test.js
```

The test ramps up to 10 concurrent users over 30 seconds, maintains that load for 1.5 minutes, then ramps down.

## Available Test Endpoints

All services implement the following endpoints:

- `GET /` - Health check
- `GET /users` - Get all users
- `POST /users` - Create user
- `GET /users/:id` - Get specific user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `POST /benchmark` - Run benchmark (default 1000 insertions)

## Services and Ports

### Node.js
- Vanilla: 3001
- Express: 3002
- Hono: 3003

### Go
- Vanilla: 4001
- Gin: 4002
- Echo: 4003

### Rust
- Vanilla: 5001
- Axum: 5002
- Actix-web: 5003

### Python
- Vanilla: 6001
- FastAPI: 6002
- Django: 6003

### PHP
- Vanilla: 7001
- Laravel: 7002

### Java
- Vanilla: 8001
- Spring Boot: 8002

### Ruby
- Vanilla: 9001
- Rails: 9002
