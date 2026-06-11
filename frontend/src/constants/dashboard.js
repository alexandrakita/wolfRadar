import { MARKET_INDEXES } from "@/constants/market-indexes";

export const MAX_DASHBOARDS = 3;

export const WIDGET_TYPES = {
  MARKET_OVERVIEW: "market-overview",
  FAVORITE_TICKER: "favorite-ticker",
  MARKET_MOVERS: "market-movers",
  TOP_WOLF_RATING: "top-wolf-rating",
  WHATS_CHANGED: "whats-changed",
  NEWS_FEED: "news-feed",
  PORTFOLIO_OVERVIEW: "portfolio-overview",
  UPCOMING_EVENTS: "upcoming-events",
};

export const WIDGET_SIZES = ["sm", "md", "lg", "full"];

export const MOVER_MODES = [
  { id: "gainers", label: "Biggest Gainers" },
  { id: "losers", label: "Biggest Losers" },
  { id: "active", label: "Most Active" },
  { id: "volume", label: "Highest Volume" },
  { id: "rel-volume", label: "Highest Relative Volume" },
];

/** @type {Record<string, { title: string, description: string, defaultSize: string, live: boolean }>} */
export const WIDGET_CATALOG = {
  [WIDGET_TYPES.MARKET_OVERVIEW]: {
    title: "Market Overview",
    description: "NASDAQ, S&P 500, Dow, VIX snapshots with daily performance.",
    defaultSize: "full",
    live: true,
  },
  [WIDGET_TYPES.FAVORITE_TICKER]: {
    title: "Favorite Ticker",
    description: "Track price, chart, market cap, and Wolf Rating for any symbol.",
    defaultSize: "md",
    live: true,
  },
  [WIDGET_TYPES.MARKET_MOVERS]: {
    title: "Market Movers",
    description: "Gainers, losers, volume leaders from live market data.",
    defaultSize: "md",
    live: true,
  },
  [WIDGET_TYPES.TOP_WOLF_RATING]: {
    title: "Top Wolf Rating Stocks",
    description: "Highest-rated opportunities (mock Wolf Rating until integration).",
    defaultSize: "md",
    live: false,
  },
  [WIDGET_TYPES.WHATS_CHANGED]: {
    title: "What's Changed Today",
    description: "Rating shifts, earnings, volume spikes (mock Wolf Rating).",
    defaultSize: "md",
    live: false,
  },
  [WIDGET_TYPES.NEWS_FEED]: {
    title: "News Feed",
    description: "Latest headlines from Yahoo Finance.",
    defaultSize: "md",
    live: true,
  },
  [WIDGET_TYPES.PORTFOLIO_OVERVIEW]: {
    title: "Portfolio Overview",
    description: "Value, P/L, and allocation synced with your portfolio.",
    defaultSize: "lg",
    live: true,
  },
  [WIDGET_TYPES.UPCOMING_EVENTS]: {
    title: "Upcoming Events",
    description: "Earnings, dividends, and ex-dates in chronological order.",
    defaultSize: "md",
    live: true,
  },
};

export const INDEX_SYMBOLS = MARKET_INDEXES.map(({ sym, label }) => ({ sym, label }));

export function widgetColClass(size) {
  switch (size) {
    case "sm":
      return "col-span-12 sm:col-span-6 xl:col-span-3";
    case "md":
      return "col-span-12 lg:col-span-6";
    case "lg":
      return "col-span-12 xl:col-span-8";
    case "full":
    default:
      return "col-span-12";
  }
}

export function genWidgetId() {
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function genDashboardId() {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
