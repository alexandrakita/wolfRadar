/** URL sync + table wiring for /screener */

export const SCREENER_PAGE_LIMIT_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_SCREENER_LIMIT = 25;
export const DEFAULT_SCREENER_TAB = "stocks";

export const SCREENER_TABS = {
  INDEXES: "indexes",
  STOCKS: "stocks",
  ETFS: "etfs",
};

/** Sort keys allowed per tab — must match compareStockRows / compareEtfRows + headers */
export const STOCK_SORT_KEYS = new Set(["sym", "price", "chg", "vol", "relVol", "mktCap", "pe", "eps", "epsGrowth"]);

export const ETF_SORT_KEYS = new Set(["sym", "price", "chg", "aum", "expense", "yld", "brand"]);

export const STOCK_FILTER_KEYS = new Set([
  "country",
  "watchlist",
  "index",
  "price",
  "chg",
  "mktCap",
  "pe",
  "epsGrowth",
  "divYield",
  "sector",
  "rating",
  "perf",
  "revGrowth",
  "peg",
  "roe",
  "beta",
  "earningsRecent",
  "earningsUpcoming",
]);

export const ETF_FILTER_KEYS = new Set([
  "country",
  "assetClass",
  "category",
  "brand",
  "structure",
  "price",
  "chg",
  "aum",
  "expense",
  "divYield",
  "volume",
  "navReturn",
  "beta",
  "liquidity",
  "inception",
]);
