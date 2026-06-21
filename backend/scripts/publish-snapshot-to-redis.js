#!/usr/bin/env node
import "dotenv/config";

import { closeDb } from "../lib/db.js";
import { getOfficialRatingDate } from "../lib/wolf-rating/data-loader.js";
import { publishSnapshotToRedis } from "../lib/screener-snapshot/store-facade.js";
import { getSnapshotMeta, readAllSnapshotRows } from "../lib/screener-snapshot/store.js";

const args = process.argv.slice(2);
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const snapshotDate = dateArg ?? getOfficialRatingDate();

console.log(`Publishing screener snapshot ${snapshotDate} → Upstash Redis…`);

try {
  const rows = readAllSnapshotRows(snapshotDate);
  if (!rows.length) {
    console.error(`No SQLite rows for ${snapshotDate}. Run npm run build-snapshot first.`);
    process.exit(1);
  }

  const meta = getSnapshotMeta(snapshotDate) ?? {};
  const result = await publishSnapshotToRedis(snapshotDate, rows, meta);

  console.log(
    `Published ${result.rowCount} rows, ${result.picksCount} Wolf Picks (date ${result.snapshotDate})`,
  );
} finally {
  closeDb();
}
