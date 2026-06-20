import { loadSymbolMetrics } from "../screener-metrics.js";
import { getOfficialRatingDate } from "../wolf-rating/data-loader.js";
import { getWolfRating } from "../wolf-rating/service.js";
import { buildSnapshotRecord } from "./row-mapper.js";
import {
  hasSnapshotRow,
  incrementSnapshotProgress,
  startSnapshotMeta,
  updateSnapshotMeta,
  upsertSnapshotRow,
} from "./store.js";
import { getUniverseMeta, loadUniverseSymbols } from "./universe.js";

const BATCH_CONCURRENCY = 4;

async function mapPool(items, worker, concurrency = BATCH_CONCURRENCY) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

/**
 * @param {string} sym
 * @param {string} snapshotDate
 * @param {{ skipExisting?: boolean }} [opts]
 */
export async function buildSymbolSnapshot(sym, snapshotDate, opts = {}) {
  const symbol = String(sym ?? "")
    .trim()
    .toUpperCase();
  if (!symbol) return { ok: false, skipped: false };

  if (opts.skipExisting && hasSnapshotRow(snapshotDate, symbol)) {
    incrementSnapshotProgress(snapshotDate, false);
    return { ok: true, skipped: true };
  }

  let hadError = false;
  try {
    const meta = getUniverseMeta(symbol);
    const metrics = await loadSymbolMetrics(symbol);
    const rating = await getWolfRating(symbol);
    const record = buildSnapshotRecord(symbol, snapshotDate, meta, metrics, rating);
    upsertSnapshotRow(record);
  } catch (e) {
    hadError = true;
    console.error(`[snapshot] ${symbol} failed:`, /** @type {Error} */ (e).message);
  } finally {
    incrementSnapshotProgress(snapshotDate, hadError);
  }

  return { ok: !hadError, skipped: false };
}

/**
 * @param {{ force?: boolean, symbols?: string[], concurrency?: number, onProgress?: (info: object) => void }} [opts]
 */
export async function buildFullSnapshot(opts = {}) {
  const snapshotDate = getOfficialRatingDate();
  const allSymbols = opts.symbols?.length
    ? opts.symbols.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
    : loadUniverseSymbols();

  startSnapshotMeta(snapshotDate, allSymbols.length);

  let processed = 0;
  const report = () => {
    opts.onProgress?.({
      snapshotDate,
      processed,
      total: allSymbols.length,
    });
  };

  await mapPool(
    allSymbols,
    async (sym) => {
      await buildSymbolSnapshot(sym, snapshotDate, { skipExisting: !opts.force });
      processed += 1;
      if (processed % 25 === 0 || processed === allSymbols.length) {
        report();
        console.log(`[snapshot] ${processed}/${allSymbols.length} (${sym})`);
      }
    },
    opts.concurrency ?? BATCH_CONCURRENCY,
  );

  updateSnapshotMeta(snapshotDate, { completed: true });
  report();

  return {
    snapshotDate,
    total: allSymbols.length,
    rowCount: allSymbols.length,
  };
}
