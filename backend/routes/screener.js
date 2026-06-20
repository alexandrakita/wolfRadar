import express from "express";

import { asyncRoute } from "../lib/async-route.js";
import { getScreenerStatus, queryScreener } from "../lib/screener-snapshot/service.js";

const router = express.Router();

router.get(
  "/status",
  asyncRoute(async (req, res) => {
    const snapshotDate =
      typeof req.query.date === "string" ? req.query.date.slice(0, 10) : undefined;
    res.json(getScreenerStatus(snapshotDate));
  }),
);

router.post(
  "/query",
  asyncRoute(async (req, res) => {
    const body = req.body ?? {};
    const payload = queryScreener({
      filters: body.filters ?? body.appliedStock ?? {},
      quickFilters: body.quickFilters ?? [],
      q: body.q ?? body.search ?? "",
      sort: body.sort ?? { field: body.sortField, order: body.sortOrder },
      page: body.page,
      pageSize: body.pageSize ?? body.limit,
      snapshotDate: typeof body.snapshotDate === "string" ? body.snapshotDate.slice(0, 10) : undefined,
    });
    res.json(payload);
  }),
);

export default router;
