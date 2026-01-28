FROM rust:1.75 as builder

WORKDIR /app

COPY Cargo.toml .
COPY main.rs .
COPY db.rs .

RUN cargo build --release

FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/target/release/app .

EXPOSE 5001

CMD ["./app"]
