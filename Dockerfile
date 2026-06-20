# wolfRadar backend — production image (Railway / Docker)
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./
COPY frontend/src/data/stock-universe-data.json ./data/stock-universe-data.json

ENV NODE_ENV=production
ENV PORT=3333
ENV WOLF_DATA_DIR=/data
ENV STOCK_UNIVERSE_PATH=/app/backend/data/stock-universe-data.json

EXPOSE 3333

# Mount a Railway volume at /data for SQLite + wolf-ratings JSON
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3333)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]
