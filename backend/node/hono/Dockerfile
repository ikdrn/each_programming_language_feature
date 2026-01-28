FROM node:20-alpine

WORKDIR /app

RUN npm install hono @hono/node-server sqlite3

COPY db.js .
COPY main.js .

EXPOSE 3002

CMD ["node", "main.js"]
