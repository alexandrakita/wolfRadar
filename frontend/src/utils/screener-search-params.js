/** URL sync for /screener (Dashboard-style query state, CSR data). */

import {
  SCREENER_PAGE_LIMIT_OPTIONS,
  DEFAULT_SCREENER_LIMIT,
  DEFAULT_SCREENER_TAB,
  SCREENER_TABS,
  STOCK_SORT_KEYS,
  ETF_SORT_KEYS,
  STOCK_FILTER_KEYS,
  ETF_FILTER_KEYS,
} from "@/constants/screener";
import { STOCK_BADGE_IDS } from "@/constants/stock-badges";
import { isMarketIndex } from "@/constants/market-indexes";

export {
  SCREENER_PAGE_LIMIT_OPTIONS,
  DEFAULT_SCREENER_LIMIT,
  DEFAULT_SCREENER_TAB,
  SCREENER_TABS,
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
    if (v && typeof v === "object" && ("min" in v || "max" in v || "op" in v)) {
      out[k] = {
        op: v.op != null ? String(v.op) : undefined,
        min: v.min != null ? String(v.min) : "",
        max: v.max != null ? String(v.max) : "",
      };
    }
  }
  return out;
}

function parseQuickFilters(searchParams) {
  const raw = searchParams.get("qf") ?? "";
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((id) => STOCK_BADGE_IDS.has(id));
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
  const indexRaw = searchParams.get("index") ?? "";
  const index = isMarketIndex(indexRaw) ? indexRaw.trim().toUpperCase() : "";

  let tab = DEFAULT_SCREENER_TAB;
  if (tabRaw === SCREENER_TABS.ETFS) tab = SCREENER_TABS.ETFS;
  else if (tabRaw === SCREENER_TABS.INDEXES) tab = SCREENER_TABS.INDEXES;
  else if (tabRaw === SCREENER_TABS.STOCKS) tab = SCREENER_TABS.STOCKS;
  else if (index) tab = SCREENER_TABS.INDEXES;

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
  const allowedSort =
    tab === SCREENER_TABS.ETFS
      ? ETF_SORT_KEYS
      : tab === SCREENER_TABS.STOCKS
        ? STOCK_SORT_KEYS
        : new Set();
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
    index,
    page,
    limit,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
    quickFilters: parseQuickFilters(searchParams),
  };
}

/**
 * @param {{
 *   tab: string,
 *   q: string,
 *   index: string,
 *   page: number,
 *   limit: number,
 *   sortField: string | null,
 *   sortOrder: string | null,
 *   appliedStock: Record<string, unknown>,
 *   appliedEtf: Record<string, unknown>,
 *   quickFilters?: string[],
 * }} state
 */
export function buildScreenerSearchParams(state) {
  const {
    tab,
    q,
    index,
    page,
    limit,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
    quickFilters,
  } = state;

  const params = new URLSearchParams();

  if (tab && tab !== DEFAULT_SCREENER_TAB) params.set("tab", tab);

  const trimmed = typeof q === "string" ? q.trim() : "";
  if (trimmed) params.set("q", trimmed);

  const indexSym = typeof index === "string" ? index.trim().toUpperCase() : "";
  if (indexSym && isMarketIndex(indexSym)) params.set("index", indexSym);

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

  if (Array.isArray(quickFilters) && quickFilters.length > 0) {
    params.set("qf", quickFilters.join(","));
  }

  return params;
}
