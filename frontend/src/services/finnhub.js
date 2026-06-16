import { apiPost } from "./api.js";

const CHUNK = 50;

/** @typedef {{ c:number,d:number,dp:number,h:number,l:number,o:number,pc:number,t:number, vol?:number|null, volLabel?:string|null, relVol?:number|null, mktCap?:number|null, mktCapLabel?:string|null, pe?:number|null, eps?:number|null, epsGrowth?:number|null, logo?:string|null, longName?:string|null }} PriceQuote */

/**
 * Live quotes via backend (Yahoo Finance; keyless, server-side).
 * @param {string[]} symbols
 * @returns {Promise<Record<string, PriceQuote | null>>}
 */
export async function fetchQuotes(symbols) {
  if (!symbols.length) return {};

  const merged = {};

  for (let i = 0; i < symbols.length; i += CHUNK) {
    const slice = symbols.slice(i, i + CHUNK);
    const res = await apiPost("/quotes", { symbols: slice });
    Object.assign(merged, res.quotes ?? {});
  }

  return merged;
}

/**
 * Screener metrics — quote + fundamentals + performance (Yahoo Finance).
 * @param {string[]} symbols
 * @returns {Promise<Record<string, object | null>>}
 */
export async function fetchScreenerMetrics(symbols) {
  if (!symbols.length) return {};

  const merged = {};

  for (let i = 0; i < symbols.length; i += CHUNK) {
    const slice = symbols.slice(i, i + CHUNK);
    const res = await apiPost("/screener-metrics", { symbols: slice });
    Object.assign(merged, res.metrics ?? {});
  }

  return merged;
}
