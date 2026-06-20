import { getDb } from "../db.js";

const UPSERT_SQL = `
  INSERT INTO screener_snapshot (
    symbol, snapshot_date, name, universe_sector,
    price, chg, vol, avg_volume, rel_vol, mkt_cap,
    pe, ps, peg, eps, eps_growth, earnings_growth, revenue_growth, div_yield,
    roe, beta, fifty_two_week_high, fifty_two_week_low, high_52w_proximity, low_52w_proximity,
    country, exchange, sector, industry,
    perf_daily, perf_weekly, perf_monthly, perf_1m, perf_3m, perf_ytd,
    wolf_rating, momentum_rating, growth_rating, sentiment_rating, activity_rating,
    logo, long_name, calculated_at
  ) VALUES (
    @symbol, @snapshot_date, @name, @universe_sector,
    @price, @chg, @vol, @avg_volume, @rel_vol, @mkt_cap,
    @pe, @ps, @peg, @eps, @eps_growth, @earnings_growth, @revenue_growth, @div_yield,
    @roe, @beta, @fifty_two_week_high, @fifty_two_week_low, @high_52w_proximity, @low_52w_proximity,
    @country, @exchange, @sector, @industry,
    @perf_daily, @perf_weekly, @perf_monthly, @perf_1m, @perf_3m, @perf_ytd,
    @wolf_rating, @momentum_rating, @growth_rating, @sentiment_rating, @activity_rating,
    @logo, @long_name, @calculated_at
  )
  ON CONFLICT(symbol, snapshot_date) DO UPDATE SET
    name = excluded.name,
    universe_sector = excluded.universe_sector,
    price = excluded.price,
    chg = excluded.chg,
    vol = excluded.vol,
    avg_volume = excluded.avg_volume,
    rel_vol = excluded.rel_vol,
    mkt_cap = excluded.mkt_cap,
    pe = excluded.pe,
    ps = excluded.ps,
    peg = excluded.peg,
    eps = excluded.eps,
    eps_growth = excluded.eps_growth,
    earnings_growth = excluded.earnings_growth,
    revenue_growth = excluded.revenue_growth,
    div_yield = excluded.div_yield,
    roe = excluded.roe,
    beta = excluded.beta,
    fifty_two_week_high = excluded.fifty_two_week_high,
    fifty_two_week_low = excluded.fifty_two_week_low,
    high_52w_proximity = excluded.high_52w_proximity,
    low_52w_proximity = excluded.low_52w_proximity,
    country = excluded.country,
    exchange = excluded.exchange,
    sector = excluded.sector,
    industry = excluded.industry,
    perf_daily = excluded.perf_daily,
    perf_weekly = excluded.perf_weekly,
    perf_monthly = excluded.perf_monthly,
    perf_1m = excluded.perf_1m,
    perf_3m = excluded.perf_3m,
    perf_ytd = excluded.perf_ytd,
    wolf_rating = excluded.wolf_rating,
    momentum_rating = excluded.momentum_rating,
    growth_rating = excluded.growth_rating,
    sentiment_rating = excluded.sentiment_rating,
    activity_rating = excluded.activity_rating,
    logo = excluded.logo,
    long_name = excluded.long_name,
    calculated_at = excluded.calculated_at
`;

/** @param {Record<string, unknown>} record */
export function upsertSnapshotRow(record) {
  const db = getDb();
  db.prepare(UPSERT_SQL).run(record);
}

/** @param {string} snapshotDate */
export function readAllSnapshotRows(snapshotDate) {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM screener_snapshot WHERE snapshot_date = ? ORDER BY symbol ASC`)
    .all(snapshotDate);
}

/** @param {string} snapshotDate */
export function countSnapshotRows(snapshotDate) {
  const db = getDb();
  const row = db
    .prepare(`SELECT COUNT(*) AS c FROM screener_snapshot WHERE snapshot_date = ?`)
    .get(snapshotDate);
  return Number(row?.c ?? 0);
}

/** @param {string} snapshotDate @param {string} symbol */
export function hasSnapshotRow(snapshotDate, symbol) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT 1 AS ok FROM screener_snapshot WHERE snapshot_date = ? AND symbol = ? LIMIT 1`,
    )
    .get(snapshotDate, symbol);
  return !!row;
}

/** @param {string} snapshotDate @param {number} totalSymbols */
export function startSnapshotMeta(snapshotDate, totalSymbols) {
  const db = getDb();
  db.prepare(
    `INSERT INTO snapshot_meta (snapshot_date, started_at, total_symbols, processed_count, error_count)
     VALUES (?, ?, ?, 0, 0)
     ON CONFLICT(snapshot_date) DO UPDATE SET
       started_at = excluded.started_at,
       completed_at = NULL,
       total_symbols = excluded.total_symbols,
       processed_count = 0,
       error_count = 0`,
  ).run(snapshotDate, new Date().toISOString(), totalSymbols);
}

/** @param {string} snapshotDate @param {{ processed?: number, errors?: number, completed?: boolean }} patch */
export function updateSnapshotMeta(snapshotDate, patch = {}) {
  const db = getDb();
  const current = db
    .prepare(`SELECT * FROM snapshot_meta WHERE snapshot_date = ?`)
    .get(snapshotDate);
  if (!current) return;

  const processed = patch.processed ?? current.processed_count;
  const errors = patch.errors ?? current.error_count;
  const completedAt = patch.completed ? new Date().toISOString() : current.completed_at;

  db.prepare(
    `UPDATE snapshot_meta
     SET processed_count = ?, error_count = ?, completed_at = ?
     WHERE snapshot_date = ?`,
  ).run(processed, errors, completedAt, snapshotDate);
}

/** @param {string} snapshotDate */
export function incrementSnapshotProgress(snapshotDate, hadError = false) {
  const db = getDb();
  db.prepare(
    `UPDATE snapshot_meta
     SET processed_count = processed_count + 1,
         error_count = error_count + ?
     WHERE snapshot_date = ?`,
  ).run(hadError ? 1 : 0, snapshotDate);
}

/** @param {string} [snapshotDate] */
export function getSnapshotMeta(snapshotDate) {
  const db = getDb();
  if (snapshotDate) {
    return db.prepare(`SELECT * FROM snapshot_meta WHERE snapshot_date = ?`).get(snapshotDate) ?? null;
  }
  return (
    db
      .prepare(`SELECT * FROM snapshot_meta ORDER BY snapshot_date DESC LIMIT 1`)
      .get() ?? null
  );
}

/** @param {string} snapshotDate @param {number} minScore */
export function countWolfPicks(snapshotDate, minScore = 70) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS c FROM screener_snapshot
       WHERE snapshot_date = ? AND wolf_rating IS NOT NULL AND wolf_rating >= ?`,
    )
    .get(snapshotDate, minScore);
  return Number(row?.c ?? 0);
}

/** @param {string} snapshotDate @param {number} minScore */
export function readWolfPicksFromSnapshot(snapshotDate, minScore = 70) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM screener_snapshot
       WHERE snapshot_date = ? AND wolf_rating IS NOT NULL AND wolf_rating >= ?
       ORDER BY wolf_rating DESC, symbol ASC`,
    )
    .all(snapshotDate, minScore);
  return rows;
}
