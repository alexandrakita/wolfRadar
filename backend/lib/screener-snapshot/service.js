import { getOfficialRatingDate } from "../wolf-rating/data-loader.js";
import { passesSearch, passesStockFilters } from "./filters.js";
import { dbRowToApiRow } from "./row-mapper.js";
import { resolveSnapshotDate } from "./resolve-date.js";
import {
  getMinSnapshotRows,
  getMinSnapshotPerfRows,
  incompletePerfMessage,
  incompleteSnapshotMessage,
  isSnapshotComplete,
  isSnapshotPerfComplete,
} from "./snapshot-quality.js";
import {
  countSnapshotRows,
  countSnapshotRowsWithPerf,
  countWolfPicks,
  getSnapshotMeta,
  readAllSnapshotRows,
} from "./store-facade.js";

function compareRows(a, b, field, order) {
  const mul = order === "asc" ? 1 : -1;
  const tie = () => mul * String(a.sym ?? "").localeCompare(String(b.sym ?? ""));

  switch (field) {
    case "sym":
      return mul * String(a.sym ?? "").localeCompare(String(b.sym ?? ""));
    case "name":
      return mul * String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, {
        sensitivity: "base",
      });
    case "wolfRating":
    case "wolf_rating": {
      const na = Number.isFinite(a.wolfRating) ? a.wolfRating : null;
      const nb = Number.isFinite(b.wolfRating) ? b.wolfRating : null;
      if (na == null && nb == null) return tie();
      if (na == null) return 1;
      if (nb == null) return -1;
      return mul * (na - nb);
    }
    case "price":
    case "chg":
    case "pe":
    case "eps":
    case "epsGrowth":
    case "relVol": {
      const va = a[field];
      const vb = b[field];
      const na = Number.isFinite(va) ? va : null;
      const nb = Number.isFinite(vb) ? vb : null;
      if (na == null && nb == null) return tie();
      if (na == null) return 1;
      if (nb == null) return -1;
      return mul * (na - nb);
    }
    case "vol":
    case "mktCap":
      return mul * String(a[field] ?? "").localeCompare(String(b[field] ?? ""), undefined, {
        numeric: true,
      });
    default:
      return tie();
  }
}

/**
 * @param {{
 *   filters?: Record<string, unknown>,
 *   quickFilters?: string[],
 *   q?: string,
 *   sort?: { field?: string | null, order?: string | null },
 *   page?: number,
 *   pageSize?: number,
 *   snapshotDate?: string,
 * }} input
 */
export async function queryScreener(input = {}) {
  const requestedDate = input.snapshotDate ?? getOfficialRatingDate();
  const { snapshotDate, usedFallback } = await resolveSnapshotDate(requestedDate);
  const filters = input.filters ?? {};
  const quickFilters = Array.isArray(input.quickFilters) ? input.quickFilters : [];
  const q = input.q ?? "";
  const sortField = input.sort?.field ?? null;
  const sortOrder = input.sort?.order ?? null;
  const page = Math.max(1, Number(input.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(input.pageSize) || 50));

  const totalInStore = await countSnapshotRows(snapshotDate);
  const perfInStore = await countSnapshotRowsWithPerf(snapshotDate);
  const complete = isSnapshotComplete(totalInStore) && isSnapshotPerfComplete(perfInStore);
  if (totalInStore === 0) {
    return {
      snapshotDate,
      requestedDate,
      usedFallback,
      complete: false,
      totalInStore: 0,
      total: 0,
      page,
      pageSize,
      rows: [],
      ready: false,
      message:
        "No screener snapshot available. Run npm run build-snapshot then npm run publish-redis.",
      store: process.env.SNAPSHOT_STORE ?? "sqlite",
    };
  }

  const dbRows = await readAllSnapshotRows(snapshotDate);
  let rows = dbRows.map((r) => dbRowToApiRow(r));

  rows = rows.filter((row) => passesSearch(row, q));
  rows = rows.filter((row) => passesStockFilters(row, filters, quickFilters));

  if (sortField && sortOrder) {
    rows.sort((a, b) => compareRows(a, b, sortField, sortOrder));
  } else {
    rows.sort((a, b) => String(a.sym).localeCompare(String(b.sym)));
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  return {
    snapshotDate,
    requestedDate,
    usedFallback,
    complete,
    totalInStore,
    total,
    page,
    pageSize,
    rows: paged,
    ready: complete,
    perfInStore,
    message: complete
      ? undefined
      : !isSnapshotComplete(totalInStore)
        ? incompleteSnapshotMessage(totalInStore)
        : incompletePerfMessage(perfInStore),
    store: process.env.SNAPSHOT_STORE ?? "sqlite",
  };
}

export async function getScreenerStatus(snapshotDate) {
  const requestedDate = snapshotDate ?? getOfficialRatingDate();
  const { snapshotDate: date, usedFallback } = await resolveSnapshotDate(requestedDate);
  const meta = await getSnapshotMeta(date);
  const rowCount = await countSnapshotRows(date);
  const perfCount = await countSnapshotRowsWithPerf(date);
  const picksCount = await countWolfPicks(date, 70);
  const complete =
    isSnapshotComplete(rowCount) && isSnapshotPerfComplete(perfCount);

  return {
    snapshotDate: date,
    requestedDate,
    usedFallback,
    complete,
    rowCount,
    perfCount,
    picksCount,
    meta,
    ready: complete,
    minRowCount: getMinSnapshotRows(),
    minPerfCount: getMinSnapshotPerfRows(),
    message: complete
      ? undefined
      : !isSnapshotComplete(rowCount)
        ? incompleteSnapshotMessage(rowCount)
        : incompletePerfMessage(perfCount),
    store: process.env.SNAPSHOT_STORE ?? "sqlite",
  };
}
