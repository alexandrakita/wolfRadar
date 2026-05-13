import { createServerFn } from "@tanstack/react-start";

export type FinnhubQuote = {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number;
};

export type FinnhubProfile = {
  name?: string; ticker?: string; country?: string; currency?: string;
  exchange?: string; ipo?: string; marketCapitalization?: number;
  shareOutstanding?: number; finnhubIndustry?: string; logo?: string; weburl?: string; phone?: string;
};

export type RecommendationRow = {
  symbol: string; period: string;
  strongBuy: number; buy: number; hold: number; sell: number; strongSell: number;
};

export type EarningsRow = {
  symbol: string; period: string;
  actual: number | null; estimate: number | null; surprise: number | null; surprisePercent: number | null;
};

export type EarningsCalendarRow = {
  symbol: string; date: string; epsActual: number | null; epsEstimate: number | null;
  hour: string; quarter: number; revenueActual: number | null; revenueEstimate: number | null; year: number;
};

export type NewsRow = {
  category: string; datetime: number; headline: string; id: number;
  image: string; related: string; source: string; summary: string; url: string;
};

export type InsiderTxn = {
  name: string; share: number; change: number; filingDate: string;
  transactionDate: string; transactionCode: string; transactionPrice: number;
};

export type InsiderSentRow = { symbol: string; year: number; month: number; change: number; mspr: number };

// ---- Per-worker cache ----------------------------------------------------
type CacheEntry<T> = { t: number; data: T };
const CACHE = new Map<string, CacheEntry<unknown>>();
const INFLIGHT = new Map<string, Promise<unknown>>();

const TTL = {
  quote: 10_000,
  profile: 24 * 60 * 60_000,
  peers: 24 * 60 * 60_000,
  recommendation: 60 * 60_000,
  earnings: 60 * 60_000,
  earningsCalendar: 60 * 60_000,
  news: 5 * 60_000,
  insiderTxn: 60 * 60_000,
  insiderSent: 60 * 60_000,
  neg: 60_000,
};

async function cachedFetch<T>(key: string, ttlMs: number, url: string, fallback: T): Promise<T> {
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.t < ttlMs) return hit.data as T;
  const inflight = INFLIGHT.get(key) as Promise<T> | undefined;
  if (inflight) return inflight;

  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        CACHE.set(key, { t: Date.now(), data: fallback });
        return fallback;
      }
      const data = (await res.json()) as T;
      CACHE.set(key, { t: Date.now(), data });
      return data;
    } catch {
      CACHE.set(key, { t: Date.now(), data: fallback });
      return fallback;
    } finally {
      INFLIGHT.delete(key);
    }
  })();
  INFLIGHT.set(key, p as Promise<unknown>);
  return p;
}

function apiKeyOrThrow() {
  const k = process.env.FINNHUB_API_KEY;
  if (!k) throw new Error("FINNHUB_API_KEY not configured");
  return k;
}

const SYM_RE = /^[A-Z0-9.\-]{1,12}$/;
function normSym(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim().toUpperCase();
  return SYM_RE.test(v) ? v : null;
}

// ---- Quotes (batched) ----------------------------------------------------
export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((input: { symbols: string[] }) => {
    const symbols = Array.from(
      new Set((input?.symbols ?? []).map(normSym).filter((s): s is string => !!s)),
    ).slice(0, 50);
    return { symbols };
  })
  .handler(async ({ data }) => {
    const key = apiKeyOrThrow();
    const out: Record<string, FinnhubQuote | null> = {};
    const batch = 8;
    for (let i = 0; i < data.symbols.length; i += batch) {
      const slice = data.symbols.slice(i, i + batch);
      const results = await Promise.all(
        slice.map((s) =>
          cachedFetch<FinnhubQuote | null>(
            `q:${s}`,
            TTL.quote,
            `https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`,
            null,
          ),
        ),
      );
      slice.forEach((s, idx) => { out[s] = results[idx]; });
      if (i + batch < data.symbols.length) await new Promise((r) => setTimeout(r, 120));
    }
    return { quotes: out, error: null as null | string };
  });

// ---- Single-symbol bundle for the analysis page --------------------------
export const getStockBundle = createServerFn({ method: "POST" })
  .inputValidator((input: { symbol: string }) => {
    const s = normSym(input?.symbol);
    if (!s) throw new Error("Invalid symbol");
    return { symbol: s };
  })
  .handler(async ({ data }) => {
    const key = apiKeyOrThrow();
    const s = data.symbol;

    const [quote, profile, peers, recommendation, earnings, news, insiderTxnRes, insiderSentRes] =
      await Promise.all([
        cachedFetch<FinnhubQuote | null>(`q:${s}`, TTL.quote,
          `https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`, null),
        cachedFetch<FinnhubProfile>(`p:${s}`, TTL.profile,
          `https://finnhub.io/api/v1/stock/profile2?symbol=${s}&token=${key}`, {}),
        cachedFetch<string[]>(`peers:${s}`, TTL.peers,
          `https://finnhub.io/api/v1/stock/peers?symbol=${s}&token=${key}`, []),
        cachedFetch<RecommendationRow[]>(`rec:${s}`, TTL.recommendation,
          `https://finnhub.io/api/v1/stock/recommendation?symbol=${s}&token=${key}`, []),
        cachedFetch<EarningsRow[]>(`earn:${s}`, TTL.earnings,
          `https://finnhub.io/api/v1/stock/earnings?symbol=${s}&token=${key}`, []),
        cachedFetch<NewsRow[]>(`news:${s}`, TTL.news,
          `https://finnhub.io/api/v1/company-news?symbol=${s}&from=${dateAgo(14)}&to=${today()}&token=${key}`, []),
        cachedFetch<{ data: InsiderTxn[] }>(`itx:${s}`, TTL.insiderTxn,
          `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${s}&token=${key}`, { data: [] }),
        cachedFetch<{ data: InsiderSentRow[] }>(`isent:${s}`, TTL.insiderSent,
          `https://finnhub.io/api/v1/stock/insider-sentiment?symbol=${s}&token=${key}`, { data: [] }),
      ]);

    return {
      symbol: s,
      quote,
      profile,
      peers: Array.isArray(peers) ? peers.filter((p) => p && p !== s).slice(0, 8) : [],
      recommendation: (recommendation ?? []).slice(0, 4),
      earnings: (earnings ?? []).slice(0, 8),
      news: (news ?? []).slice(0, 12),
      insiderTransactions: (insiderTxnRes?.data ?? []).slice(0, 15),
      insiderSentiment: (insiderSentRes?.data ?? []).slice(0, 6),
    };
  });

function today() {
  return new Date().toISOString().slice(0, 10);
}
function dateAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
