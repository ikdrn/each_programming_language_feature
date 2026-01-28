# Technology Stack Comparison and Benchmark

A comprehensive comparison of technology stacks across different programming languages and frameworks. This project implements identical CRUD APIs in 21 different backend implementations and 7 frontend frameworks, with complete performance benchmarking.

## Project Structure

```
.
├── backend/                    # Backend implementations (7 languages × 3 frameworks)
│   ├── node/                   # Node.js (Vanilla, Express, Hono, NestJS)
│   ├── go/                     # Go (Vanilla, Gin, Echo)
│   ├── rust/                   # Rust (Vanilla, Axum, Actix-web)
│   ├── python/                 # Python (Vanilla, FastAPI, Django)
│   ├── php/                    # PHP (Vanilla, Laravel)
│   ├── java/                   # Java (Vanilla, Spring Boot)
│   └── ruby/                   # Ruby (Vanilla, Rails)
├── frontend/                   # Frontend implementations (7 frameworks)
│   ├── react/                  # React with Vite
│   ├── vue/                    # Vue.js 3 with Vite
│   ├── angular/                # Angular 17
│   ├── svelte/                 # Svelte with Vite
│   ├── solidjs/                # SolidJS with Vite
│   ├── nextjs/                 # Next.js 14
│   └── nuxt/                   # Nuxt 3
├── benchmark/                  # k6 load testing scripts
├── docker-compose.yml          # Orchestration of all services
└── database/                   # Database schemas (PostgreSQL, MySQL, SQLite, MongoDB)
```

## Backend Implementations

### Architecture

Each backend implementation follows a consistent 3-layer architecture:

1. **Database Layer** (`db.*`): CRUD operations, transaction handling, performance metrics
2. **API Layer** (`main.*`): HTTP routing only
3. **Containerization** (`Dockerfile`): Language-specific deployment

### Implemented Operations

All backends implement:

- **CRUD Operations**: Create, Read, Update, Delete users
- **Batch Operations**: 1000-item transaction benchmark
- **Performance Tracking**: Operation timing (min/max/avg/total in milliseconds)
- **Health Check**: GET / endpoint

### API Endpoints

```
GET  /                    Health check
GET  /users               List all users
POST /users               Create user
GET  /users/:id           Get specific user
PUT  /users/:id           Update user
DELETE /users/:id         Delete user
POST /benchmark           Run 1000-item transaction benchmark
```

### Ports

| Language | Framework | Port | Docker | Native |
|----------|-----------|------|--------|--------|
| Node.js | Vanilla | 3001 | ✓ | ✓ |
| Node.js | Express | 3002 | ✓ | ✓ |
| Node.js | Hono | 3003 | ✓ | ✓ |
| Go | Vanilla | 4001 | ✓ | ✓ |
| Go | Gin | 4002 | ✓ | ✓ |
| Go | Echo | 4003 | ✓ | ✓ |
| Rust | Vanilla | 5001 | ✓ | ✓ |
| Rust | Axum | 5002 | ✓ | ✓ |
| Rust | Actix-web | 5003 | ✓ | ✓ |
| Python | Vanilla | 6001 | ✓ | ✓ |
| Python | FastAPI | 6002 | ✓ | ✓ |
| Python | Django | 6003 | ✓ | ✓ |
| PHP | Vanilla | 7001 | ✓ | ✓ |
| PHP | Laravel | 7002 | ✓ | ✓ |
| Java | Vanilla | 8001 | ✓ | ✗ |
| Java | Spring Boot | 8002 | ✓ | ✗ |
| Ruby | Vanilla | 9001 | ✓ | ✓ |
| Ruby | Rails | 9002 | ✓ | ✓ |

## Frontend Implementations

Lightweight frontend applications for testing backend integration:

- **React** (18.2) with Vite
- **Vue.js** (3.3) with Vite
- **Angular** (17) standalone components
- **Svelte** (4.2) with Vite
- **SolidJS** (1.8) with TypeScript
- **Next.js** (14) App Router
- **Nuxt** (3) composition API

### Features

All frontend implementations include:

- User CRUD operations
- List display with pagination
- Real-time updates
- Benchmark triggering
- Performance metrics display

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for running without Docker)
- Go 1.21+
- Rust 1.70+
- Python 3.11+
- PHP 8.2+
- Java 17+
- Ruby 3.2+
- k6 (for benchmarking)

### Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

All services will be available at their respective ports (3001-9002).

### Run Individual Backend Services

