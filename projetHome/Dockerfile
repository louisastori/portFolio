FROM node:20-bookworm-slim

WORKDIR /app

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server/index.js"]
