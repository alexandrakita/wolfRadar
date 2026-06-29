import { useRedisSnapshotRead } from "../config.js";
import { getOfficialRatingDate } from "../wolf-rating/data-loader.js";
import { countSnapshotRows, countSnapshotRowsWithPerf } from "./store-facade.js";
import { isSnapshotComplete, isSnapshotPerfComplete } from "./snapshot-quality.js";

/** @param {string} isoDate */
function prevCalendarDate(isoDate) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** @returns {Promise<string | null>} */
async function getPublishedSnapshotDate() {
  if (!useRedisSnapshotRead()) return null;
  const { getCurrentSnapshotDate } = await import("./redis-store.js");
  return getCurrentSnapshotDate();
}

async function isUsableSnapshotDate(date) {
  const count = await countSnapshotRows(date);
  const perfCount = await countSnapshotRowsWithPerf(date);
  return count > 0 && isSnapshotComplete(count) && isSnapshotPerfComplete(perfCount);
}

/**
 * Resolve the snapshot date to read. Prefer the official date; fall back to the
 * latest published snapshot on or before that date so weekends/missed CI runs
 * still serve data instead of an empty screener.
 *
 * @param {string} [preferredDate]
 */
export async function resolveSnapshotDate(preferredDate = getOfficialRatingDate()) {
  const requestedDate = preferredDate;

  if (await isUsableSnapshotDate(requestedDate)) {
    return { snapshotDate: requestedDate, requestedDate, usedFallback: false };
  }

  const published = await getPublishedSnapshotDate();
  if (published && published <= requestedDate && (await isUsableSnapshotDate(published))) {
    return { snapshotDate: published, requestedDate, usedFallback: true };
  }

  let cursor = requestedDate;
  for (let i = 0; i < 7; i += 1) {
    cursor = prevCalendarDate(cursor);
    if (await isUsableSnapshotDate(cursor)) {
      return { snapshotDate: cursor, requestedDate, usedFallback: true };
    }
  }

  return { snapshotDate: requestedDate, requestedDate, usedFallback: false };
}
