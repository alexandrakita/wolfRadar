import { getOfficialRatingDate } from "../wolf-rating/data-loader.js";
import { passesSearch, passesStockFilters } from "./filters.js";
import { dbRowToApiRow } from "./row-mapper.js";
import {
  countSnapshotRows,
  countWolfPicks,
  getSnapshotMeta,
  readAllSnapshotRows,
} from "./store.js";

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
export function queryScreener(input = {}) {
  const snapshotDate = input.snapshotDate ?? getOfficialRatingDate();
  const filters = input.filters ?? {};
  const quickFilters = Array.isArray(input.quickFilters) ? input.quickFilters : [];
  const q = input.q ?? "";
  const sortField = input.sort?.field ?? null;
  const sortOrder = input.sort?.order ?? null;
  const page = Math.max(1, Number(input.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(input.pageSize) || 50));

  const totalInStore = countSnapshotRows(snapshotDate);
  if (totalInStore === 0) {
    return {
      snapshotDate,
      totalInStore: 0,
      total: 0,
      page,
      pageSize,
      rows: [],
      ready: false,
      message: "No screener snapshot for today. Run npm run build-snapshot in backend.",
    };
  }

  const dbRows = readAllSnapshotRows(snapshotDate);
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
    totalInStore,
    total,
    page,
    pageSize,
    rows: paged,
    ready: true,
  };
}

export function getScreenerStatus(snapshotDate) {
  const date = snapshotDate ?? getOfficialRatingDate();
  const meta = getSnapshotMeta(date);
  const rowCount = countSnapshotRows(date);
  const picksCount = countWolfPicks(date, 70);

  return {
    snapshotDate: date,
    rowCount,
    picksCount,
    meta,
    ready: rowCount > 0,
  };
}
