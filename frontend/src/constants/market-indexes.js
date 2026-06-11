/** Yahoo Finance index symbols shown on dashboard + screener. */

export const MARKET_INDEXES = [
  { sym: "^IXIC", label: "NASDAQ", name: "NASDAQ Composite" },
  { sym: "^GSPC", label: "S&P 500", name: "S&P 500" },
  { sym: "^DJI", label: "Dow Jones", name: "Dow Jones Industrial Average" },
  { sym: "^VIX", label: "VIX", name: "CBOE Volatility Index" },
];

const INDEX_SET = new Set(MARKET_INDEXES.map((i) => i.sym));

export function isMarketIndex(symbol) {
  return INDEX_SET.has(String(symbol ?? "").trim().toUpperCase());
}

export function marketIndexMeta(symbol) {
  const sym = String(symbol ?? "").trim().toUpperCase();
  return MARKET_INDEXES.find((i) => i.sym === sym) ?? null;
}
