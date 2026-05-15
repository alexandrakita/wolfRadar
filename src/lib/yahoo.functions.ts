import { createServerFn } from "@tanstack/react-start";
import YahooFinance from "yahoo-finance2";

// v3+ requires instantiation
const yahooFinance = new YahooFinance();

try {
  // @ts-expect-error suppressNotices exists at runtime
  yahooFinance.suppressNotices?.(["yahooSurvey", "ripHistorical"]);
} catch {
  // ignore
}

// ---- Cache ---------------------------------------------------------------
type CacheEntry<T> = { t: number; data: T };
const CACHE = new Map<string, CacheEntry<unknown>>();
const INFLIGHT = new Map<string, Promise<unknown>>();

const TTL = {
  fundamentals: 30 * 60_000, // 30 min — fundamentals rarely change intraday
  neg: 2 * 60_000,           // 2 min for failures
};

const SYM_RE = /^[A-Z0-9.\-]{1,12}$/;
function normSym(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const v = s.trim().toUpperCase();
  return SYM_RE.test(v) ? v : null;
}

async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>, fallback: T): Promise<T> {
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.t < ttlMs) return hit.data as T;
  const inflight = INFLIGHT.get(key) as Promise<T> | undefined;
  if (inflight) return inflight;

  const p = (async () => {
    try {
      const data = await loader();
      CACHE.set(key, { t: Date.now(), data });
      return data;
    } catch (e) {
      console.error(`[yahoo] ${key} failed:`, (e as Error).message);
      CACHE.set(key, { t: Date.now(), data: fallback });
      // Shorten TTL for negative cache by stamping older time
      setTimeout(() => CACHE.delete(key), TTL.neg);
      return fallback;
    } finally {
      INFLIGHT.delete(key);
    }
  })();
  INFLIGHT.set(key, p as Promise<unknown>);
  return p;
}

export type YahooFundamentals = {
  symbol: string;
  // Price / quote
  price: number | null;
  currency: string | null;
  marketCap: number | null;
  sharesOutstanding: number | null;
  // Valuation
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  enterpriseValue: number | null;
  evToEbitda: number | null;
  evToRevenue: number | null;
  // Profitability / margins
  profitMargins: number | null;
  operatingMargins: number | null;
  grossMargins: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  // Growth
  earningsGrowth: number | null;
  revenueGrowth: number | null;
  earningsQuarterlyGrowth: number | null;
  // Income
  totalRevenue: number | null;
  ebitda: number | null;
  netIncomeToCommon: number | null;
  trailingEps: number | null;
  forwardEps: number | null;
  // Balance sheet
  totalCash: number | null;
  totalDebt: number | null;
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  bookValue: number | null;
  // Dividend
  dividendYield: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;
  // Risk
  beta: number | null;
  // Range
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  // Analyst
  recommendationMean: number | null;
  recommendationKey: string | null;
  numberOfAnalystOpinions: number | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
  // Short interest
  shortRatio: number | null;
  shortPercentOfFloat: number | null;
  // Holders
  heldPercentInsiders: number | null;
  heldPercentInstitutions: number | null;
  // Volume
  averageDailyVolume3Month: number | null;
  averageDailyVolume10Day: number | null;
};

function n(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v && typeof v === "object" && "raw" in (v as Record<string, unknown>)) {
    const raw = (v as { raw: unknown }).raw;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  }
  return null;
}

