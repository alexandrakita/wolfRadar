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

  if (!opts.force) {
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
  const ratingDate = getOfficialRatingDate();

  try {
    const { readWolfPicksFromSnapshot } = await import("../screener-snapshot/store.js");
    const { dbRowToApiRow } = await import("../screener-snapshot/row-mapper.js");
    const rows = readWolfPicksFromSnapshot(ratingDate, minScore);
    if (rows.length > 0) {
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
          ratingDate,
        };
      }
      return { ratingDate, minScore, ratings, source: "snapshot" };
    }
  } catch {
    // fall through to JSON store
  }

  const ratings = await readRatingsAtOrAbove(ratingDate, minScore);
  return { ratingDate, minScore, ratings, source: "json" };
}

/** Cached lookup for symbol list — no compute. */
export async function getCachedWolfRatings(symbols) {
  const ratingDate = getOfficialRatingDate();
  const ratings = await readRatingsBatch(ratingDate, symbols);
  return { ratingDate, ratings };
}
