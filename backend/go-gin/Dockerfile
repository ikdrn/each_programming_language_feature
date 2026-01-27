FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum* ./

RUN go mod download 2>/dev/null || true

COPY . .

RUN go build -o app .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/app .

EXPOSE 3000

CMD ["./app"]
