import YahooFinance from "yahoo-finance2";

import { HttpError } from "./http-error.js";

const yahooFinance = new YahooFinance();

try {
  yahooFinance.suppressNotices?.(["yahooSurvey", "ripHistorical"]);
} catch {
  // ignore
}

const CACHE = new Map();
const INFLIGHT = new Map();

const TTL = {
  fundamentals: 30 * 60_000,
  bundle: 60_000,
  quote: 10_000,
  neg: 2 * 60_000,
};

const STOCK_SYM_RE = /^[A-Z0-9.\-]{1,12}$/;
const INDEX_SYM_RE = /^\^[A-Z0-9.\-]{1,11}$/;

export function normSym(s) {
  if (typeof s !== "string") return null;
  const v = s.trim().toUpperCase();
  if (STOCK_SYM_RE.test(v) || INDEX_SYM_RE.test(v)) return v;
  return null;
}

export function sanitizeSymbols(raw) {
  return Array.from(
    new Set((raw ?? []).map((s) => normSym(typeof s === "string" ? s : "")).filter(Boolean)),
  ).slice(0, 50);
}

async function cached(key, ttlMs, loader, fallback) {
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.t < ttlMs) return hit.data;

  let inflight = INFLIGHT.get(key);
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const data = await loader();
      CACHE.set(key, { t: Date.now(), data });
      return data;
    } catch (e) {
      console.error(`[yahoo] ${key} failed:`, e.message);
      CACHE.set(key, { t: Date.now(), data: fallback });
      setTimeout(() => CACHE.delete(key), TTL.neg);
      return fallback;
    } finally {
      INFLIGHT.delete(key);
    }
  })();

  INFLIGHT.set(key, inflight);
  return inflight;
}

function n(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const x = Number(v);
    return Number.isFinite(x) ? x : null;
  }
  if (v && typeof v === "object" && "raw" in v) {
    const raw = v.raw;
    return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
  }
  return null;
}

async function loadFundamentals(symbol) {
  const qs = await yahooFinance.quoteSummary(
    symbol,
    {
      modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "price"],
    },
    { validateResult: false },
  );

  const sd = qs.summaryDetail ?? {};
  const ks = qs.defaultKeyStatistics ?? {};
  const fd = qs.financialData ?? {};
  const pr = qs.price ?? {};

  return {
    symbol,
    price: n(pr.regularMarketPrice) ?? n(fd.currentPrice),
    currency: typeof pr.currency === "string" ? pr.currency : null,
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
    recommendationKey: typeof fd.recommendationKey === "string" ? fd.recommendationKey : null,
    numberOfAnalystOpinions: n(fd.numberOfAnalystOpinions),
    targetMeanPrice: n(fd.targetMeanPrice),
    targetHighPrice: n(fd.targetHighPrice),
    targetLowPrice: n(fd.targetLowPrice),

    shortRatio: n(ks.shortRatio),
    shortPercentOfFloat: n(ks.shortPercentOfFloat),

    heldPercentInsiders: n(ks.heldPercentInsiders),
    heldPercentInstitutions: n(ks.heldPercentInstitutions),

    averageDailyVolume3Month:
      n(sd.averageDailyVolume3Month) ?? n(pr.averageDailyVolume3Month),
    averageDailyVolume10Day: n(sd.averageDailyVolume10Day) ?? n(pr.averageDailyVolume10Day),
  };
}

export async function getYahooFundamentals(symbol) {
  return cached(
    `yf:fund:${symbol}`,
    TTL.fundamentals,
    () => loadFundamentals(symbol),
    null,
  );
}

/** @typedef {"1D"|"5D"|"1M"|"3M"|"6M"|"1Y"|"5Y"} ChartRange */

/** @type {Record<ChartRange, { period: string, interval: string }>} */
export const RANGE_CFG = {
  "1D": { period: "1d", interval: "5m" },
  "5D": { period: "5d", interval: "30m" },
  "1M": { period: "1mo", interval: "1d" },
  "3M": { period: "3mo", interval: "1d" },
  "6M": { period: "6mo", interval: "1d" },
  "1Y": { period: "1y", interval: "1d" },
  "5Y": { period: "5y", interval: "1wk" },
};

