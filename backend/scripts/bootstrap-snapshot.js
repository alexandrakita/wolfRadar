#!/usr/bin/env node
/**
 * One-time bootstrap after first Railway deploy.
 * Run: railway run --service api node scripts/bootstrap-snapshot.js
 */
import "dotenv/config";

import { closeDb } from "../lib/db.js";
import { getDataDir } from "../lib/paths.js";
import { buildFullSnapshot } from "../lib/screener-snapshot/builder.js";
import { countSnapshotRows } from "../lib/screener-snapshot/store.js";
import { getOfficialRatingDate } from "../lib/wolf-rating/data-loader.js";

const ratingDate = getOfficialRatingDate();
const existing = countSnapshotRows(ratingDate);

console.log(`Data dir: ${getDataDir()}`);
console.log(`Snapshot date: ${ratingDate}`);
console.log(`Existing rows: ${existing}`);

if (existing >= 1000) {
  console.log("Snapshot already populated — bootstrap skipped.");
  closeDb();
  process.exit(0);
}

console.log("Building full universe snapshot (~1–2 hours)…");

try {
  const result = await buildFullSnapshot({
    onProgress: ({ processed, total }) => {
      if (processed % 100 === 0 || processed === total) {
        console.log(`Progress: ${processed}/${total}`);
      }
    },
  });
  console.log(`Done — ${countSnapshotRows(result.snapshotDate)} rows for ${result.snapshotDate}`);
} finally {
  closeDb();
}
