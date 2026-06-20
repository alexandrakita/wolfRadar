/** @param {import("better-sqlite3").Database} db */
export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS screener_snapshot (
      symbol TEXT NOT NULL,
      snapshot_date TEXT NOT NULL,
      name TEXT,
      universe_sector TEXT,
      price REAL,
      chg REAL,
      vol REAL,
      avg_volume REAL,
      rel_vol REAL,
      mkt_cap REAL,
      pe REAL,
      ps REAL,
      peg REAL,
      eps REAL,
      eps_growth REAL,
      earnings_growth REAL,
      revenue_growth REAL,
      div_yield REAL,
      roe REAL,
      beta REAL,
      fifty_two_week_high REAL,
      fifty_two_week_low REAL,
      high_52w_proximity REAL,
      low_52w_proximity REAL,
      country TEXT,
      exchange TEXT,
      sector TEXT,
      industry TEXT,
      perf_daily REAL,
      perf_weekly REAL,
      perf_monthly REAL,
      perf_1m REAL,
      perf_3m REAL,
      perf_ytd REAL,
      wolf_rating REAL,
      momentum_rating REAL,
      growth_rating REAL,
      sentiment_rating REAL,
      activity_rating REAL,
      logo TEXT,
      long_name TEXT,
      calculated_at TEXT,
      PRIMARY KEY (symbol, snapshot_date)
    );

    CREATE INDEX IF NOT EXISTS idx_snapshot_date
      ON screener_snapshot(snapshot_date);

    CREATE INDEX IF NOT EXISTS idx_snapshot_wolf
      ON screener_snapshot(snapshot_date, wolf_rating DESC);

    CREATE TABLE IF NOT EXISTS snapshot_meta (
      snapshot_date TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      total_symbols INTEGER NOT NULL DEFAULT 0,
      processed_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0
    );
  `);
}
