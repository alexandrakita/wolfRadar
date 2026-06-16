import YahooFinance from "yahoo-finance2";

import { fmpStockLogoUrl, getQuotes, sanitizeSymbols } from "./yahoo.js";

const yahooFinance = new YahooFinance();

try {
  yahooFinance.suppressNotices?.(["yahooSurvey", "ripHistorical"]);
} catch {
  // ignore
}

const CACHE = new Map();
const INFLIGHT = new Map();
const METRICS_TTL = 30 * 60_000;
const CONCURRENCY = 6;

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

async function cached(key, ttlMs, loader) {
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
    } finally {
      INFLIGHT.delete(key);
    }
  })();

  INFLIGHT.set(key, inflight);
  return inflight;
}

async function loadSymbolMetrics(sym) {
  return cached(`screener:${sym}`, METRICS_TTL, async () => {
    const [qsResult, chartResult] = await Promise.allSettled([
      yahooFinance.quoteSummary(
        sym,
        {
          modules: ["summaryDetail", "financialData", "defaultKeyStatistics", "assetProfile", "price"],
        },
        { validateResult: false },
      ),
      yahooFinance.chart(sym, {
        period1: new Date(Date.now() - 370 * 86_400_000),
        period2: new Date(),
        interval: "1d",
      }),
    ]);

    const qs = qsResult.status === "fulfilled" ? qsResult.value : {};
    const sd = qs.summaryDetail ?? {};
    const fd = qs.financialData ?? {};
    const ks = qs.defaultKeyStatistics ?? {};
    const ap = qs.assetProfile ?? {};
    const pr = qs.price ?? {};

    const chartQuotes =
      chartResult.status === "fulfilled" ? (chartResult.value?.quotes ?? []) : [];
    const points = chartQuotes
      .filter((q) => q.close != null && Number.isFinite(q.close))
      .map((q) => ({
        t: q.date instanceof Date ? q.date.getTime() : new Date(q.date).getTime(),
        c: q.close,
      }));

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
      chg: n(pr.regularMarketChangePercent) ?? null,
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
  });
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
