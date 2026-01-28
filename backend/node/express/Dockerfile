FROM node:20-alpine

WORKDIR /app

RUN npm install express sqlite3

COPY db.js .
COPY main.js .

EXPOSE 3001

CMD ["node", "main.js"]
