# Technology Stack Comparison & Benchmark Suite

A comprehensive comparison and benchmarking suite for modern web development technologies including Frontend frameworks, Backend languages/frameworks, and Databases.

## Overview

This project provides:
- **Code samples** for popular technologies (React, Vue.js, Svelte, Node.js, Go, Python, Express, Gin, FastAPI)
- **Docker Compose setup** for easy testing and comparison
- **Load testing scripts** using k6 for performance benchmarking
- **Comprehensive comparison documentation** (COMPARISON.md)

## Project Structure

```
.
├── frontend/
│   ├── react/              # React sample (Hello World + API consumption)
│   ├── vue/                # Vue.js sample
│   └── svelte/             # Svelte sample
├── backend/
│   ├── node-express/       # Node.js + Express API
│   ├── go-gin/             # Go + Gin API
│   └── python-fastapi/     # Python + FastAPI
├── k6/
│   └── load-test.js        # Load testing script
├── docker-compose.yml      # Docker Compose configuration
├── COMPARISON.md           # Detailed technology comparison
└── README.md               # This file
```

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- k6 (optional, for local testing)

### Running the Services

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost:3001/api/hello  # Node.js + Express
curl http://localhost:3002/api/hello  # Go + Gin
curl http://localhost:3003/api/hello  # Python + FastAPI
```

### Running Load Tests

```bash
# Using Docker Compose
docker-compose run k6 run /scripts/load-test.js

# Or locally (if k6 installed)
k6 run k6/load-test.js
```

### Stopping Services

```bash
docker-compose down
```

## API Endpoints

All services implement the same API interface:

### GET /api/hello
Returns a greeting message with timestamp

**Response:**
```json
{
  "message": "Hello from [Framework]",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "framework": "[Framework Name]"
}
```

### GET /api/data
Returns 100 sample data items

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "value": 0.0
    },
    ...
  ]
}
```

### POST /api/echo
Echoes back the posted data

**Request:**
```json
{
  "message": "Your message here"
}
```

**Response:**
```json
{
  "echo": {
    "message": "Your message here"
  },
  "received": "2025-01-27T12:00:00.000Z"
}
```

## Database Connectivity

The Docker Compose setup includes three databases:

### PostgreSQL
- **Host**: localhost:5432
- **Username**: benchuser
- **Password**: benchpass
- **Database**: benchmark_db

```bash
# Connect
psql -h localhost -U benchuser -d benchmark_db
```

### MongoDB
- **Host**: localhost:27017
- **Username**: benchuser
- **Password**: benchpass
- **Database**: benchmark_db

```bash
# Connect
mongosh "mongodb://benchuser:benchpass@localhost:27017/benchmark_db"
```

### Redis
- **Host**: localhost:6379
- **No authentication** (default setup)

```bash
# Connect
redis-cli -h localhost
```

## Performance Comparison

See [COMPARISON.md](./COMPARISON.md) for detailed performance metrics, DX comparison, and recommendations.

### Quick Summary
| Framework | Avg Response | RPS | Memory |
|-----------|-------------|-----|--------|
| Go + Gin | ~2ms | 3,500+ | ~30MB |
| Node.js + Express | ~8ms | 1,800+ | ~120MB |
| Python + FastAPI | ~12ms | 1,200+ | ~90MB |

## Technology Details

### Frontend
- **React**: Component-based UI library
- **Vue.js**: Progressive framework with reactive data binding
- **Svelte**: Compiler-based framework with minimal runtime

### Backend Languages
- **Node.js**: JavaScript runtime with non-blocking I/O
- **Go**: Compiled language with built-in concurrency
- **Python**: Interpreted language with excellent ecosystem

### Backend Frameworks
- **Express**: Minimalist web framework for Node.js
- **Gin**: Fast and lightweight web framework for Go
- **FastAPI**: Modern async web framework for Python

### Databases
- **PostgreSQL**: Powerful RDBMS with advanced features
- **MongoDB**: Flexible NoSQL document database
- **Redis**: In-memory data store for caching and sessions

## Development Tips

### Adding a New Backend Framework
1. Create directory: `backend/[lang]-[framework]/`
2. Implement API endpoints matching the interface
3. Create Dockerfile
4. Add service to docker-compose.yml
5. Update k6 load test scripts

### Modifying Load Tests
Edit `k6/load-test.js` to:
- Change VU (Virtual Users) count
- Adjust test duration
- Add new endpoints to test
- Modify thresholds

### Viewing Benchmark Results
```bash
# Extract results
docker cp bench_k6:/app/results/results.json ./results.json

# View in JSON format
cat results.json
```

## Troubleshooting

### Services won't start
```bash
# Clear containers and try again
docker-compose down -v
docker-compose up -d
```

### Port conflicts
Modify port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change first number to unused port
```

### Database connection issues
- Ensure services are healthy: `docker-compose ps`
- Check logs: `docker-compose logs [service-name]`
- Verify network: `docker-compose exec [service] ping [other-service]`

## Contributing

Contributions welcome! Please:
1. Follow existing code style
2. Test locally before submitting
3. Update documentation
4. Add benchmarks for new technologies

## License

MIT License - See LICENSE file for details

## Resources

- [React Documentation](https://react.dev)
- [Vue.js Documentation](https://vuejs.org)
- [Svelte Documentation](https://svelte.dev)
- [Node.js Documentation](https://nodejs.org)
- [Go Documentation](https://golang.org/doc)
- [Python Documentation](https://python.org/doc)
- [Express Documentation](https://expressjs.com)
- [Gin Documentation](https://gin-gonic.com)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [k6 Documentation](https://k6.io/docs)

---

**Last Updated**: January 2025
