/** URL sync for /screener (Dashboard-style query state, CSR data). */

import {
  SCREENER_PAGE_LIMIT_OPTIONS,
  DEFAULT_SCREENER_LIMIT,
  DEFAULT_SCREENER_TAB,
  STOCK_SORT_KEYS,
  ETF_SORT_KEYS,
  STOCK_FILTER_KEYS,
  ETF_FILTER_KEYS,
} from "@/constants/screener";

export {
  SCREENER_PAGE_LIMIT_OPTIONS,
  DEFAULT_SCREENER_LIMIT,
  DEFAULT_SCREENER_TAB,
  STOCK_SORT_KEYS,
  ETF_SORT_KEYS,
} from "@/constants/screener";

function sanitizeApplied(raw, whitelist) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!whitelist.has(k)) continue;
    if (typeof v === "string") {
      out[k] = v;
      continue;
    }
    if (v && typeof v === "object" && ("min" in v || "max" in v)) {
      out[k] = {
        min: v.min != null ? String(v.min) : "",
        max: v.max != null ? String(v.max) : "",
      };
    }
  }
  return out;
}

/**
 * @param {URLSearchParams | ReadonlyURLSearchParams | string} source
 */
export function parseScreenerSearchParams(source) {
  const searchParams =
    typeof source === "string"
      ? new URLSearchParams(source.startsWith("?") ? source.slice(1) : source)
      : source;

  const tabRaw = searchParams.get("tab");
  const tab = tabRaw === "etfs" ? "etfs" : DEFAULT_SCREENER_TAB;

  const q = searchParams.get("q") ?? "";

  let page = Number.parseInt(searchParams.get("page") ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = Number.parseInt(
    searchParams.get("limit") ?? String(DEFAULT_SCREENER_LIMIT),
    10,
  );
  if (!SCREENER_PAGE_LIMIT_OPTIONS.includes(limit)) limit = DEFAULT_SCREENER_LIMIT;

  const sortRaw = searchParams.get("sort");
  const dirRaw = searchParams.get("dir");
  let sortField = null;
  let sortOrder = null;
  const allowedSort = tab === "stocks" ? STOCK_SORT_KEYS : ETF_SORT_KEYS;
  if (
    sortRaw &&
    allowedSort.has(sortRaw) &&
    (dirRaw === "asc" || dirRaw === "desc")
  ) {
    sortField = sortRaw;
    sortOrder = dirRaw;
  }

  let appliedStock = {};
  let appliedEtf = {};
  const filtersRaw = searchParams.get("filters");
  if (filtersRaw) {
    try {
      const obj = JSON.parse(filtersRaw);
      if (obj && typeof obj === "object") {
        if (obj.stocks && typeof obj.stocks === "object") {
          appliedStock = sanitizeApplied(obj.stocks, STOCK_FILTER_KEYS);
        }
        if (obj.etfs && typeof obj.etfs === "object") {
          appliedEtf = sanitizeApplied(obj.etfs, ETF_FILTER_KEYS);
        }
      }
    } catch {
      /* ignore malformed filters JSON */
    }
  }

  return {
    tab,
    q,
    page,
    limit,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
  };
}

/**
 * @param {{
 *   tab: string,
 *   q: string,
 *   page: number,
 *   limit: number,
 *   sortField: string | null,
 *   sortOrder: string | null,
 *   appliedStock: Record<string, unknown>,
 *   appliedEtf: Record<string, unknown>,
 * }} state
 */
export function buildScreenerSearchParams(state) {
  const {
    tab,
    q,
    page,
    limit,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
  } = state;

  const params = new URLSearchParams();

  if (tab && tab !== DEFAULT_SCREENER_TAB) params.set("tab", tab);

  const trimmed = typeof q === "string" ? q.trim() : "";
  if (trimmed) params.set("q", trimmed);

  if (page !== 1) params.set("page", String(page));

  if (limit !== DEFAULT_SCREENER_LIMIT) params.set("limit", String(limit));

  if (sortField && sortOrder && (sortOrder === "asc" || sortOrder === "desc")) {
    params.set("sort", sortField);
    params.set("dir", sortOrder);
  }

  const filtersPayload = {};
  if (appliedStock && Object.keys(appliedStock).length > 0) {
    filtersPayload.stocks = appliedStock;
  }
  if (appliedEtf && Object.keys(appliedEtf).length > 0) {
    filtersPayload.etfs = appliedEtf;
  }
  if (Object.keys(filtersPayload).length > 0) {
    params.set("filters", JSON.stringify(filtersPayload));
  }

  return params;
}
