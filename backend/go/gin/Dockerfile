FROM golang:1.21-alpine

WORKDIR /app

COPY ../go.mod .
RUN go mod download

COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -o app main.go db.go

FROM alpine:latest

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=0 /app/app .

EXPOSE 4002

CMD ["./app"]
