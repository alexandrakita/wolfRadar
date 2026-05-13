import { createServerFn } from "@tanstack/react-start";

export type FinnhubQuote = {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
};

// Per-worker in-memory cache. Shared across all concurrent users hitting
// the same worker, so 1000 viewers of AAPL = 1 Finnhub call per TTL window.
type CacheEntry = { t: number; data: FinnhubQuote | null };
const QUOTE_CACHE = new Map<string, CacheEntry>();
const TTL_MS = 10_000; // 10s freshness — matches client poll interval
const NEG_TTL_MS = 30_000; // remember failures briefly to avoid retry storms

// Inflight de-dupe so concurrent requests for the same symbol coalesce.
const INFLIGHT = new Map<string, Promise<FinnhubQuote | null>>();

async function fetchOne(symbol: string, apiKey: string): Promise<FinnhubQuote | null> {
  const now = Date.now();
  const hit = QUOTE_CACHE.get(symbol);
  if (hit && now - hit.t < (hit.data ? TTL_MS : NEG_TTL_MS)) return hit.data;

  const existing = INFLIGHT.get(symbol);
  if (existing) return existing;

  const p = (async () => {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) {
        QUOTE_CACHE.set(symbol, { t: Date.now(), data: null });
        return null;
      }
      const data = (await res.json()) as FinnhubQuote;
      QUOTE_CACHE.set(symbol, { t: Date.now(), data });
      return data;
    } catch {
      QUOTE_CACHE.set(symbol, { t: Date.now(), data: null });
      return null;
    } finally {
      INFLIGHT.delete(symbol);
    }
  })();

  INFLIGHT.set(symbol, p);
  return p;
}

export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((input: { symbols: string[] }) => {
    const symbols = Array.from(
      new Set(
        (input?.symbols ?? [])
          .filter((s): s is string => typeof s === "string")
          .map((s) => s.trim().toUpperCase())
          .filter((s) => /^[A-Z0-9.\-]{1,12}$/.test(s)),
      ),
    ).slice(0, 50); // cap per call
    return { symbols };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return { quotes: {} as Record<string, FinnhubQuote | null>, error: "missing_api_key" as const };
    }

    const out: Record<string, FinnhubQuote | null> = {};

    // Throttle: 8 concurrent, ~120ms between batches → well under 60 rpm
    // even with multiple workers, since cache absorbs repeats.
    const batch = 8;
    for (let i = 0; i < data.symbols.length; i += batch) {
      const slice = data.symbols.slice(i, i + batch);
      const results = await Promise.all(slice.map((s) => fetchOne(s, apiKey)));
      slice.forEach((s, idx) => {
        out[s] = results[idx];
      });
      if (i + batch < data.symbols.length) await new Promise((r) => setTimeout(r, 120));
    }

    return { quotes: out, error: null };
  });
