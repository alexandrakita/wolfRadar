import { loadSymbolMetricsForSnapshot } from "../screener-metrics.js";
import { useRedisSnapshotWrite } from "../config.js";
import { getOfficialRatingDate } from "../wolf-rating/data-loader.js";
import { getWolfRating } from "../wolf-rating/service.js";
import { buildSnapshotRecord } from "./row-mapper.js";
import { publishSnapshotToRedis } from "./store-facade.js";
import {
  countSnapshotRowsWithPerf,
  hasSnapshotRow,
  incrementSnapshotProgress,
  listSnapshotSymbolsMissingPerf,
  readAllSnapshotRows,
  getSnapshotMeta,
  snapshotRowHasPerf,
  startSnapshotMeta,
  updateSnapshotMeta,
  upsertSnapshotRow,
} from "./store.js";
import { getUniverseMeta, loadUniverseSymbols } from "./universe.js";

const BATCH_CONCURRENCY = Number(process.env.SNAPSHOT_CONCURRENCY) || 2;
const BACKFILL_DELAY_MS = Number(process.env.SNAPSHOT_BACKFILL_DELAY_MS) || 400;

async function mapPool(items, worker, concurrency = BATCH_CONCURRENCY, delayMs = 0) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
      if (delayMs > 0) {
        await new Promise((r) => {
          setTimeout(r, delayMs);
        });
      }
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

  if (
    opts.skipExisting &&
    hasSnapshotRow(snapshotDate, symbol) &&
    snapshotRowHasPerf(snapshotDate, symbol)
  ) {
    incrementSnapshotProgress(snapshotDate, false);
    return { ok: true, skipped: true };
  }

  let hadError = false;
  try {
    const meta = getUniverseMeta(symbol);
    const metrics = await loadSymbolMetricsForSnapshot(symbol);
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
 * @param {{ force?: boolean, symbols?: string[], snapshotDate?: string, concurrency?: number, onProgress?: (info: object) => void }} [opts]
 */
export async function buildFullSnapshot(opts = {}) {
  const snapshotDate = opts.snapshotDate ?? getOfficialRatingDate();
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

  const concurrency = opts.concurrency ?? BATCH_CONCURRENCY;

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
    concurrency,
  );

  const missingPerf = listSnapshotSymbolsMissingPerf(snapshotDate);
  if (missingPerf.length) {
    console.log(
      `[snapshot] backfill perf for ${missingPerf.length}/${allSymbols.length} symbols (delay ${BACKFILL_DELAY_MS}ms)…`,
    );
    let backfill = 0;
    await mapPool(
      missingPerf,
      async (sym) => {
        await buildSymbolSnapshot(sym, snapshotDate, { skipExisting: false });
        backfill += 1;
        if (backfill % 25 === 0 || backfill === missingPerf.length) {
          console.log(`[snapshot] backfill ${backfill}/${missingPerf.length} (${sym})`);
        }
      },
      1,
      BACKFILL_DELAY_MS,
    );
  }

  const perfCount = countSnapshotRowsWithPerf(snapshotDate);
  console.log(`[snapshot] perf coverage: ${perfCount}/${allSymbols.length}`);

  updateSnapshotMeta(snapshotDate, { completed: true });
  report();

  let redisPublish = null;
  if (useRedisSnapshotWrite()) {
    try {
      const rows = readAllSnapshotRows(snapshotDate);
      const meta = {
        ...(getSnapshotMeta(snapshotDate) ?? {}),
        perf_row_count: perfCount,
      };
      redisPublish = await publishSnapshotToRedis(snapshotDate, rows, meta);
      console.log(
        `[snapshot] Redis publish: ${redisPublish.rowCount} rows, ${redisPublish.picksCount} picks`,
      );
    } catch (e) {
      console.error("[snapshot] Redis publish failed:", /** @type {Error} */ (e).message);
    }
  }

  return {
    snapshotDate,
    total: allSymbols.length,
    rowCount: allSymbols.length,
    perfRowCount: perfCount,
    redisPublish,
  };
}
