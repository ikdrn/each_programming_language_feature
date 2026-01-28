FROM php:8.2-cli

WORKDIR /app

RUN docker-php-ext-install pdo pdo_sqlite

COPY . .

EXPOSE 7002

CMD ["php", "-S", "127.0.0.1:7002", "main.php"]
