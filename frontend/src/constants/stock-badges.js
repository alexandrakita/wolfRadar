/** Quick-filter / badge definitions for stocks screener. */

export const STOCK_BADGES = [
  {
    id: "highMomentum",
    emoji: "🔥",
    label: "High Momentum",
    short: "1M performance exceeds average monthly 3M performance.",
    criteria: "1M return > (3M return ÷ 3)",
    color: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
  },
  {
    id: "hiddenGems",
    emoji: "💎",
    label: "Hidden Gems",
    short: "Smaller companies with strong revenue growth.",
    criteria: "Market cap < $5B AND revenue growth > 20%",
    color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
  {
    id: "dividendOpportunities",
    emoji: "💰",
    label: "Dividend Opportunities",
    short: "Income-producing stocks with solid yield.",
    criteria: "Dividend yield > 3%",
    color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    id: "breakoutWatch",
    emoji: "📈",
    label: "Breakout Watch",
    short: "Trading near 52-week highs.",
    criteria: "Price ≥ 90% of 52-week high",
    color: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
  },
  {
    id: "oversoldStocks",
    emoji: "🩸",
    label: "Oversold Stocks",
    short: "Trading near 52-week lows.",
    criteria: "Price ≤ 110% of 52-week low",
    color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  {
    id: "wolfPicks",
    emoji: "🐺",
    label: "Wolf Picks",
    short: "Official Wolf Rating opportunity score of 70 or higher.",
    criteria: "Wolf Rating ≥ 70",
    color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    id: "volumeSpikes",
    emoji: "⚡",
    label: "Volume Spikes",
    short: "Unusual trading activity today.",
    criteria: "Relative volume > 2",
    color: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  },
];

export const STOCK_BADGE_IDS = new Set(STOCK_BADGES.map((b) => b.id));

export const STOCK_BADGE_BY_ID = Object.fromEntries(STOCK_BADGES.map((b) => [b.id, b]));
