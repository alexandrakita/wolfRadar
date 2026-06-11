"use client";

import { WIDGET_TYPES } from "@/constants/dashboard";
import { MarketOverviewWidget } from "@/components/dashboard/widgets/market-overview-widget";
import { FavoriteTickerWidget } from "@/components/dashboard/widgets/favorite-ticker-widget";
import { MarketMoversWidget } from "@/components/dashboard/widgets/market-movers-widget";
import { TopWolfRatingWidget } from "@/components/dashboard/widgets/top-wolf-rating-widget";
import { WhatsChangedWidget } from "@/components/dashboard/widgets/whats-changed-widget";
import { NewsFeedWidget } from "@/components/dashboard/widgets/news-feed-widget";
import { PortfolioOverviewWidget } from "@/components/dashboard/widgets/portfolio-overview-widget";
import { UpcomingEventsWidget } from "@/components/dashboard/widgets/upcoming-events-widget";

/** @type {Record<string, React.ComponentType<object>>} */
export const WIDGET_COMPONENTS = {
  [WIDGET_TYPES.MARKET_OVERVIEW]: MarketOverviewWidget,
  [WIDGET_TYPES.FAVORITE_TICKER]: FavoriteTickerWidget,
  [WIDGET_TYPES.MARKET_MOVERS]: MarketMoversWidget,
  [WIDGET_TYPES.TOP_WOLF_RATING]: TopWolfRatingWidget,
  [WIDGET_TYPES.WHATS_CHANGED]: WhatsChangedWidget,
  [WIDGET_TYPES.NEWS_FEED]: NewsFeedWidget,
  [WIDGET_TYPES.PORTFOLIO_OVERVIEW]: PortfolioOverviewWidget,
  [WIDGET_TYPES.UPCOMING_EVENTS]: UpcomingEventsWidget,
};

export function defaultWidgetConfig(type) {
  switch (type) {
    case WIDGET_TYPES.FAVORITE_TICKER:
      return { symbol: "NVDA" };
    case WIDGET_TYPES.MARKET_MOVERS:
      return { mode: "gainers" };
    case WIDGET_TYPES.TOP_WOLF_RATING:
      return { sector: "all" };
    default:
      return {};
  }
}
