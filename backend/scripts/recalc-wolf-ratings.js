#!/usr/bin/env node
import "dotenv/config";

import { getOfficialRatingDate } from "../lib/wolf-rating/data-loader.js";
import { getWolfRating } from "../lib/wolf-rating/service.js";

const symbols = process.argv.slice(2).map((s) => s.toUpperCase());
const batch = symbols.length ? symbols : ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN"];

console.log(`Wolf Rating recalc — official date ${getOfficialRatingDate()}`);

for (const sym of batch) {
  try {
    const rating = await getWolfRating(sym, { force: true, debug: true });
    console.log(
      `${sym}: Wolf=${rating.wolfRating} M=${rating.momentumRating} G=${rating.growthRating} S=${rating.sentimentRating} A=${rating.activityRating}`,
    );
  } catch (e) {
    console.error(`${sym}: failed —`, /** @type {Error} */ (e).message);
  }
}
