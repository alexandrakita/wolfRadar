#!/usr/bin/env node
import "dotenv/config";

import { closeDb } from "../lib/db.js";
import { buildFullSnapshot } from "../lib/screener-snapshot/builder.js";
import { countSnapshotRows } from "../lib/screener-snapshot/store.js";
import { getOfficialRatingDate } from "../lib/wolf-rating/data-loader.js";

const args = process.argv.slice(2);
const force = args.includes("--force");
const symbols = args.filter((a) => !a.startsWith("--"));

console.log(`Screener snapshot — official date ${getOfficialRatingDate()}`);
if (force) console.log("Force mode: recomputing all symbols");

try {
  const result = await buildFullSnapshot({
    force,
    symbols: symbols.length ? symbols : undefined,
    onProgress: ({ processed, total }) => {
      if (processed % 100 === 0) {
        process.stdout.write(`\rProgress: ${processed}/${total}`);
      }
    },
  });

  const count = countSnapshotRows(result.snapshotDate);
  console.log(`\nDone — ${count} rows stored for ${result.snapshotDate}`);
  if (result.redisPublish) {
    console.log(
      `Redis — ${result.redisPublish.rowCount} rows, ${result.redisPublish.picksCount} Wolf Picks`,
    );
  }
} finally {
  closeDb();
}
