import express from "express";

import market from "./market.js";

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.use("/market", market);

router.use((_req, res) => res.status(404).json({ error: "Not found" }));

export default router;
