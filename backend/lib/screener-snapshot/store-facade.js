import { useRedisSnapshotRead } from "../config.js";

async function sqliteStore() {
  return import("./store.js");
}

async function redisStore() {
  return import("./redis-store.js");
}

/** @param {string} snapshotDate */
export async function readAllSnapshotRows(snapshotDate) {
  if (useRedisSnapshotRead()) {
    return (await redisStore()).readAllSnapshotRows(snapshotDate);
  }
  return (await sqliteStore()).readAllSnapshotRows(snapshotDate);
}

/** @param {string} snapshotDate */
export async function countSnapshotRows(snapshotDate) {
  if (useRedisSnapshotRead()) {
    return (await redisStore()).countSnapshotRows(snapshotDate);
  }
  return (await sqliteStore()).countSnapshotRows(snapshotDate);
}

/** @param {string} snapshotDate */
export async function countSnapshotRowsWithPerf(snapshotDate) {
  if (useRedisSnapshotRead()) {
    return (await redisStore()).countSnapshotRowsWithPerf(snapshotDate);
  }
  return (await sqliteStore()).countSnapshotRowsWithPerf(snapshotDate);
}

/** @param {string} [snapshotDate] */
export async function getSnapshotMeta(snapshotDate) {
  if (useRedisSnapshotRead()) {
    return (await redisStore()).getSnapshotMeta(snapshotDate);
  }
  return (await sqliteStore()).getSnapshotMeta(snapshotDate);
}

/** @param {string} snapshotDate @param {number} [minScore] */
export async function countWolfPicks(snapshotDate, minScore = 70) {
  if (useRedisSnapshotRead()) {
    return (await redisStore()).countWolfPicks(snapshotDate, minScore);
  }
  return (await sqliteStore()).countWolfPicks(snapshotDate, minScore);
}

/** @param {string} snapshotDate @param {number} [minScore] */
export async function readWolfPicksFromSnapshot(snapshotDate, minScore = 70) {
  if (useRedisSnapshotRead()) {
    return (await redisStore()).readWolfPicksFromSnapshot(snapshotDate, minScore);
  }
  return (await sqliteStore()).readWolfPicksFromSnapshot(snapshotDate, minScore);
}

/** @param {string} snapshotDate @param {string} symbol */
export async function readRatingRow(snapshotDate, symbol) {
  if (useRedisSnapshotRead()) {
    return (await redisStore()).readRatingRow(snapshotDate, symbol);
  }
  const rows = (await sqliteStore()).readAllSnapshotRows(snapshotDate);
  const sym = String(symbol).toUpperCase();
  return rows.find((r) => String(r.symbol).toUpperCase() === sym) ?? null;
}

/** @param {string} snapshotDate @param {Record<string, unknown>[]} rows @param {object} [meta] */
export async function publishSnapshotToRedis(snapshotDate, rows, meta) {
  return (await redisStore()).publishSnapshotToRedis(snapshotDate, rows, meta);
}

/** @returns {Promise<string | null>} */
export async function getCurrentSnapshotDate() {
  if (!useRedisSnapshotRead()) return null;
  return (await redisStore()).getCurrentSnapshotDate();
}
