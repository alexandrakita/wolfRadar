import { badgeMatches } from "@/utils/stock-badges";

const EPS = 1e-6;

/**
 * Range filter with operator: gt | lt | eq | between
 * @param {number | null | undefined} value
 * @param {{ op?: string, min?: string, max?: string } | undefined} filter
 */
export function numericFilterMatches(value, filter) {
  if (!filter) return true;
  const minStr = filter.min?.trim?.() ?? "";
  const maxStr = filter.max?.trim?.() ?? "";
  const op = filter.op ?? (minStr && maxStr ? "between" : minStr ? "gt" : maxStr ? "lt" : null);
  if (!op && !minStr && !maxStr) return true;
  if (value == null || (typeof value === "number" && Number.isNaN(value))) return false;

  const num = Number(value);
  if (Number.isNaN(num)) return false;

  const min = minStr ? Number(minStr) : undefined;
  const max = maxStr ? Number(maxStr) : undefined;

  switch (op) {
    case "gt":
      return min !== undefined && !Number.isNaN(min) && num > min;
    case "lt":
      return max !== undefined && !Number.isNaN(max) && num < max;
    case "eq": {
      const target = min !== undefined && !Number.isNaN(min) ? min : max;
      return target !== undefined && Math.abs(num - target) <= EPS;
    }
    case "between":
      if (min !== undefined && !Number.isNaN(min) && num < min) return false;
      if (max !== undefined && !Number.isNaN(max) && num > max) return false;
      return true;
    default:
      if (min !== undefined && !Number.isNaN(min) && num < min) return false;
      if (max !== undefined && !Number.isNaN(max) && num > max) return false;
      return true;
  }
}

function selectMatches(value, filterVal) {
  if (typeof filterVal !== "string" || !filterVal || filterVal === "Any") return true;
  if (value == null || value === "") return false;
  return String(value).toLowerCase() === filterVal.toLowerCase();
}

/**
 * @param {Record<string, unknown>} row enriched stock row
 * @param {Record<string, unknown>} applied filter state
 * @param {string[]} [quickFilters]
 */
export function passesStockFilters(row, applied, quickFilters = []) {
  const f = applied ?? {};

  if (!passesQuickFilterList(row, quickFilters)) return false;

  if (!numericFilterMatches(row.price, f.price)) return false;
  if (!numericFilterMatches(row.chg, f.chg)) return false;
  if (!numericFilterMatches(row.mktCapNum ?? row.mktCap, f.mktCap)) return false;
  if (!numericFilterMatches(row.volNum ?? row.vol, f.volume)) return false;
  if (!numericFilterMatches(row.avgVolume, f.avgVolume)) return false;

  if (!selectMatches(row.country, f.country)) return false;
  if (!selectMatches(row.exchange ?? row.staticExchange, f.exchange)) return false;
  if (!selectMatches(row.sector, f.sector)) return false;
  if (typeof f.industry === "string" && f.industry.trim()) {
    const ind = row.industry;
    if (!ind || !String(ind).toLowerCase().includes(f.industry.trim().toLowerCase())) return false;
  }

  if (!numericFilterMatches(row.perfDaily ?? row.chg, f.perfDaily)) return false;
  if (!numericFilterMatches(row.perfWeekly, f.perfWeekly)) return false;
  if (!numericFilterMatches(row.perfMonthly, f.perfMonthly)) return false;
  if (!numericFilterMatches(row.perfYtd, f.perfYtd)) return false;
  if (!numericFilterMatches(row.high52wProximity, f.high52wProximity)) return false;
  if (!numericFilterMatches(row.low52wProximity, f.low52wProximity)) return false;

  if (!numericFilterMatches(row.pe, f.pe)) return false;
  if (!numericFilterMatches(row.ps, f.ps)) return false;
  if (!numericFilterMatches(row.peg, f.peg)) return false;
  if (!numericFilterMatches(row.divYield, f.divYield)) return false;
  if (!numericFilterMatches(row.epsGrowth, f.epsGrowth)) return false;
  if (!numericFilterMatches(row.revGrowth ?? row.revenueGrowth, f.revGrowth)) return false;

  return true;
}

function passesQuickFilterList(row, quickFilters) {
  if (!quickFilters?.length) return true;
  return quickFilters.every((id) => badgeMatches(row, id));
}

/** Keys that require screener metrics (not static universe only). */
export const STOCK_METRICS_FILTER_KEYS = new Set([
  "price",
  "chg",
  "mktCap",
  "volume",
  "avgVolume",
  "country",
  "exchange",
  "sector",
  "industry",
  "perfDaily",
  "perfWeekly",
  "perfMonthly",
  "perfYtd",
  "high52wProximity",
  "low52wProximity",
  "pe",
  "ps",
  "peg",
  "divYield",
  "epsGrowth",
  "revGrowth",
]);

export function stockMetricsFiltersActive(applied, quickFilters = []) {
  if (quickFilters.length > 0) return true;
  const f = applied ?? {};
  for (const key of STOCK_METRICS_FILTER_KEYS) {
    const v = f[key];
    if (typeof v === "string" && v.trim() && v !== "Any") return true;
    if (v && typeof v === "object" && (v.min?.trim?.() || v.max?.trim?.())) return true;
  }
  return false;
}

export function formatFilterChip(label, v) {
  if (typeof v === "string") return v && v !== "Any" ? `${label}: ${v}` : null;
  if (!v || typeof v !== "object") return null;
  const min = v.min?.trim?.() ?? "";
  const max = v.max?.trim?.() ?? "";
  if (!min && !max) return null;

  const op = v.op ?? (min && max ? "between" : min ? "gt" : "lt");
  switch (op) {
    case "gt":
      return `${label} > ${min}`;
    case "lt":
      return `${label} < ${max}`;
    case "eq":
      return `${label} = ${min || max}`;
    case "between":
      return min && max ? `${label}: ${min}–${max}` : min ? `${label} ≥ ${min}` : `${label} ≤ ${max}`;
    default:
      if (min && max) return `${label}: ${min}–${max}`;
      if (min) return `${label} ≥ ${min}`;
      return `${label} ≤ ${max}`;
  }
}
