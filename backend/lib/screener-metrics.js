import { fmpStockLogoUrl, getQuotes, sanitizeSymbols } from "./yahoo.js";
import { withYahooRetry, yahooFinance } from "./yahoo-client.js";

const CACHE = new Map();
const INFLIGHT = new Map();
const METRICS_TTL = 30 * 60_000;
const CONCURRENCY = 4;

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

/** Yahoo growth/yield fields are often 0–1 decimals; normalize to percent (0–100+). */
function toPct(v) {
  const x = n(v);
  if (x == null) return null;
  if (Math.abs(x) <= 1.5) return x * 100;
  return x;
}

function findPriceAt(points, targetMs) {
  if (!points.length) return null;
  let best = points[0];
  for (const p of points) {
    if (p.t <= targetMs) best = p;
    else break;
  }
  return best.c;
}

function pctChange(current, from) {
  if (current == null || from == null || !Number.isFinite(current) || !Number.isFinite(from) || from === 0) {
    return null;
  }
  return ((current - from) / Math.abs(from)) * 100;
}

function computePerformance(points) {
  if (!points || points.length < 2) return {};
  const last = points[points.length - 1];
  const price = last.c;
  if (price == null || !Number.isFinite(price)) return {};

  const prev = points[points.length - 2]?.c ?? null;
  const weekAgo = findPriceAt(points, last.t - 7 * 86_400_000);
  const monthAgo = findPriceAt(points, last.t - 30 * 86_400_000);
  const threeMonthAgo = findPriceAt(points, last.t - 90 * 86_400_000);

  const yearStart = new Date(new Date(last.t).getFullYear(), 0, 1).getTime();
  let ytdPrice = points[0].c;
  for (const p of points) {
    if (p.t >= yearStart) break;
    ytdPrice = p.c;
  }
  for (const p of points) {
    if (p.t >= yearStart) {
      ytdPrice = p.c;
      break;
    }
  }

  return {
    perfDaily: pctChange(price, prev),
    perfWeekly: pctChange(price, weekAgo),
    perfMonthly: pctChange(price, monthAgo),
    perf1M: pctChange(price, monthAgo),
    perf3M: pctChange(price, threeMonthAgo),
    perfYtd: pctChange(price, ytdPrice),
  };
}

async function cached(key, ttlMs, loader, isComplete) {
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && now - hit.t < ttlMs) {
    if (!isComplete || isComplete(hit.data)) return hit.data;
    CACHE.delete(key);
  }

  let inflight = INFLIGHT.get(key);
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const data = await loader();
      if (!isComplete || isComplete(data)) {
        CACHE.set(key, { t: Date.now(), data });
      }
      return data;
    } finally {
      INFLIGHT.delete(key);
    }
  })();

  INFLIGHT.set(key, inflight);
  return inflight;
}

function metricsComplete(data) {
  return data != null && data.price != null && Number.isFinite(data.price);
}

function snapshotMetricsComplete(data) {
  return (
    metricsComplete(data) &&
    data.perf1M != null &&
    Number.isFinite(data.perf1M) &&
    data.perf3M != null &&
    Number.isFinite(data.perf3M)
  );
}

function chartPointsFromQuotes(quotes) {
  return (quotes ?? [])
    .filter((q) => q.close != null && Number.isFinite(q.close))
    .map((q) => ({
      t: q.date instanceof Date ? q.date.getTime() : new Date(q.date).getTime(),
      c: q.close,
    }));
}

/** Retry empty chart responses — Yahoo often rate-limits without throwing. */
async function fetchChartPoints(sym, { attempts = 5, delayMs = 600 } = {}) {
  let lastPoints = [];
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await withYahooRetry(
        () =>
          yahooFinance.chart(sym, {
            period1: new Date(Date.now() - 370 * 86_400_000),
            period2: new Date(),
            interval: "1d",
          }),
        { attempts: 3, delayMs: 800 },
      );
      lastPoints = chartPointsFromQuotes(res?.quotes ?? []);
      if (lastPoints.length >= 2) return lastPoints;
    } catch (e) {
      console.warn(`[screener-metrics] ${sym} chart attempt ${i + 1} failed:`, /** @type {Error} */ (e).message);
    }
    if (i < attempts - 1) {
      await new Promise((r) => {
        setTimeout(r, delayMs * (i + 1));
      });
    }
  }
  return lastPoints;
}

