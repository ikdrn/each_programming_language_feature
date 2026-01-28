FROM php:8.2-cli

WORKDIR /app

RUN docker-php-ext-install pdo pdo_sqlite

COPY . .

EXPOSE 7001

CMD ["php", "-S", "127.0.0.1:7001", "main.php"]
