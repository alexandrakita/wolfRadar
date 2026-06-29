#!/usr/bin/env node
import "dotenv/config";

import { closeDb } from "../lib/db.js";
import { buildFullSnapshot } from "../lib/screener-snapshot/builder.js";
import {
  getMinSnapshotRows,
  getMinSnapshotPerfRows,
  incompletePerfMessage,
  incompleteSnapshotMessage,
  isSnapshotComplete,
  isSnapshotPerfComplete,
} from "../lib/screener-snapshot/snapshot-quality.js";
import { countSnapshotRows, countSnapshotRowsWithPerf } from "../lib/screener-snapshot/store.js";
import { getOfficialRatingDate } from "../lib/wolf-rating/data-loader.js";

const args = process.argv.slice(2);
const force = args.includes("--force");
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const symbols = args.filter((a) => !a.startsWith("--") && !/^\d{4}-\d{2}-\d{2}$/.test(a));

if (dateArg) process.env.SNAPSHOT_DATE = dateArg;

const snapshotDate = getOfficialRatingDate();
console.log(`Screener snapshot — official date ${snapshotDate}`);
if (force) console.log("Force mode: recomputing all symbols");

let exitCode = 0;

try {
  const result = await buildFullSnapshot({
    force,
    snapshotDate,
    symbols: symbols.length ? symbols : undefined,
    onProgress: ({ processed, total }) => {
      if (processed % 100 === 0) {
        process.stdout.write(`\rProgress: ${processed}/${total}`);
      }
    },
  });

  const count = countSnapshotRows(result.snapshotDate);
  const perfCount = countSnapshotRowsWithPerf(result.snapshotDate);
  console.log(`\nDone — ${count} rows stored for ${result.snapshotDate} (${perfCount} with 1M/3M perf)`);
  if (count === 0) {
    console.error(`No rows stored for ${result.snapshotDate}. Build failed.`);
    exitCode = 1;
  } else if (!isSnapshotComplete(count)) {
    console.error(incompleteSnapshotMessage(count));
    console.error(`Minimum required rows: ${getMinSnapshotRows()}`);
    exitCode = 1;
  } else if (!isSnapshotPerfComplete(perfCount)) {
    console.error(incompletePerfMessage(perfCount));
    console.error(`Minimum required perf rows: ${getMinSnapshotPerfRows()}`);
    exitCode = 1;
  }
  if (result.redisPublish) {
    console.log(
      `Redis — ${result.redisPublish.rowCount} rows, ${result.redisPublish.picksCount} Wolf Picks`,
    );
  }
} finally {
  closeDb();
}

process.exit(exitCode);