/** @returns {Promise<{ points: object[], range: ChartRange, symbol: string }>} */
export async function getYahooChart(symbol, range) {
  const cfg = RANGE_CFG[range];
  const key = `yf:chart:${symbol}:${range}`;
  const ttl = range === "1D" ? 60_000 : range === "5D" ? 5 * 60_000 : 30 * 60_000;
  const points = await cached(
    key,
    ttl,
    async () => {
      const now = Math.floor(Date.now() / 1000);
      /** @type {Record<string, number>} */
      const periodSecs = {
        "1d": 60 * 60 * 24 * 2,
        "5d": 60 * 60 * 24 * 7,
        "1mo": 60 * 60 * 24 * 31,
        "3mo": 60 * 60 * 24 * 95,
        "6mo": 60 * 60 * 24 * 190,
        "1y": 60 * 60 * 24 * 370,
        "5y": 60 * 60 * 24 * 365 * 5 + 60 * 60 * 24 * 5,
      };
      const p1 = new Date((now - periodSecs[cfg.period]) * 1000);
      const p2 = new Date(now * 1000);
      const res = await yahooFinance.chart(symbol, {
        period1: p1,
        period2: p2,
        interval: cfg.interval,
      });
      const quotes = res.quotes ?? [];
      return quotes
        .filter((q) => q.close != null && Number.isFinite(q.close))
        .map((q) => ({
          t: q.date instanceof Date ? q.date.getTime() : new Date(q.date).getTime(),
          c: /** @type {number} */ (q.close),
          o: q.open ?? undefined,
          h: q.high ?? undefined,
          l: q.low ?? undefined,
          v: q.volume ?? undefined,
        }));
    },
    [],
  );
  return { points, range, symbol };
}

export async function getYahooHistoricalPrice(symbol, dateIso) {
  const key = `yf:hist:${symbol}:${dateIso}`;
  const price = await cached(
    key,
    24 * 60 * 60_000,
    async () => {
      const target = new Date(`${dateIso}T00:00:00Z`);
      const p1 = new Date(target.getTime() - 7 * 24 * 60 * 60_000);
      const p2 = new Date(Math.min(Date.now(), target.getTime() + 3 * 24 * 60 * 60_000));
      const res = await yahooFinance.chart(symbol, {
        period1: p1,
        period2: p2,
        interval: "1d",
      });
      const quotes = (res.quotes ?? []).filter((q) => q.close != null);
      if (!quotes.length) return null;
      const targetMs = target.getTime();
      /** @type {null | typeof quotes[number]} */
      let best = null;
      for (const q of quotes) {
        const qd = q.date instanceof Date ? q.date : new Date(q.date);
        if (qd.getTime() <= targetMs + 24 * 60 * 60_000) {
          const bestTs = best
            ? best.date instanceof Date
              ? best.date.getTime()
              : new Date(best.date).getTime()
            : -Infinity;
          if (!best || qd.getTime() > bestTs) {
            best = q;
          }
        }
      }
      const pick = best ?? quotes[quotes.length - 1];
      return typeof pick.close === "number" ? pick.close : null;
    },
    null,
  );
  return { symbol, date: dateIso, price };
}