#### Node.js Vanilla
```bash
cd backend/node/vanilla
npm install
npm start
```

#### Python FastAPI
```bash
cd backend/python/fastapi
pip install -r requirements.txt
python main.py
```

#### Go Gin
```bash
cd backend/go/gin
go mod download
go run main.go db.go
```

#### Rust Axum
```bash
cd backend/rust/axum
cargo run
```

## Benchmarking

### k6 Load Testing

```bash
# Run comparison benchmark (1000-item transaction on each service)
k6 run benchmark/comparison.js

# Run load test (ramping users)
k6 run benchmark/load-test.js
```

### Response Format

All endpoints return consistent JSON structure:

```json
{
  "success": true,
  "data": { ... },
  "count": 1,
  "performance": {
    "CREATE": {
      "count": 5,
      "totalMs": 2.345,
      "minMs": 0.423,
      "maxMs": 0.589,
      "avgMs": "0.469"
    }
  }
}
```

## Performance Metrics

### Tracking

Operations are tracked with:
- **Type**: Operation type (CREATE, READ, UPDATE, DELETE, BENCHMARK)
- **Duration**: Execution time in milliseconds
- **Timestamp**: When operation occurred

### Aggregation

Performance report includes per-operation-type:
- Count: Number of operations
- Total: Sum of all durations
- Min: Minimum duration
- Max: Maximum duration
- Average: Mean duration

## Technology Decisions

### Database

- **SQLite in-memory**: For lightweight, portable testing
- **Transactional Benchmark**: 1000-item INSERT in single transaction
- **Performance Measurement**: Nanosecond precision converted to milliseconds

### API Design

- **REST JSON API**: Consistent interface across all implementations
- **Error Handling**: Standard HTTP status codes
- **CORS**: Enabled for frontend integration
- **Port Assignment**: Non-overlapping ranges per language

### Containerization

- **Multi-stage builds**: For optimized image sizes
- **Language-specific optimizations**: Alpine/slim base images
- **Health checks**: Optional for production use

## Development Guidelines

### Adding New Implementation

1. Create directory: `backend/{language}/{framework}/`
2. Create `db.*` file with Database class implementing:
   - `create_user(name, email, age)`
   - `get_user(id)`
   - `get_all_users()`
   - `update_user(id, name, email, age)`
   - `delete_user(id)`
   - `benchmark(count)`
   - `get_performance_report()`
3. Create `main.*` file with HTTP routing
4. Create `Dockerfile`
5. Create configuration files (package.json, requirements.txt, etc.)
6. Add entry to docker-compose.yml

### Database Layer Contract

```
class Database:
    def create_user(name, email, age) -> dict
    def get_user(id) -> dict | null
    def get_all_users() -> list[dict]
    def update_user(id, name, email, age) -> bool
    def delete_user(id) -> bool
    def benchmark(count) -> dict
    def get_performance_report() -> dict
```

## Contributing

Each implementation must:
- Follow the API specification exactly
- Implement all 7 endpoints
- Track operation performance
- Return consistent JSON responses
- Include a Dockerfile
- Be deployable via Docker Compose

## Version History

- **初版 (v1)**: Database schemas and Node.js Vanilla
- **2版 (v2)**: Node.js Express, Hono, NestJS
- **3版 (v3)**: Go Vanilla, Gin
- **4版 (v4)**: Go Echo, Rust Vanilla
- **5版 (v5)**: Rust Axum, Actix-web
- **6版 (v6)**: Python Vanilla, FastAPI, Django
- **7版 (v7)**: PHP Vanilla, Laravel
- **8版 (v8)**: Java Vanilla, Spring Boot
- **9版 (v9)**: Ruby Vanilla, Rails
- **10版 (v10)**: Frontend implementations (React, Vue, Angular, Svelte, SolidJS, Next.js, Nuxt)
- **11版 (v11)**: Docker Compose orchestration, k6 benchmarks

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3001/

# Create user
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","age":30}'

# Get users
curl http://localhost:3001/users

# Run benchmark
curl -X POST http://localhost:3001/benchmark \
  -H "Content-Type: application/json" \
  -d '{"count":1000}'
```

### Automated Testing

All implementations can be tested simultaneously:

```bash
k6 run benchmark/load-test.js
k6 run benchmark/comparison.js
```

## License

This project is for educational and comparison purposes.

## Notes

- All implementations use in-memory SQLite for testing
- Frontend implementations are simplified UI for API testing
- Performance metrics are collected during request processing
- Services are independent and can be run individually
