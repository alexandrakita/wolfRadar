import RedisService from "../redis.js";
import { dbRowToApiRow } from "./row-mapper.js";
import {
  currentDateKey,
  metaKey,
  picksKey,
  ratingKey,
  rowsKey,
} from "./redis-keys.js";

function getRedis() {
  const redis = RedisService.tryCreate();
  if (!redis) throw new Error("Upstash Redis is not configured");
  return redis;
}

/** @returns {Promise<string | null>} */
export async function getCurrentSnapshotDate() {
  const redis = getRedis();
  const date = await redis.getJson(currentDateKey());
  return typeof date === "string" ? date : null;
}

/** @param {string} snapshotDate */
export async function readAllSnapshotRows(snapshotDate) {
  const redis = getRedis();
  const rows = await redis.getJson(rowsKey(snapshotDate));
  return Array.isArray(rows) ? rows : [];
}

/** @param {string} snapshotDate */
export async function countSnapshotRows(snapshotDate) {
  const rows = await readAllSnapshotRows(snapshotDate);
  return rows.length;
}

/** @param {string} snapshotDate */
export async function countSnapshotRowsWithPerf(snapshotDate) {
  const rows = await readAllSnapshotRows(snapshotDate);
  return rows.filter((r) => r.perf_1m != null && r.perf_3m != null).length;
}

/** @param {string} [snapshotDate] */
export async function getSnapshotMeta(snapshotDate) {
  const redis = getRedis();
  if (snapshotDate) {
    return (await redis.getJson(metaKey(snapshotDate))) ?? null;
  }
  const current = await getCurrentSnapshotDate();
  if (!current) return null;
  return (await redis.getJson(metaKey(current))) ?? null;
}

/** @param {string} snapshotDate @param {number} minScore */
export async function countWolfPicks(snapshotDate, minScore = 70) {
  const picks = await readWolfPicksFromSnapshot(snapshotDate, minScore);
  return picks.length;
}

/** @param {string} snapshotDate @param {number} minScore */
export async function readWolfPicksFromSnapshot(snapshotDate, minScore = 70) {
  const redis = getRedis();

  if (minScore >= 70) {
    const cached = await redis.getJson(picksKey(snapshotDate));
    if (Array.isArray(cached) && cached.length > 0) {
      return cached.filter((r) => (r.wolf_rating ?? r.wolfRating) >= minScore);
    }
  }

  const rows = await readAllSnapshotRows(snapshotDate);
  return rows
    .filter((r) => r.wolf_rating != null && r.wolf_rating >= minScore)
    .sort((a, b) => (b.wolf_rating ?? 0) - (a.wolf_rating ?? 0));
}

/** @param {string} snapshotDate @param {string} symbol */
export async function readRatingRow(snapshotDate, symbol) {
  const sym = String(symbol ?? "")
    .trim()
    .toUpperCase();
  if (!sym) return null;

  const redis = getRedis();
  const hit = await redis.getJson(ratingKey(snapshotDate, sym));
  if (hit) return hit;

  const rows = await readAllSnapshotRows(snapshotDate);
  return rows.find((r) => String(r.symbol).toUpperCase() === sym) ?? null;
}

/**
 * Publish full snapshot to Redis (from SQLite rows or in-memory records).
 * @param {string} snapshotDate
 * @param {Record<string, unknown>[]} rows
 * @param {{ totalSymbols?: number, processedCount?: number, errorCount?: number }} [meta]
 */
export async function publishSnapshotToRedis(snapshotDate, rows, meta = {}) {
  const redis = getRedis();
  const picks = rows.filter((r) => r.wolf_rating != null && r.wolf_rating >= 70);

  const metaPayload = {
    snapshot_date: snapshotDate,
    started_at: meta.started_at ?? new Date().toISOString(),
    completed_at: new Date().toISOString(),
    total_symbols: meta.total_symbols ?? rows.length,
    processed_count: meta.processed_count ?? rows.length,
    error_count: meta.error_count ?? 0,
    source: "redis",
  };

  await redis.setJson(currentDateKey(), snapshotDate);
  await redis.setJson(metaKey(snapshotDate), metaPayload);
  await redis.setJson(rowsKey(snapshotDate), rows);
  await redis.setJson(picksKey(snapshotDate), picks);

  for (const row of rows) {
    const sym = String(row.symbol ?? "").toUpperCase();
    if (!sym) continue;
    await redis.setJson(ratingKey(snapshotDate, sym), row);
  }

  return {
    snapshotDate,
    rowCount: rows.length,
    picksCount: picks.length,
  };
}

/** @param {string} snapshotDate @param {number} minScore */
export async function readWolfPicksAsRatings(snapshotDate, minScore = 70) {
  const rows = await readWolfPicksFromSnapshot(snapshotDate, minScore);
  /** @type {Record<string, object>} */
  const ratings = {};
  for (const row of rows) {
    const api = dbRowToApiRow(row);
    ratings[row.symbol] = {
      wolfRating: api.wolfRating,
      momentumRating: api.momentumRating,
      growthRating: api.growthRating,
      sentimentRating: api.sentimentRating,
      activityRating: api.activityRating,
      symbol: row.symbol,
      ratingDate: snapshotDate,
    };
  }
  return ratings;
}

/** @param {string} snapshotDate @param {string[]} symbols */
export async function readRatingsBatch(snapshotDate, symbols) {
  /** @type {Record<string, object | null>} */
  const out = {};
  for (const sym of symbols) {
    const row = await readRatingRow(snapshotDate, sym);
    if (!row) {
      out[sym] = null;
      continue;
    }
    const api = dbRowToApiRow(row);
    out[sym] = {
      wolfRating: api.wolfRating,
      momentumRating: api.momentumRating,
      growthRating: api.growthRating,
      sentimentRating: api.sentimentRating,
      activityRating: api.activityRating,
      symbol: row.symbol,
      ratingDate: snapshotDate,
    };
  }
  return out;
}