function formatVolume(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(2)}K`;
  return `${Math.round(v)}`;
}

function formatMktCapNum(m) {
  const abs = Math.abs(m);
  if (abs >= 1e12) return `${(m / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(m / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(m / 1e6).toFixed(2)}M`;
  return m.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** Ticker-based logo (FMP public CDN; works for most US equities/ETFs). */
export function fmpStockLogoUrl(symbol) {
  const s = String(symbol ?? "")
    .trim()
    .toUpperCase();
  if (!s) return null;
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(s)}.png`;
}

/** @param {unknown} row */
function yahooRowToMarketQuote(row) {
  if (!row || typeof row !== "object") return null;
  const r = /** @type {Record<string, unknown>} */ (row);
  const price = n(r.regularMarketPrice);
  if (price == null) return null;
  const rt = r.regularMarketTime;
  const tSec =
    rt instanceof Date
      ? Math.floor(rt.getTime() / 1000)
      : typeof rt === "number"
        ? Math.floor(rt / 1000)
        : Math.floor(Date.now() / 1000);

  const vol = n(r.regularMarketVolume);
  const adv = n(r.averageDailyVolume3Month);
  const relVol = vol != null && adv != null && adv > 0 ? vol / adv : null;
  const mktCap = n(r.marketCap);
  const pe = n(r.trailingPE);
  const eps = n(r.epsTrailingTwelveMonths);
  const epsF = n(r.epsForward);
  let epsGrowth = null;
  if (eps != null && epsF != null && Math.abs(eps) > 1e-9) {
    epsGrowth = ((epsF - eps) / Math.abs(eps)) * 100;
  }
  const sym =
    typeof r.symbol === "string" ? r.symbol.trim().toUpperCase() : null;
  const longName =
    typeof r.longName === "string"
      ? r.longName
      : typeof r.shortName === "string"
        ? r.shortName
        : null;

  return {
    c: price,
    d: n(r.regularMarketChange) ?? 0,
    dp: n(r.regularMarketChangePercent) ?? 0,
    h: n(r.regularMarketDayHigh) ?? n(r.dayHigh),
    l: n(r.regularMarketDayLow) ?? n(r.dayLow),
    o: n(r.regularMarketOpen) ?? n(r.open),
    pc: n(r.regularMarketPreviousClose) ?? n(r.previousClose),
    t: tSec,
    vol,
    volLabel: vol != null ? formatVolume(vol) : null,
    relVol,
    mktCap,
    mktCapLabel: mktCap != null ? formatMktCapNum(mktCap) : null,
    pe,
    eps,
    epsGrowth,
    logo: sym ? fmpStockLogoUrl(sym) : null,
    longName,
  };
}

/** @param {unknown} quarter */
function quarterLabel(quarter) {
  if (!quarter) return "";
  const d = quarter instanceof Date ? quarter : new Date(/** @type {string} */ (quarter));
  if (Number.isNaN(d.getTime())) return String(quarter);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function earningsSurpriseDisplay(surprisePercent, actual, estimate) {
  if (surprisePercent != null && Number.isFinite(surprisePercent)) {
    const v = /** @type {number} */ (surprisePercent);
    if (v > -1 && v < 1 && v !== 0) return v * 100;
    return v;
  }
  if (
    actual != null &&
    estimate != null &&
    Number.isFinite(actual) &&
    Number.isFinite(estimate) &&
    /** @type {number} */ (estimate) !== 0
  ) {
    return ((/** @type {number} */ (actual) - /** @type {number} */ (estimate)) /
      Math.abs(/** @type {number} */ (estimate))) *
      100;
  }
  return null;
}

/** @param {string} html */
function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

/**
 * Batch quotes — legacy keys (`c`, `d`, `dp`, …) plus screener fields (`volLabel`, `pe`, `logo`, …).
 * @returns {Promise<{ quotes: Record<string, unknown>, error: null | string }>}
 */
export async function getQuotes(handlerInput) {
  const symbols = sanitizeSymbols(handlerInput.symbols ?? []);
  /** @type {Record<string, unknown>} */
  const out = {};
  const now = Date.now();
  /** @type {string[]} */
  const need = [];

  for (const s of symbols) {
    const hit = CACHE.get(`quote:${s}`);
    if (hit && now - hit.t < TTL.quote) out[s] = hit.data;
    else need.push(s);
  }

  const batch = 35;
  for (let i = 0; i < need.length; i += batch) {
    const slice = need.slice(i, i + batch);
    try {
      const rows = await yahooFinance.quote(slice, {}, { validateResult: false });
      const list = Array.isArray(rows) ? rows : [rows];
      /** @type {Map<string, object>} */
      const bySym = new Map();
      for (const row of list) {
        if (row && typeof row === "object" && "symbol" in row) {
          bySym.set(String(/** @type {{ symbol: string }} */ (row).symbol).toUpperCase(), /** @type {object} */ (row));
        }
      }
      const t = Date.now();
      for (const s of slice) {
        const mapped = yahooRowToMarketQuote(bySym.get(s));
        CACHE.set(`quote:${s}`, { t, data: mapped });
        out[s] = mapped;
      }
    } catch (e) {
      console.error("[yahoo] quote batch failed:", /** @type {Error} */ (e).message);
      const t = Date.now();
      for (const s of slice) {
        CACHE.set(`quote:${s}`, { t, data: null });
        out[s] = null;
      }
    }
    if (i + batch < need.length) {
      await new Promise((r) => {
        setTimeout(r, 100);
      });
    }
  }

  for (const s of symbols) {
    if (!(s in out)) out[s] = null;
  }

  return { quotes: out, error: null };
}

async function loadStockBundle(sym) {
  const [quoteResult, fundResult, qsResult, recResult, insResult] = await Promise.allSettled([
    yahooFinance.quote(sym, {}, { validateResult: false }),
    getYahooFundamentals(sym),
    yahooFinance.quoteSummary(
      sym,
      {
        modules: ["assetProfile", "recommendationTrend", "earningsHistory", "insiderTransactions"],
      },
      { validateResult: false },
    ),
    yahooFinance.recommendationsBySymbol(sym),
    yahooFinance.insights(sym, { reportsCount: 10 }),
  ]);

  const qRaw = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  const yfQuote = Array.isArray(qRaw) ? qRaw[0] ?? null : qRaw;
  const yahooFund = fundResult.status === "fulfilled" ? fundResult.value : null;
  const qs = qsResult.status === "fulfilled" ? qsResult.value : {};
  const recSyms =
    recResult.status === "fulfilled" && recResult.value && typeof recResult.value === "object"
      ? recResult.value
      : { recommendedSymbols: [] };
  const insights = insResult.status === "fulfilled" ? insResult.value : {};

  /** @type {Record<string, unknown>} */
  const ap = /** @type {Record<string, unknown>} */ ((qs && typeof qs === "object" ? qs.assetProfile : null) ?? {});
  const website = typeof ap.website === "string" ? ap.website : undefined;

  const quoteRow = yfQuote && typeof yfQuote === "object" ? yfQuote : null;
  const mergedProfile = {
    name:
      (quoteRow && /** @type {{ longName?: string }} */ (quoteRow).longName) ||
      (quoteRow && /** @type {{ shortName?: string }} */ (quoteRow).shortName) ||
      sym,
    country: typeof ap.country === "string" ? ap.country : undefined,
    currency:
      (quoteRow && /** @type {{ currency?: string }} */ (quoteRow).currency) ||
      (yahooFund && yahooFund.currency) ||
      undefined,
    exchange:
      (quoteRow && /** @type {{ fullExchangeName?: string }} */ (quoteRow).fullExchangeName) ||
      (quoteRow && /** @type {{ exchange?: string }} */ (quoteRow).exchange) ||
      undefined,
    finnhubIndustry: typeof ap.industry === "string" ? ap.industry : undefined,
    weburl: website,
    logo: fmpStockLogoUrl(sym),
    marketCapitalization:
      yahooFund?.marketCap != null ? yahooFund.marketCap / 1e6 : undefined,
    shareOutstanding:
      yahooFund?.sharesOutstanding != null ? yahooFund.sharesOutstanding / 1e6 : undefined,
    yahoo: yahooFund,
  };

  const peers = (Array.isArray(recSyms.recommendedSymbols) ? recSyms.recommendedSymbols : [])
    .map((x) => normSym(String(x.symbol)))
    .filter((p) => p && p !== sym)
    .slice(0, 8);

  const recTrend = /** @type {{ trend?: unknown[] }} */ (
    qs && typeof qs === "object" ? qs.recommendationTrend : null
  );
  const recommendation = Array.isArray(recTrend?.trend) ? recTrend.trend.slice(0, 4) : [];

  const earnHist = /** @type {{ history?: unknown[] }} */ (
    qs && typeof qs === "object" ? qs.earningsHistory : null
  );
  const earnings = (Array.isArray(earnHist?.history) ? earnHist.history : [])
    .slice(0, 8)
    .map((h) => {
      const row = /** @type {Record<string, unknown>} */ (h);
      const actual = n(row.epsActual);
      const estimate = n(row.epsEstimate);
      return {
        period:
          quarterLabel(row.quarter) ||
          (typeof row.period === "string" ? row.period : "—"),
        estimate,
        actual,
        surprisePercent: earningsSurpriseDisplay(
          n(row.surprisePercent),
          actual,
          estimate,
        ),
      };
    });

  const insTx = /** @type {{ transactions?: unknown[] }} */ (
    qs && typeof qs === "object" ? qs.insiderTransactions : null
  );
  const insiderTransactions = (Array.isArray(insTx?.transactions) ? insTx.transactions : [])
    .slice(0, 15)
    .map((tx) => {
      const row = /** @type {Record<string, unknown>} */ (tx);
      const shares = typeof row.shares === "number" ? row.shares : n(row.shares) ?? 0;
      const text = `${row.transactionText ?? ""} ${row.moneyText ?? ""}`;
      const isSale = /sale/i.test(text);
      const change = isSale ? -Math.abs(shares) : Math.abs(shares);
      const val = n(row.value);
      const absS = Math.abs(shares);
      const transactionPrice = val != null && absS > 0 ? val / absS : null;
      const sd = row.startDate;
      const transactionDate =
        sd instanceof Date
          ? sd.toISOString().slice(0, 10)
          : typeof sd === "string"
            ? sd.slice(0, 10)
            : "—";
      return {
        name: typeof row.filerName === "string" ? row.filerName : "—",
        transactionDate,
        transactionCode: isSale ? "S" : "B",
        change,
        transactionPrice,
      };
    });

  /** @type {Array<Record<string, unknown>>} */
  const news = [];
  let nid = 0;
  const ins = /** @type {Record<string, unknown>} */ (insights && typeof insights === "object" ? insights : {});
  const secReports = /** @type {unknown[]} */ (ins.secReports ?? []);
  for (const item of secReports) {
    const s = /** @type {Record<string, unknown>} */ (item);
    const fd = s.filingDate;
    const ms = typeof fd === "number" ? fd : fd instanceof Date ? fd.getTime() : Date.now();
    news.push({
      id: nid++,
      url:
        typeof s.snapshotUrl === "string"
          ? s.snapshotUrl
          : `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`,
      image: undefined,
      source: "SEC",
      datetime: Math.floor(ms / 1000),
      headline: typeof s.title === "string" ? s.title : String(s.type ?? "Filing"),
      summary: typeof s.description === "string" ? s.description : "",
    });
  }
  for (const item of /** @type {unknown[]} */ (ins.sigDevs ?? [])) {
    const s = /** @type {Record<string, unknown>} */ (item);
    const d = s.date instanceof Date ? s.date : new Date(String(s.date));
    news.push({
      id: nid++,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`,
      image: undefined,
      source: "Yahoo Finance",
      datetime: Number.isNaN(d.getTime()) ? Math.floor(Date.now() / 1000) : Math.floor(d.getTime() / 1000),
      headline: typeof s.headline === "string" ? s.headline : "—",
      summary: "",
    });
  }
  for (const item of /** @type {unknown[]} */ (ins.reports ?? [])) {
    const r = /** @type {Record<string, unknown>} */ (item);
    const rd = r.reportDate instanceof Date ? r.reportDate : new Date(String(r.reportDate ?? ""));
    news.push({
      id: typeof r.id === "string" ? r.id : `r${nid++}`,
      url: `https://finance.yahoo.com/quote/${encodeURIComponent(sym)}`,
      image: undefined,
      source: typeof r.provider === "string" ? r.provider : "Research",
      datetime: Number.isNaN(rd.getTime()) ? Math.floor(Date.now() / 1000) : Math.floor(rd.getTime() / 1000),
      headline: typeof r.reportTitle === "string" ? r.reportTitle : "—",
      summary: stripHtml(typeof r.headHtml === "string" ? r.headHtml : ""),
    });
  }

  news.sort((a, b) => (Number(b.datetime) || 0) - (Number(a.datetime) || 0));

  return {
    symbol: sym,
    quote: quoteRow ? yahooRowToMarketQuote(quoteRow) : null,
    profile: mergedProfile,
    peers,
    recommendation,
    earnings,
    news: news.slice(0, 12),
    insiderTransactions,
    insiderSentiment: [],
    fundamentals: yahooFund,
  };
}

/** @returns {Promise<object>} */
export async function getStockBundle(handlerInput) {
  const sym = normSym(handlerInput.symbol);
  if (!sym) throw new HttpError(400, "Invalid symbol");

  const data = await cached(`bundle:${sym}`, TTL.bundle, () => loadStockBundle(sym), null);

  if (data && typeof data === "object") return data;

  return {
    symbol: sym,
    quote: null,
    profile: { name: sym, yahoo: null },
    peers: [],
    recommendation: [],
    earnings: [],
    news: [],
    insiderTransactions: [],
    insiderSentiment: [],
    fundamentals: null,
  };
}

const MOVER_SCREEN = {
  gainers: "day_gainers",
  losers: "day_losers",
  active: "most_actives",
  volume: "most_actives",
  "rel-volume": "most_actives",
};

/** @returns {Promise<{ mode: string, rows: object[] }>} */
export async function getMarketMovers(handlerInput) {
  const modeRaw = typeof handlerInput.mode === "string" ? handlerInput.mode : "gainers";
  const mode = MOVER_SCREEN[modeRaw] ? modeRaw : "gainers";
  const count = Math.min(Math.max(Number(handlerInput.count) || 12, 5), 25);
  const scrIds = MOVER_SCREEN[mode];

  return cached(`movers:${mode}:${count}`, TTL.quote, async () => {
    try {
      const result = await yahooFinance.screener({ scrIds, count: 25 }, { validateResult: false });
      const quotes = /** @type {unknown[]} */ (result?.quotes ?? []);
      let rows = quotes
        .map((row) => {
          const mapped = yahooRowToMarketQuote(row);
          if (!mapped) return null;
          const sym =
            row && typeof row === "object" && "symbol" in row
              ? String(/** @type {{ symbol: string }} */ (row).symbol).toUpperCase()
              : null;
          if (!sym) return null;
          return {
            sym,
            name:
              typeof mapped.longName === "string"
                ? mapped.longName
                : sym,
            price: mapped.c,
            change: mapped.d,
            changePct: mapped.dp,
            volume: mapped.vol,
            relVol: mapped.relVol,
            mktCap: mapped.mktCap,
          };
        })
        .filter(Boolean);

      if (mode === "volume") {
        rows.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
      } else if (mode === "rel-volume") {
        rows.sort((a, b) => (b.relVol ?? 0) - (a.relVol ?? 0));
      } else if (mode === "losers") {
        rows.sort((a, b) => a.changePct - b.changePct);
      } else if (mode === "gainers") {
        rows.sort((a, b) => b.changePct - a.changePct);
      }

      return { mode, rows: rows.slice(0, count) };
    } catch (e) {
      console.error("[yahoo] movers failed:", /** @type {Error} */ (e).message);
      return { mode, rows: [] };
    }
  }, { mode, rows: [] });
}

/** @returns {Promise<{ items: object[] }>} */
export async function getAggregatedNews(handlerInput) {
  const symbols = sanitizeSymbols(handlerInput.symbols ?? []);
  const limit = Math.min(Math.max(Number(handlerInput.limit) || 15, 5), 30);
  const syms = symbols.length ? symbols : ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN"];
  const key = `news:${syms.join(",")}:${limit}`;

  return cached(key, TTL.bundle, async () => {
    /** @type {object[]} */
    const items = [];
    const slice = syms.slice(0, 8);
    const bundles = await Promise.allSettled(slice.map((sym) => loadStockBundle(sym)));
    for (let i = 0; i < bundles.length; i++) {
      const sym = slice[i];
      const res = bundles[i];
      if (res.status !== "fulfilled" || !res.value?.news) continue;
      for (const n of res.value.news) {
        items.push({
          ...n,
          sym,
          id: `${sym}-${n.id ?? items.length}`,
        });
      }
    }
    items.sort((a, b) => (Number(b.datetime) || 0) - (Number(a.datetime) || 0));
    return { items: items.slice(0, limit) };
  }, { items: [] });
}
