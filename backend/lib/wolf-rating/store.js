import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_DIR = path.join(__dirname, "../../data/wolf-ratings");

/** @type {Map<string, Promise<void>>} */
const writeChains = new Map();

async function ensureDir() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

function fileForDate(ratingDate) {
  return path.join(STORE_DIR, `${ratingDate}.json`);
}

/**
 * @param {string} ratingDate
 * @returns {Promise<Record<string, object>>}
 */
export async function readDayStore(ratingDate) {
  try {
    const raw = await fs.readFile(fileForDate(ratingDate), "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch (e) {
    const code = /** @type {NodeJS.ErrnoException} */ (e).code;
    if (code === "ENOENT") return {};
    if (e instanceof SyntaxError) {
      console.error(`[wolf-rating] corrupt store ${ratingDate}, treating as empty`);
      return {};
    }
    throw e;
  }
}

/**
 * @param {string} ratingDate
 * @param {string} symbol
 * @param {object} rating
 */
export async function writeRating(ratingDate, symbol, rating) {
  const prev = writeChains.get(ratingDate) ?? Promise.resolve();
  const next = prev
    .catch(() => {})
    .then(async () => {
      await ensureDir();
      const store = await readDayStore(ratingDate);
      store[symbol] = rating;
      await fs.writeFile(fileForDate(ratingDate), JSON.stringify(store));
    });
  writeChains.set(ratingDate, next);
  await next;
}

/**
 * @param {string} ratingDate
 * @param {string} symbol
 * @returns {Promise<object | null>}
 */
export async function readRating(ratingDate, symbol) {
  const store = await readDayStore(ratingDate);
  return store[symbol] ?? null;
}

/**
 * @param {string} ratingDate
 * @param {number} minScore
 * @returns {Promise<Record<string, object>>}
 */
export async function readRatingsAtOrAbove(ratingDate, minScore) {
  const store = await readDayStore(ratingDate);
  /** @type {Record<string, object>} */
  const out = {};
  for (const [sym, row] of Object.entries(store)) {
    if (row && typeof row.wolfRating === "number" && row.wolfRating >= minScore) {
      out[sym] = row;
    }
  }
  return out;
}

/**
 * Cached ratings only — no Yahoo compute.
 * @param {string} ratingDate
 * @param {string[]} symbols
 */
export async function readRatingsBatch(ratingDate, symbols) {
  const store = await readDayStore(ratingDate);
  /** @type {Record<string, object | null>} */
  const out = {};
  for (const sym of symbols) {
    out[sym] = store[sym] ?? null;
  }
  return out;
}

/**
 * @param {string} ratingDate
 * @param {number} limit
 * @returns {Promise<object[]>}
 */
export async function readTopRatings(ratingDate, limit = 20) {
  const store = await readDayStore(ratingDate);
  return Object.values(store)
    .filter((r) => r && typeof r.wolfRating === "number")
    .sort((a, b) => b.wolfRating - a.wolfRating)
    .slice(0, limit);
}
