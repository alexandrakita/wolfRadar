#!/usr/bin/env node
import "dotenv/config";

import { getOfficialRatingDate } from "../lib/wolf-rating/data-loader.js";
import {
  getMinSnapshotRows,
  getMinSnapshotPerfRows,
  incompletePerfMessage,
  incompleteSnapshotMessage,
  isSnapshotComplete,
  isSnapshotPerfComplete,
} from "../lib/screener-snapshot/snapshot-quality.js";
import { countSnapshotRows, countSnapshotRowsWithPerf } from "../lib/screener-snapshot/store-facade.js";

const snapshotDate = getOfficialRatingDate();
const rowCount = await countSnapshotRows(snapshotDate);
const perfCount = await countSnapshotRowsWithPerf(snapshotDate);

if (rowCount > 0 && isSnapshotComplete(rowCount) && isSnapshotPerfComplete(perfCount)) {
  console.log(`Snapshot ready for ${snapshotDate} (${rowCount} rows, ${perfCount} with perf).`);
  process.exit(0);
}

if (rowCount > 0 && isSnapshotComplete(rowCount) && !isSnapshotPerfComplete(perfCount)) {
  console.log(incompletePerfMessage(perfCount));
} else if (rowCount > 0) {
  console.log(incompleteSnapshotMessage(rowCount));
} else {
  console.log(`Snapshot missing for ${snapshotDate}.`);
}
console.log(`Minimum required rows: ${getMinSnapshotRows()}, perf rows: ${getMinSnapshotPerfRows()}`);
process.exit(1);
