function fmtVolLike(v) {
  if (v == null) return "—";
  if (typeof v === "number" && Number.isFinite(v)) {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
    return v.toFixed(0);
  }
  return "—";
}

function formatMktCapLabel(m) {
  if (m == null || !Number.isFinite(m)) return null;
  const abs = Math.abs(m);
  if (abs >= 1e12) return `${(m / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(m / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(m / 1e6).toFixed(2)}M`;
  return m.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** @param {Record<string, unknown>} dbRow */
export function dbRowToFilterRow(dbRow) {
  const mktCapNum = dbRow.mkt_cap ?? null;
  const volNum = dbRow.vol ?? null;
  return {
    sym: dbRow.symbol,
    name: dbRow.long_name ?? dbRow.name,
    long_name: dbRow.long_name,
    universe_sector: dbRow.universe_sector,
    price: dbRow.price,
    chg: dbRow.chg,
    vol: fmtVolLike(volNum),
    volNum,
    vol_num: volNum,
    avgVolume: dbRow.avg_volume,
    avg_volume: dbRow.avg_volume,
    relVol: dbRow.rel_vol,
    rel_vol: dbRow.rel_vol,
    mktCap: formatMktCapLabel(mktCapNum),
    mktCapNum: mktCapNum,
    mkt_cap: mktCapNum,
    pe: dbRow.pe,
    ps: dbRow.ps,
    peg: dbRow.peg,
    eps: dbRow.eps,
    epsGrowth: dbRow.eps_growth,
    eps_growth: dbRow.eps_growth,
    revGrowth: dbRow.revenue_growth,
    revenue_growth: dbRow.revenue_growth,
    divYield: dbRow.div_yield,
    div_yield: dbRow.div_yield,
    roe: dbRow.roe,
    beta: dbRow.beta,
    country: dbRow.country,
    exchange: dbRow.exchange,
    sector: dbRow.sector,
    industry: dbRow.industry,
    fiftyTwoWeekHigh: dbRow.fifty_two_week_high,
    fifty_two_week_high: dbRow.fifty_two_week_high,
    fiftyTwoWeekLow: dbRow.fifty_two_week_low,
    fifty_two_week_low: dbRow.fifty_two_week_low,
    high52wProximity: dbRow.high_52w_proximity,
    high_52w_proximity: dbRow.high_52w_proximity,
    low52wProximity: dbRow.low_52w_proximity,
    low_52w_proximity: dbRow.low_52w_proximity,
    perfDaily: dbRow.perf_daily,
    perf_daily: dbRow.perf_daily,
    perfWeekly: dbRow.perf_weekly,
    perf_weekly: dbRow.perf_weekly,
    perfMonthly: dbRow.perf_monthly,
    perf_monthly: dbRow.perf_monthly,
    perf1M: dbRow.perf_1m,
    perf_1m: dbRow.perf_1m,
    perf3M: dbRow.perf_3m,
    perf_3m: dbRow.perf_3m,
    perfYtd: dbRow.perf_ytd,
    perf_ytd: dbRow.perf_ytd,
    wolfRating: dbRow.wolf_rating,
    wolf_rating: dbRow.wolf_rating,
    momentumRating: dbRow.momentum_rating,
    growthRating: dbRow.growth_rating,
    sentimentRating: dbRow.sentiment_rating,
    activityRating: dbRow.activity_rating,
    logo: dbRow.logo,
  };
}

/** @param {Record<string, unknown>} dbRow */
export function dbRowToApiRow(dbRow) {
  return dbRowToFilterRow(dbRow);
}

/**
 * @param {string} sym
 * @param {string} snapshotDate
 * @param {{ sym: string, name: string, sector: string } | null} meta
 * @param {Record<string, unknown> | null} metrics
 * @param {Record<string, unknown> | null} rating
 */
export function buildSnapshotRecord(sym, snapshotDate, meta, metrics, rating) {
  const m = metrics ?? {};
  return {
    symbol: sym,
    snapshot_date: snapshotDate,
    name: meta?.name ?? null,
    universe_sector: meta?.sector ?? null,
    price: m.price ?? null,
    chg: m.chg ?? null,
    vol: m.vol ?? null,
    avg_volume: m.avgVolume ?? null,
    rel_vol: m.relVol ?? null,
    mkt_cap: m.mktCap ?? null,
    pe: m.pe ?? null,
    ps: m.ps ?? null,
    peg: m.peg ?? null,
    eps: m.eps ?? null,
    eps_growth: m.epsGrowth ?? null,
    earnings_growth: m.earningsGrowth ?? null,
    revenue_growth: m.revenueGrowth ?? null,
    div_yield: m.divYield ?? null,
    roe: m.roe ?? null,
    beta: m.beta ?? null,
    fifty_two_week_high: m.fiftyTwoWeekHigh ?? null,
    fifty_two_week_low: m.fiftyTwoWeekLow ?? null,
    high_52w_proximity: m.high52wProximity ?? null,
    low_52w_proximity: m.low52wProximity ?? null,
    country: m.country ?? null,
    exchange: m.exchange ?? null,
    sector: m.sector ?? null,
    industry: m.industry ?? null,
    perf_daily: m.perfDaily ?? null,
    perf_weekly: m.perfWeekly ?? null,
    perf_monthly: m.perfMonthly ?? null,
    perf_1m: m.perf1M ?? null,
    perf_3m: m.perf3M ?? null,
    perf_ytd: m.perfYtd ?? null,
    wolf_rating: rating?.wolfRating ?? null,
    momentum_rating: rating?.momentumRating ?? null,
    growth_rating: rating?.growthRating ?? null,
    sentiment_rating: rating?.sentimentRating ?? null,
    activity_rating: rating?.activityRating ?? null,
    logo: m.logo ?? null,
    long_name: m.longName ?? meta?.name ?? null,
    calculated_at: new Date().toISOString(),
  };
}
