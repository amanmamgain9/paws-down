# One image runs all of Paws Down: the server, the built web app, and the wingcats.
FROM node:24-slim
WORKDIR /app

COPY . .
RUN npm ci --no-audit --no-fund && npm -w @paws-down/web run build

# The demo keeps its data in memory, so every restart is a clean start.
ENV PAWS_DOWN_DB=:memory: \
    PORT=4000
EXPOSE 4000

CMD ["sh", "scripts/start-hosted.sh"]
