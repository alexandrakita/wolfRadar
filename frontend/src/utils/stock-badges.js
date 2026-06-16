import { STOCK_BADGES } from "@/constants/stock-badges";

const FIVE_B = 5_000_000_000;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** @param {Record<string, unknown> | null | undefined} row */
export function badgeMatches(row, badgeId) {
  if (!row) return false;

  switch (badgeId) {
    case "highMomentum": {
      const perf1M = num(row.perf1M);
      const perf3M = num(row.perf3M);
      if (perf1M == null || perf3M == null) return false;
      return perf1M > perf3M / 3;
    }
    case "hiddenGems": {
      const mktCap = num(row.mktCapNum ?? row.mktCap);
      const revGrowth = num(row.revGrowth ?? row.revenueGrowth);
      if (mktCap == null || revGrowth == null) return false;
      return mktCap < FIVE_B && revGrowth > 20;
    }
    case "dividendOpportunities": {
      const divYield = num(row.divYield);
      return divYield != null && divYield > 3;
    }
    case "breakoutWatch": {
      const price = num(row.price);
      const high = num(row.fiftyTwoWeekHigh);
      if (price == null || high == null || high <= 0) return false;
      return price >= high * 0.9;
    }
    case "oversoldStocks": {
      const price = num(row.price);
      const low = num(row.fiftyTwoWeekLow);
      if (price == null || low == null || low <= 0) return false;
      return price <= low * 1.1;
    }
    case "wolfPicks": {
      const revGrowth = num(row.revGrowth ?? row.revenueGrowth);
      const epsGrowth = num(row.epsGrowth);
      const relVol = num(row.relVol);
      if (revGrowth == null || epsGrowth == null || relVol == null) return false;
      return revGrowth > 20 && epsGrowth > 20 && relVol > 1.5;
    }
    case "volumeSpikes": {
      const relVol = num(row.relVol);
      return relVol != null && relVol > 2;
    }
    default:
      return false;
  }
}

/** @param {Record<string, unknown> | null | undefined} row */
export function computeStockBadges(row) {
  if (!row) return [];
  return STOCK_BADGES.filter((b) => badgeMatches(row, b.id));
}

/** @param {Record<string, unknown> | null | undefined} row @param {string[]} activeQuickFilters */
export function passesQuickFilters(row, activeQuickFilters) {
  if (!activeQuickFilters?.length) return true;
  return activeQuickFilters.every((id) => badgeMatches(row, id));
}
