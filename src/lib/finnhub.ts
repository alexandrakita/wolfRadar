// Finnhub API helper. Free tier: 60 requests/minute.
// Note: this key is exposed to the client by design (free-tier dev key).
export const FINNHUB_API_KEY = "d73uu39r01qno4pvqbo0d73uu39r01qno4pvqbog";
const BASE = "https://finnhub.io/api/v1";

export type FinnhubQuote = {
  c: number; // current
  d: number; // change
  dp: number; // change percent
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number;
};

export type FinnhubProfile = {
  name?: string;
  ticker?: string;
  marketCapitalization?: number;
  finnhubIndustry?: string;
  logo?: string;
  weburl?: string;
};

// Tiny in-memory cache with TTL to avoid hammering the 60 rpm budget.
const cache = new Map<string, { t: number; data: unknown }>();
const TTL_MS = 30_000;

async function get<T>(path: string): Promise<T> {
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}token=${FINNHUB_API_KEY}`;
  const cached = cache.get(url);
  if (cached && Date.now() - cached.t < TTL_MS) return cached.data as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub ${res.status}`);
  const data = (await res.json()) as T;
  cache.set(url, { t: Date.now(), data });
  return data;
}

export const finnhub = {
  quote: (symbol: string) => get<FinnhubQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`),
  profile: (symbol: string) => get<FinnhubProfile>(`/stock/profile2?symbol=${encodeURIComponent(symbol)}`),
};

// Fetch many quotes with light throttling (~10 per batch, 150ms gap)
export async function fetchQuotes(symbols: string[]): Promise<Record<string, FinnhubQuote | null>> {
  const out: Record<string, FinnhubQuote | null> = {};
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (s) => {
        try {
          return [s, await finnhub.quote(s)] as const;
        } catch {
          return [s, null] as const;
        }
      }),
    );
    for (const [s, q] of results) out[s] = q;
    if (i + batchSize < symbols.length) await new Promise((r) => setTimeout(r, 150));
  }
  return out;
}
