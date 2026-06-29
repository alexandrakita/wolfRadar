import { useRedisSnapshotRead } from "../config.js";
import { resolveSnapshotDate } from "../screener-snapshot/resolve-date.js";
import { loadWolfRatingInputs, getOfficialRatingDate } from "./data-loader.js";
import {
  computeCategories,
  computeMetrics,
  formatDebugRating,
  formatPublicRating,
} from "./engine.js";
import {
  readRating,
  readRatingsAtOrAbove,
  readRatingsBatch,
  writeRating,
} from "./store.js";

const INFLIGHT = new Map();
const BATCH_CONCURRENCY = 4;

async function mapPool(items, worker, concurrency = BATCH_CONCURRENCY) {
  /** @type {Record<string, object | null>} */
  const out = {};
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      const sym = items[idx];
      out[sym] = await worker(sym);
    }
  });
  await Promise.all(runners);
  return out;
}

/** @param {Record<string, unknown>} row @param {string} ratingDate */
function ratingFromSnapshotRow(row, ratingDate) {
  return {
    wolfRating: row.wolf_rating ?? row.wolfRating ?? null,
    momentumRating: row.momentum_rating ?? row.momentumRating ?? null,
    growthRating: row.growth_rating ?? row.growthRating ?? null,
    sentimentRating: row.sentiment_rating ?? row.sentimentRating ?? null,
    activityRating: row.activity_rating ?? row.activityRating ?? null,
    symbol: row.symbol,
    ratingDate,
  };
}

/**
 * @param {string} ratingDate
 * @param {string} sym
 * @returns {Promise<object | null>}
 */
async function readCachedSnapshotRating(ratingDate, sym) {
  const { readRatingRow } = await import("../screener-snapshot/store-facade.js");
  const row = await readRatingRow(ratingDate, sym);
  if (!row || row.wolf_rating == null) return null;
  return ratingFromSnapshotRow(row, ratingDate);
}

/**
 * @param {string} symbol
 * @param {{ debug?: boolean, force?: boolean }} [opts]
 */
export async function getWolfRating(symbol, opts = {}) {
  const sym = String(symbol ?? "")
    .trim()
    .toUpperCase();
  if (!sym) return null;

  const ratingDate = getOfficialRatingDate();
  const { snapshotDate } = await resolveSnapshotDate(ratingDate);

  if (!opts.force) {
    const snapshotRating = await readCachedSnapshotRating(snapshotDate, sym);
    if (snapshotRating?.wolfRating != null) {
      return { ...snapshotRating, ratingDate: snapshotDate };
    }

    const cached = await readRating(ratingDate, sym);
    if (cached) {
      return opts.debug ? cached : stripDebug(cached);
    }
  }

  const key = `${ratingDate}:${sym}`;
  let inflight = INFLIGHT.get(key);
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const inputs = await loadWolfRatingInputs(sym);
      const metrics = computeMetrics(inputs);
      const categories = computeCategories(metrics);
      const meta = {
        symbol: sym,
        ratingDate: inputs.ratingDate ?? ratingDate,
        calculatedAt: new Date().toISOString(),
        isIpo: inputs.isIpo,
      };
      const rating = opts.debug
        ? formatDebugRating(categories, metrics, meta)
        : formatPublicRating(categories, meta);

      await writeRating(ratingDate, sym, rating);
      return rating;
    } catch (e) {
      console.error(`[wolf-rating] ${sym} failed:`, /** @type {Error} */ (e).message);
      return null;
    } finally {
      INFLIGHT.delete(key);
    }
  })();

  INFLIGHT.set(key, inflight);
  return inflight;
}

/** @param {object} rating */
function stripDebug(rating) {
  const { metrics, categoriesRaw, ...rest } = rating;
  return rest;
}

/**
 * @param {string[]} symbols
 * @param {{ debug?: boolean }} [opts]
 */
export async function getWolfRatingsBatch(symbols, opts = {}) {
  return mapPool(symbols, async (sym) => {
    try {
      return await getWolfRating(sym, opts);
    } catch (e) {
      console.error(`[wolf-rating] batch ${sym}:`, /** @type {Error} */ (e).message);
      return null;
    }
  });
}

/** Cached picks only — safe for screener (no mass Yahoo compute). */
export async function getWolfPicks(minScore = 70) {
  const requestedDate = getOfficialRatingDate();
  const { snapshotDate, usedFallback } = await resolveSnapshotDate(requestedDate);

  try {
    const { readWolfPicksFromSnapshot } = await import("../screener-snapshot/store-facade.js");
    const rows = await readWolfPicksFromSnapshot(snapshotDate, minScore);
    if (rows.length > 0) {
      /** @type {Record<string, object>} */
      const ratings = {};
      for (const row of rows) {
        ratings[row.symbol] = ratingFromSnapshotRow(row, snapshotDate);
      }
      return {
        ratingDate: snapshotDate,
        requestedDate,
        usedFallback,
        minScore,
        ratings,
        source: useRedisSnapshotRead() ? "redis" : "snapshot",
      };
    }
  } catch {
    // fall through to JSON store
  }

  const ratings = await readRatingsAtOrAbove(requestedDate, minScore);
  return { ratingDate: requestedDate, requestedDate, usedFallback: false, minScore, ratings, source: "json" };
}

/** Cached lookup for symbol list — no compute. */
export async function getCachedWolfRatings(symbols) {
  const requestedDate = getOfficialRatingDate();
  const { snapshotDate, usedFallback } = await resolveSnapshotDate(requestedDate);

  if (useRedisSnapshotRead()) {
    const { readRatingsBatch: readRedisBatch } = await import("../screener-snapshot/redis-store.js");
    const ratings = await readRedisBatch(snapshotDate, symbols);
    return { ratingDate: snapshotDate, requestedDate, usedFallback, ratings, source: "redis" };
  }

  try {
    const { readRatingRow } = await import("../screener-snapshot/store-facade.js");
    /** @type {Record<string, object | null>} */
    const ratings = {};
    for (const sym of symbols) {
      const row = await readRatingRow(snapshotDate, sym);
      ratings[sym] = row?.wolf_rating != null ? ratingFromSnapshotRow(row, snapshotDate) : null;
    }
    if (Object.values(ratings).some(Boolean)) {
      return { ratingDate: snapshotDate, requestedDate, usedFallback, ratings, source: "snapshot" };
    }
  } catch {
    // fall through
  }

  const ratings = await readRatingsBatch(requestedDate, symbols);
  return { ratingDate: requestedDate, requestedDate, usedFallback: false, ratings, source: "json" };
}

/** Top ratings from snapshot (Redis/SQLite) or JSON fallback. */
export async function getTopRatings(limit = 20) {
  const requestedDate = getOfficialRatingDate();
  const { snapshotDate } = await resolveSnapshotDate(requestedDate);

  try {
    const { readWolfPicksFromSnapshot } = await import("../screener-snapshot/store-facade.js");
    const rows = await readWolfPicksFromSnapshot(snapshotDate, 0);
    if (rows.length > 0) {
      return rows
        .filter((r) => r.wolf_rating != null)
        .sort((a, b) => (b.wolf_rating ?? 0) - (a.wolf_rating ?? 0))
        .slice(0, limit)
        .map((row) => ratingFromSnapshotRow(row, snapshotDate));
    }
  } catch {
    // fall through
  }

  const { readTopRatings } = await import("./store.js");
  return readTopRatings(requestedDate, limit);
}
