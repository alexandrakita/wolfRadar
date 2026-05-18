import { STOCK_UNIVERSE } from "@/data/stock-universe";

export const STOCKS = STOCK_UNIVERSE;

export const QUOTE_BUFFER = 25;

/** When stock range filters are on, quotes load for this many rows (sorted) before filtering. */
export const MAX_STOCKS_FOR_MARKET_FILTER = 500;

const COUNTRIES = [
  "US",
  "Canada",
  "UK",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  "Australia",
];
const INDEXES = [
  "Any",
  "S&P 500",
  "Nasdaq 100",
  "Dow 30",
  "Russell 1000",
  "Russell 2000",
  "S&P MidCap 400",
];
const SECTORS = [
  "Any",
  "Technology Services",
  "Electronic Technology",
  "Finance",
  "Health Technology",
  "Retail Trade",
  "Energy Minerals",
  "Consumer Services",
  "Consumer Durables",
  "Producer Manufacturing",
  "Consumer Non-Durables",
  "Utilities",
  "Communications",
  "Process Industries",
  "Transportation",
  "Industrial Services",
  "Commercial Services",
  "Health Services",
  "Non-Energy Minerals",
  "Distribution Services",
  "Miscellaneous",
];
const ANALYST_RATINGS = ["Any", "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
const RANGES = ["Any", "Below average", "Average", "Above average", "High"];
const DATE_RANGES = ["Any", "Today", "Tomorrow", "This week", "Next week", "This month", "Next month"];

const ASSET_CLASSES = [
  "Any",
  "Equity",
  "Fixed Income",
  "Commodity",
  "Currency",
  "Multi-Asset",
  "Alternatives",
];
const ETF_CATEGORIES = [
  "Any",
  "Large Cap",
  "Mid Cap",
  "Small Cap",
  "Sector",
  "International",
  "Bond",
  "Commodity",
  "Inverse",
  "Leveraged",
  "Thematic",
];
const BRANDS = ["Any", "iShares", "Vanguard", "SPDR", "Invesco", "Schwab", "ProShares", "First Trust", "WisdomTree"];
const STRUCTURES = ["Any", "ETF", "ETN", "ETC", "Open-ended fund"];


export const ETFS = [
  {
    sym: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    price: null,
    chg: null,
    aum: "612.4B",
    expense: 0.0945,
    yld: 1.24,
    brand: "SPDR",
  },
  {
    sym: "IVV",
    name: "iShares Core S&P 500 ETF",
    price: null,
    chg: null,
    aum: "528.1B",
    expense: 0.03,
    yld: 1.27,
    brand: "iShares",
  },
  {
    sym: "VOO",
    name: "Vanguard S&P 500 ETF",
    price: null,
    chg: null,
    aum: "509.3B",
    expense: 0.03,
    yld: 1.29,
    brand: "Vanguard",
  },
  {
    sym: "QQQ",
    name: "Invesco QQQ Trust",
    price: null,
    chg: null,
    aum: "302.6B",
    expense: 0.2,
    yld: 0.55,
    brand: "Invesco",
  },
  {
    sym: "VTI",
    name: "Vanguard Total Stock Market",
    price: null,
    chg: null,
    aum: "445.8B",
    expense: 0.03,
    yld: 1.31,
    brand: "Vanguard",
  },
  {
    sym: "IWM",
    name: "iShares Russell 2000 ETF",
    price: null,
    chg: null,
    aum: "63.2B",
    expense: 0.19,
    yld: 1.1,
    brand: "iShares",
  },
  {
    sym: "AGG",
    name: "iShares Core US Aggregate Bond",
    price: null,
    chg: null,
    aum: "118.5B",
    expense: 0.03,
    yld: 4.02,
    brand: "iShares",
  },
  {
    sym: "GLD",
    name: "SPDR Gold Shares",
    price: null,
    chg: null,
    aum: "82.7B",
    expense: 0.4,
    yld: 0,
    brand: "SPDR",
  },
];


export const STOCK_FILTERS = [
  { key: "country", label: "Country", type: "select", options: COUNTRIES, placeholder: "Any" },
  { key: "watchlist", label: "Watchlist", type: "select", options: ["Any", "My watchlist", "Favorites", "Holdings"] },
  { key: "index", label: "Index", type: "select", options: INDEXES },
  { key: "price", label: "Price", type: "range" },
  { key: "chg", label: "Chg %", type: "range" },
  { key: "mktCap", label: "Mkt cap", type: "range" },
  { key: "pe", label: "P/E", type: "range" },
  { key: "epsGrowth", label: "EPS dil growth %", type: "range" },
  { key: "divYield", label: "Div yield %", type: "range" },
  { key: "sector", label: "Sector", type: "select", options: SECTORS },
  { key: "rating", label: "Analyst rating", type: "select", options: ANALYST_RATINGS },
  { key: "perf", label: "Perf %", type: "range" },
  { key: "revGrowth", label: "Revenue growth %", type: "range" },
  { key: "peg", label: "PEG", type: "range" },
  { key: "roe", label: "ROE %", type: "range" },
  { key: "beta", label: "Beta", type: "range" },
  { key: "earningsRecent", label: "Recent earnings date", type: "select", options: DATE_RANGES },
  { key: "earningsUpcoming", label: "Upcoming earnings date", type: "select", options: DATE_RANGES },
];

export const ETF_FILTERS = [
  { key: "country", label: "Country", type: "select", options: COUNTRIES },
  { key: "assetClass", label: "Asset class", type: "select", options: ASSET_CLASSES },
  { key: "category", label: "Category", type: "select", options: ETF_CATEGORIES },
  { key: "brand", label: "Brand / Issuer", type: "select", options: BRANDS },
  { key: "structure", label: "Structure", type: "select", options: STRUCTURES },
  { key: "price", label: "Price", type: "range" },
  { key: "chg", label: "Chg %", type: "range" },
  { key: "aum", label: "AUM", type: "range" },
  { key: "expense", label: "Expense ratio %", type: "range" },
  { key: "divYield", label: "Div yield %", type: "range" },
  { key: "volume", label: "Volume", type: "range" },
  { key: "navReturn", label: "NAV total return 1Y %", type: "range" },
  { key: "beta", label: "Beta (1Y)", type: "range" },
  { key: "liquidity", label: "Liquidity", type: "select", options: RANGES },
  {
    key: "inception",
    label: "Inception date",
    type: "select",
    options: ["Any", "< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"],
  },
];
