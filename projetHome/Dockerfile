FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV EXPO_NO_TELEMETRY=1
EXPOSE 19006 8081 19000

CMD ["npm", "run", "web", "--", "--non-interactive", "--port", "19006", "--host", "0.0.0.0"]