async function loadFundamentals(symbol: string): Promise<YahooFundamentals> {
  const qs = (await yahooFinance.quoteSummary(symbol, {
    modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "price"],
  })) as Record<string, unknown>;

  const sd = (qs.summaryDetail ?? {}) as Record<string, unknown>;
  const ks = (qs.defaultKeyStatistics ?? {}) as Record<string, unknown>;
  const fd = (qs.financialData ?? {}) as Record<string, unknown>;
  const pr = (qs.price ?? {}) as Record<string, unknown>;

  return {
    symbol,
    price: n(pr.regularMarketPrice) ?? n(fd.currentPrice),
    currency: typeof pr.currency === "string" ? (pr.currency as string) : null,
    marketCap: n(pr.marketCap) ?? n(sd.marketCap),
    sharesOutstanding: n(ks.sharesOutstanding),

    trailingPE: n(sd.trailingPE),
    forwardPE: n(sd.forwardPE) ?? n(ks.forwardPE),
    pegRatio: n(ks.pegRatio),
    priceToBook: n(ks.priceToBook),
    priceToSales: n(sd.priceToSalesTrailing12Months),
    enterpriseValue: n(ks.enterpriseValue),
    evToEbitda: n(ks.enterpriseToEbitda),
    evToRevenue: n(ks.enterpriseToRevenue),

    profitMargins: n(fd.profitMargins) ?? n(ks.profitMargins),
    operatingMargins: n(fd.operatingMargins),
    grossMargins: n(fd.grossMargins),
    returnOnEquity: n(fd.returnOnEquity),
    returnOnAssets: n(fd.returnOnAssets),

    earningsGrowth: n(fd.earningsGrowth),
    revenueGrowth: n(fd.revenueGrowth),
    earningsQuarterlyGrowth: n(ks.earningsQuarterlyGrowth),

    totalRevenue: n(fd.totalRevenue),
    ebitda: n(fd.ebitda),
    netIncomeToCommon: n(ks.netIncomeToCommon),
    trailingEps: n(ks.trailingEps),
    forwardEps: n(ks.forwardEps),

    totalCash: n(fd.totalCash),
    totalDebt: n(fd.totalDebt),
    debtToEquity: n(fd.debtToEquity),
    currentRatio: n(fd.currentRatio),
    quickRatio: n(fd.quickRatio),
    bookValue: n(ks.bookValue),

    dividendYield: n(sd.dividendYield),
    dividendRate: n(sd.dividendRate),
    payoutRatio: n(sd.payoutRatio),

    beta: n(sd.beta) ?? n(ks.beta),

    fiftyTwoWeekHigh: n(sd.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: n(sd.fiftyTwoWeekLow),
    fiftyDayAverage: n(sd.fiftyDayAverage),
    twoHundredDayAverage: n(sd.twoHundredDayAverage),

    recommendationMean: n(fd.recommendationMean),
    recommendationKey: typeof fd.recommendationKey === "string" ? (fd.recommendationKey as string) : null,
    numberOfAnalystOpinions: n(fd.numberOfAnalystOpinions),
    targetMeanPrice: n(fd.targetMeanPrice),
    targetHighPrice: n(fd.targetHighPrice),
    targetLowPrice: n(fd.targetLowPrice),

    shortRatio: n(ks.shortRatio),
    shortPercentOfFloat: n(ks.shortPercentOfFloat),

    heldPercentInsiders: n(ks.heldPercentInsiders),
    heldPercentInstitutions: n(ks.heldPercentInstitutions),

    averageDailyVolume3Month: n(sd.averageDailyVolume3Month) ?? n(pr.averageDailyVolume3Month),
    averageDailyVolume10Day: n(sd.averageDailyVolume10Day) ?? n(pr.averageDailyVolume10Day),
  };
}

// ---- Server function: single-symbol fundamentals -------------------------
export const getYahooFundamentals = createServerFn({ method: "POST" })
  .inputValidator((input: { symbol: string }) => {
    const s = normSym(input?.symbol);
    if (!s) throw new Error("Invalid symbol");
    return { symbol: s };
  })
  .handler(async ({ data }) => {
    const fundamentals = await cached<YahooFundamentals | null>(
      `yf:fund:${data.symbol}`,
      TTL.fundamentals,
      () => loadFundamentals(data.symbol),
      null,
    );
    return { fundamentals };
  });

// ---- Server function: batch fundamentals (capped at 25) ------------------
export const getYahooFundamentalsBatch = createServerFn({ method: "POST" })
  .inputValidator((input: { symbols: string[] }) => {
    const symbols = Array.from(
      new Set((input?.symbols ?? []).map(normSym).filter((s): s is string => !!s)),
    ).slice(0, 25);
    return { symbols };
  })
  .handler(async ({ data }) => {
    const out: Record<string, YahooFundamentals | null> = {};
    const batch = 5;
    for (let i = 0; i < data.symbols.length; i += batch) {
      const slice = data.symbols.slice(i, i + batch);
      const results = await Promise.all(
        slice.map((s) =>
          cached<YahooFundamentals | null>(
            `yf:fund:${s}`,
            TTL.fundamentals,
            () => loadFundamentals(s),
            null,
          ),
        ),
      );
      slice.forEach((s, idx) => {
        out[s] = results[idx];
      });
      if (i + batch < data.symbols.length) await new Promise((r) => setTimeout(r, 150));
    }
    return { fundamentals: out };
  });
