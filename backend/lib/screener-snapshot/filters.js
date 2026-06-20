const EPS = 1e-6;
const FIVE_B = 5_000_000_000;

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
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

  const n = Number(value);
  if (Number.isNaN(n)) return false;

  const min = minStr ? Number(minStr) : undefined;
  const max = maxStr ? Number(maxStr) : undefined;

  switch (op) {
    case "gt":
      return min !== undefined && !Number.isNaN(min) && n > min;
    case "lt":
      return max !== undefined && !Number.isNaN(max) && n < max;
    case "eq": {
      const target = min !== undefined && !Number.isNaN(min) ? min : max;
      return target !== undefined && Math.abs(n - target) <= EPS;
    }
    case "between":
      if (min !== undefined && !Number.isNaN(min) && n < min) return false;
      if (max !== undefined && !Number.isNaN(max) && n > max) return false;
      return true;
    default:
      if (min !== undefined && !Number.isNaN(min) && n < min) return false;
      if (max !== undefined && !Number.isNaN(max) && n > max) return false;
      return true;
  }
}

function selectMatches(value, filterVal) {
  if (typeof filterVal !== "string" || !filterVal || filterVal === "Any") return true;
  if (value == null || value === "") return false;
  return String(value).toLowerCase() === filterVal.toLowerCase();
}

/** @param {Record<string, unknown>} row @param {string} badgeId */
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
      const mktCap = num(row.mktCapNum ?? row.mkt_cap ?? row.mktCap);
      const revGrowth = num(row.revGrowth ?? row.revenue_growth ?? row.revenueGrowth);
      if (mktCap == null || revGrowth == null) return false;
      return mktCap < FIVE_B && revGrowth > 20;
    }
    case "dividendOpportunities": {
      const divYield = num(row.divYield ?? row.div_yield);
      return divYield != null && divYield > 3;
    }
    case "breakoutWatch": {
      const price = num(row.price);
      const high = num(row.fiftyTwoWeekHigh ?? row.fifty_two_week_high);
      if (price == null || high == null || high <= 0) return false;
      return price >= high * 0.9;
    }
    case "oversoldStocks": {
      const price = num(row.price);
      const low = num(row.fiftyTwoWeekLow ?? row.fifty_two_week_low);
      if (price == null || low == null || low <= 0) return false;
      return price <= low * 1.1;
    }
    case "wolfPicks": {
      const wolfRating = num(row.wolfRating ?? row.wolf_rating);
      return wolfRating != null && wolfRating >= 70;
    }
    case "volumeSpikes": {
      const relVol = num(row.relVol ?? row.rel_vol);
      return relVol != null && relVol > 2;
    }
    default:
      return false;
  }
}

/**
 * @param {Record<string, unknown>} row
 * @param {Record<string, unknown>} applied
 * @param {string[]} [quickFilters]
 */
export function passesStockFilters(row, applied, quickFilters = []) {
  const f = applied ?? {};

  if (quickFilters?.length) {
    if (!quickFilters.every((id) => badgeMatches(row, id))) return false;
  }

  if (!numericFilterMatches(row.price, f.price)) return false;
  if (!numericFilterMatches(row.chg, f.chg)) return false;
  if (!numericFilterMatches(row.mktCapNum ?? row.mkt_cap, f.mktCap)) return false;
  if (!numericFilterMatches(row.volNum ?? row.vol, f.volume)) return false;
  if (!numericFilterMatches(row.avgVolume ?? row.avg_volume, f.avgVolume)) return false;

  if (!selectMatches(row.country, f.country)) return false;
  if (!selectMatches(row.exchange ?? row.universe_sector, f.exchange)) return false;
  if (!selectMatches(row.sector, f.sector)) return false;
  if (typeof f.industry === "string" && f.industry.trim()) {
    const ind = row.industry;
    if (!ind || !String(ind).toLowerCase().includes(f.industry.trim().toLowerCase())) return false;
  }

  if (!numericFilterMatches(row.perfDaily ?? row.perf_daily ?? row.chg, f.perfDaily)) return false;
  if (!numericFilterMatches(row.perfWeekly ?? row.perf_weekly, f.perfWeekly)) return false;
  if (!numericFilterMatches(row.perfMonthly ?? row.perf_monthly, f.perfMonthly)) return false;
  if (!numericFilterMatches(row.perfYtd ?? row.perf_ytd, f.perfYtd)) return false;
  if (!numericFilterMatches(row.high52wProximity ?? row.high_52w_proximity, f.high52wProximity))
    return false;
  if (!numericFilterMatches(row.low52wProximity ?? row.low_52w_proximity, f.low52wProximity))
    return false;

  if (!numericFilterMatches(row.pe, f.pe)) return false;
  if (!numericFilterMatches(row.ps, f.ps)) return false;
  if (!numericFilterMatches(row.peg, f.peg)) return false;
  if (!numericFilterMatches(row.divYield ?? row.div_yield, f.divYield)) return false;
  if (!numericFilterMatches(row.epsGrowth ?? row.eps_growth, f.epsGrowth)) return false;
  if (!numericFilterMatches(row.revGrowth ?? row.revenue_growth, f.revGrowth)) return false;

  return true;
}

/** @param {Record<string, unknown>} row @param {string} q */
export function passesSearch(row, q) {
  const needle = String(q ?? "")
    .trim()
    .toLowerCase();
  if (!needle) return true;
  const sym = String(row.sym ?? "").toLowerCase();
  const name = String(row.name ?? row.long_name ?? "").toLowerCase();
  return sym.includes(needle) || name.includes(needle);
}
