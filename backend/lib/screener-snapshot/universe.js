import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const UNIVERSE_PATH = path.join(
  __dirname,
  "../../../frontend/src/data/stock-universe-data.json",
);

/** @type {{ sym: string, name: string, sector: string }[] | null} */
let cached = null;

export function loadStockUniverse() {
  if (cached) return cached;
  const raw = fs.readFileSync(UNIVERSE_PATH, "utf8");
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
