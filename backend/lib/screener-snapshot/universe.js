import fs from "node:fs";

import { getUniversePath } from "../paths.js";

/** @type {{ sym: string, name: string, sector: string }[] | null} */
let cached = null;

export function loadStockUniverse() {
  if (cached) return cached;
  const universePath = getUniversePath();
  const raw = fs.readFileSync(universePath, "utf8");
  const rows = JSON.parse(raw);
  cached = (Array.isArray(rows) ? rows : []).map((r) => ({
    sym: String(r.sym ?? "")
      .trim()
      .toUpperCase(),
    name: String(r.name ?? ""),
    sector: String(r.sector ?? ""),
  }));
  return cached;
}

export function loadUniverseSymbols() {
  return loadStockUniverse().map((r) => r.sym);
}

/** @param {string} sym */
export function getUniverseMeta(sym) {
  const key = String(sym ?? "")
    .trim()
    .toUpperCase();
  return loadStockUniverse().find((r) => r.sym === key) ?? null;
}