async function loadSymbolMetricsPayload(sym, { snapshot = false } = {}) {
  let points = [];
  if (snapshot) {
    points = await fetchChartPoints(sym);
  } else {
    const chartResult = await Promise.allSettled([
      withYahooRetry(() =>
        yahooFinance.chart(sym, {
          period1: new Date(Date.now() - 370 * 86_400_000),
          period2: new Date(),
          interval: "1d",
        }),
      ),
    ]);
    points =
      chartResult[0].status === "fulfilled"
        ? chartPointsFromQuotes(chartResult[0].value?.quotes ?? [])
        : [];
  }

  const qs = await withYahooRetry(
    () =>
      yahooFinance.quoteSummary(
        sym,
        {
          modules: ["summaryDetail", "financialData", "defaultKeyStatistics", "assetProfile", "price"],
        },
        { validateResult: false },
      ),
    { attempts: 3, delayMs: snapshot ? 800 : 400 },
  );

  const sd = qs.summaryDetail ?? {};
  const fd = qs.financialData ?? {};
  const ks = qs.defaultKeyStatistics ?? {};
  const ap = qs.assetProfile ?? {};
  const pr = qs.price ?? {};

  const price = n(pr.regularMarketPrice) ?? n(fd.currentPrice);
  const perf = computePerformance(points);

  const fiftyTwoWeekHigh = n(sd.fiftyTwoWeekHigh);
  const fiftyTwoWeekLow = n(sd.fiftyTwoWeekLow);
  const high52wProximity =
    price != null && fiftyTwoWeekHigh != null && fiftyTwoWeekHigh > 0
      ? (price / fiftyTwoWeekHigh) * 100
      : null;
  const low52wProximity =
    price != null && fiftyTwoWeekLow != null && fiftyTwoWeekLow > 0
      ? (price / fiftyTwoWeekLow) * 100
      : null;

  const trailingEps = n(ks.trailingEps);
  const forwardEps = n(ks.forwardEps);
  let epsGrowth = null;
  if (trailingEps != null && forwardEps != null && Math.abs(trailingEps) > 1e-9) {
    epsGrowth = ((forwardEps - trailingEps) / Math.abs(trailingEps)) * 100;
  }

  const earningsGrowth = toPct(fd.earningsGrowth);
  const revenueGrowth = toPct(fd.revenueGrowth);

  return {
    price,
    chg: toPct(n(pr.regularMarketChangePercent)) ?? toPct(n(sd.regularMarketChangePercent)),
    vol: n(sd.regularMarketVolume) ?? n(pr.regularMarketVolume),
    avgVolume: n(sd.averageDailyVolume3Month) ?? n(pr.averageDailyVolume3Month),
    relVol: (() => {
      const vol = n(sd.regularMarketVolume) ?? n(pr.regularMarketVolume);
      const adv = n(sd.averageDailyVolume3Month) ?? n(pr.averageDailyVolume3Month);
      return vol != null && adv != null && adv > 0 ? vol / adv : null;
    })(),
    mktCap: n(pr.marketCap) ?? n(sd.marketCap),
    pe: n(sd.trailingPE),
    ps: n(sd.priceToSalesTrailing12Months),
    peg: n(ks.pegRatio),
    eps: trailingEps,
    epsGrowth,
    earningsGrowth,
    revenueGrowth,
    divYield: toPct(sd.dividendYield),
    roe: toPct(fd.returnOnEquity),
    beta: n(sd.beta) ?? n(ks.beta),
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    high52wProximity,
    low52wProximity,
    country: typeof ap.country === "string" ? ap.country : null,
    exchange:
      typeof pr.exchangeName === "string"
        ? pr.exchangeName
        : typeof ap.exchange === "string"
          ? ap.exchange
          : null,
    sector: typeof ap.sector === "string" ? ap.sector : null,
    industry: typeof ap.industry === "string" ? ap.industry : null,
    longName:
      typeof pr.longName === "string"
        ? pr.longName
        : typeof pr.shortName === "string"
          ? pr.shortName
          : null,
    logo: fmpStockLogoUrl(sym),
    ...perf,
  };
}

export function clearSymbolMetricsCache(sym) {
  const key = String(sym ?? "")
    .trim()
    .toUpperCase();
  if (!key) return;
  CACHE.delete(`screener:${key}`);
  CACHE.delete(`screener:snapshot:${key}`);
}

export async function loadSymbolMetrics(sym) {
  return cached(
    `screener:${sym}`,
    METRICS_TTL,
    () => loadSymbolMetricsPayload(sym, { snapshot: false }),
    metricsComplete,
  );
}

/** Snapshot build — require 1M/3M perf and retry empty Yahoo charts. */
export async function loadSymbolMetricsForSnapshot(sym) {
  clearSymbolMetricsCache(sym);
  return cached(
    `screener:snapshot:${sym}`,
    METRICS_TTL,
    () => loadSymbolMetricsPayload(sym, { snapshot: true }),
    snapshotMetricsComplete,
  );
}

async function mapPool(items, worker) {
  const out = new Array(items.length);
  let i = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return out;
}

/**
 * Batch screener metrics — quote fields + Yahoo fundamentals + chart performance.
 * @returns {Promise<{ metrics: Record<string, object | null>, error: null | string }>}
 */
export async function getScreenerMetrics(handlerInput) {
  const symbols = sanitizeSymbols(handlerInput.symbols ?? []);
  const { quotes } = await getQuotes({ symbols });
  /** @type {Record<string, object | null>} */
  const metrics = {};

  const rows = await mapPool(symbols, async (sym) => {
    try {
      const extra = await loadSymbolMetrics(sym);
      const q = quotes[sym];
      const merged = {
        ...extra,
        price: extra.price ?? q?.c ?? null,
        chg: extra.chg ?? q?.dp ?? null,
        vol: extra.vol ?? q?.vol ?? null,
        relVol: extra.relVol ?? q?.relVol ?? null,
        mktCap: extra.mktCap ?? q?.mktCap ?? null,
        pe: extra.pe ?? q?.pe ?? null,
        eps: extra.eps ?? q?.eps ?? null,
        epsGrowth: extra.epsGrowth ?? q?.epsGrowth ?? null,
        longName: extra.longName ?? q?.longName ?? null,
        logo: extra.logo ?? q?.logo ?? null,
      };
      return { sym, data: merged };
    } catch (e) {
      console.error(`[screener-metrics] ${sym} failed:`, /** @type {Error} */ (e).message);
      const q = quotes[sym];
      return { sym, data: q ? { ...q, price: q.c, chg: q.dp } : null };
    }
  });

  for (const { sym, data } of rows) {
    metrics[sym] = data;
  }

  for (const s of symbols) {
    if (!(s in metrics)) metrics[s] = null;
  }

  return { metrics, error: null };
}
