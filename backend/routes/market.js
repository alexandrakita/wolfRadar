import express from "express";

import { asyncRoute } from "../lib/async-route.js";
import { HttpError } from "../lib/http-error.js";
import {
  getQuotes,
  getStockBundle,
  getYahooChart,
  getYahooHistoricalPrice,
  normSym,
  RANGE_CFG,
} from "../lib/yahoo.js";

const router = express.Router();
const RANGE_KEYS_SET = new Set(Object.keys(RANGE_CFG));

router.post(
  "/quotes",
  asyncRoute(async (req, res) => {
    const payload = await getQuotes(req.body ?? {});
    res.json(payload);
  }),
);

router.post(
  "/bundle",
  asyncRoute(async (req, res) => {
    const bundle = await getStockBundle(req.body ?? {});
    res.json(bundle);
  }),
);

router.post(
  "/yahoo/chart",
  asyncRoute(async (req, res) => {
    const symbol = normSym(req.body?.symbol);
    if (!symbol) throw new HttpError(400, "Invalid symbol");
    const r = req.body?.range;
    const range =
      typeof r === "string" && RANGE_KEYS_SET.has(r)
        ? /** @type {keyof typeof RANGE_CFG} */ (r)
        : "1M";
    const payload = await getYahooChart(symbol, range);
    res.json(payload);
  }),
);

router.post(
  "/yahoo/historical",
  asyncRoute(async (req, res) => {
    const symbol = normSym(req.body?.symbol);
    if (!symbol) throw new HttpError(400, "Invalid symbol");
    const d = typeof req.body?.date === "string" ? req.body.date.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new HttpError(400, "Invalid date");
    const payload = await getYahooHistoricalPrice(symbol, d);
    res.json(payload);
  }),
);

export default router;
