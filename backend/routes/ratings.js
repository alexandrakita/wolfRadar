import express from "express";

import { asyncRoute } from "../lib/async-route.js";
import { HttpError } from "../lib/http-error.js";
import { getOfficialRatingDate } from "../lib/wolf-rating/data-loader.js";
import {
  getCachedWolfRatings,
  getWolfPicks,
  getWolfRating,
  getWolfRatingsBatch,
} from "../lib/wolf-rating/service.js";
import { readTopRatings } from "../lib/wolf-rating/store.js";
import { normSym, sanitizeSymbols } from "../lib/yahoo.js";

const router = express.Router();

function debugEnabled(req) {
  if (process.env.WOLF_RATING_DEBUG === "1") return true;
  const key = process.env.WOLF_RATING_DEBUG_KEY;
  return Boolean(key && req.query?.debug === key);
}

router.get(
  "/picks/list",
  asyncRoute(async (req, res) => {
    const min = Math.min(Math.max(Number(req.query.min) || 70, 0), 100);
    const payload = await getWolfPicks(min);
    res.json(payload);
  }),
);

router.get(
  "/top/list",
  asyncRoute(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 5), 50);
    const ratingDate = getOfficialRatingDate();
    const rows = await readTopRatings(ratingDate, limit);
    res.json({ ratingDate, rows });
  }),
);

router.get(
  "/:symbol",
  asyncRoute(async (req, res) => {
    const sym = normSym(req.params.symbol);
    if (!sym) throw new HttpError(400, "Invalid symbol");

    const rating = await getWolfRating(sym, { debug: debugEnabled(req) });
    if (!rating) throw new HttpError(404, "Rating unavailable");

    res.json(rating);
  }),
);

router.post(
  "/batch/cached",
  asyncRoute(async (req, res) => {
    const symbols = sanitizeSymbols(req.body?.symbols ?? []);
    if (!symbols.length) throw new HttpError(400, "No symbols");

    const payload = await getCachedWolfRatings(symbols);
    res.json(payload);
  }),
);

router.post(
  "/batch",
  asyncRoute(async (req, res) => {
    const symbols = sanitizeSymbols(req.body?.symbols ?? []);
    if (!symbols.length) throw new HttpError(400, "No symbols");

    const ratings = await getWolfRatingsBatch(symbols, { debug: debugEnabled(req) });
    res.json({ ratingDate: getOfficialRatingDate(), ratings });
  }),
);

export default router;
