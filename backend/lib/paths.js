import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.join(__dirname, "..");

/** Persistent data root (SQLite, wolf-ratings JSON, logs). Override on Railway with WOLF_DATA_DIR=/data */
export function getDataDir() {
  if (process.env.WOLF_DATA_DIR) {
    return path.resolve(process.env.WOLF_DATA_DIR);
  }
  return path.join(BACKEND_ROOT, "data");
}

export function getDbPath() {
  return path.join(getDataDir(), "wolf-radar.db");
}

export function getWolfRatingsDir() {
  return path.join(getDataDir(), "wolf-ratings");
}

export function getLogsDir() {
  return path.join(getDataDir(), "logs");
}

/** Bundled in Docker image; local dev falls back to frontend JSON. */
export function getUniversePath() {
  if (process.env.STOCK_UNIVERSE_PATH) {
    return path.resolve(process.env.STOCK_UNIVERSE_PATH);
  }

  const candidates = [
    path.join(getDataDir(), "stock-universe-data.json"),
    path.join(BACKEND_ROOT, "../frontend/src/data/stock-universe-data.json"),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  return candidates[0];
}
