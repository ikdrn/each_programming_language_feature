FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod ./

RUN go mod download 2>/dev/null || true

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o bin/server gin-fw/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/bin/server .

EXPOSE 3002

CMD ["./server"]
