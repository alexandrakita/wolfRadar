import { getYahooFundamentals } from "../yahoo.js";
import { withYahooRetry, yahooFinance } from "../yahoo-client.js";

const BENCHMARK = "^GSPC";
const MS_DAY = 86_400_000;

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

function toDateMs(d) {
  if (d instanceof Date) return d.getTime();
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? null : x.getTime();
}

function fmtDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function isSameCalendarDay(msA, msB) {
  const a = new Date(msA);
  const b = new Date(msB);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** @param {{ t: number, c: number, v: number | null }[]} points */
function getCompletedBar(points) {
  if (!points.length) return null;
  const now = Date.now();
  const last = points[points.length - 1];
  if (points.length >= 2 && isSameCalendarDay(last.t, now)) {
    return points[points.length - 2];
  }
  return last;
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
  if (
    current == null ||
    from == null ||
    !Number.isFinite(current) ||
    !Number.isFinite(from) ||
    from === 0
  ) {
    return null;
  }
  return ((current - from) / Math.abs(from)) * 100;
}

/** @param {unknown[]} quotes */
function chartPoints(quotes) {
  return quotes
    .filter((q) => q.close != null && Number.isFinite(q.close))
    .map((q) => ({
      t: toDateMs(q.date) ?? 0,
      c: q.close,
      v: typeof q.volume === "number" && Number.isFinite(q.volume) ? q.volume : null,
    }));
}

async function loadDailyChart(symbol) {
  const res = await withYahooRetry(() =>
    yahooFinance.chart(
      symbol,
      {
        period1: new Date(Date.now() - 400 * MS_DAY),
        period2: new Date(),
        interval: "1d",
      },
      { validateResult: false },
    ),
  );
  return chartPoints(res.quotes ?? []);
}

/** @param {unknown} row */
function quarterMs(row) {
  const r = /** @type {Record<string, unknown>} */ (row);
  return toDateMs(r.endDate ?? r.date ?? r.quarter);
}

async function loadQuarterlyFinancials(symbol) {
  try {
    const rows = await withYahooRetry(() =>
      yahooFinance.fundamentalsTimeSeries(
        symbol,
        {
          period1: new Date(Date.now() - 900 * MS_DAY),
          period2: new Date(),
          type: "quarterly",
          module: "financials",
        },
        { validateResult: false },
      ),
    );
    return (Array.isArray(rows) ? rows : [])
      .map((row) => {
        const r = /** @type {Record<string, unknown>} */ (row);
        const ms = toDateMs(r.date);
        if (ms == null) return null;
        return {
          ms,
          revenue: n(r.totalRevenue),
          eps: n(r.dilutedEPS) ?? n(r.basicEPS),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ms - a.ms);
  } catch (e) {
    console.error(`[wolf-rating] quarterly financials ${symbol}:`, /** @type {Error} */ (e).message);
    return [];
  }
}

async function loadOperatingMarginTtm(symbol) {
  try {
    const rows = await withYahooRetry(() =>
      yahooFinance.fundamentalsTimeSeries(
        symbol,
        {
          period1: new Date(Date.now() - 400 * MS_DAY),
          period2: new Date(),
          type: "trailing",
          module: "financials",
        },
        { validateResult: false },
      ),
    );
    const latest = Array.isArray(rows) ? rows[rows.length - 1] : null;
    if (!latest) return null;
    const r = /** @type {Record<string, unknown>} */ (latest);
    const revenue = n(r.trailingTotalRevenue) ?? n(r.totalRevenue);
    const oi = n(r.trailingOperatingIncome) ?? n(r.operatingIncome);
    if (revenue == null || oi == null || revenue === 0) return null;
    return (oi / revenue) * 100;
  } catch {
    return null;
  }
}

/**
 * Latest 2 reported quarters vs same fiscal quarters one year prior.
 * @param {{ ms: number, revenue: number | null, eps: number | null }[]} quarters
 * @param {"revenue" | "eps"} field
 */
function sumLatestTwoYoY(quarters, field) {
  if (quarters.length < 2) return null;
  const latest = quarters.slice(0, 2);
  const priorYear = latest.map((q) => findPriorYearQuarter(quarters, q.ms));
  if (priorYear.some((q) => q == null)) return { missing: true };

  const currentSum = latest.reduce((s, q) => s + (q[field] ?? 0), 0);
  const priorSum = priorYear.reduce((s, q) => s + (q[field] ?? 0), 0);

  const hasMissing =
    latest.some((q) => q[field] == null) || priorYear.some((q) => q[field] == null);
  if (hasMissing) return { missing: true };
  if (priorSum === 0) return { invalid: true };

  return {
    missing: false,
    currentSum,
    priorSum,
    pct: ((currentSum - priorSum) / Math.abs(priorSum)) * 100,
  };
}

/** @param {{ ms: number }[]} quarters @param {number} targetMs */
function findPriorYearQuarter(quarters, targetMs) {
  const target = new Date(targetMs);
  const wantYear = target.getUTCFullYear() - 1;
  const wantMonth = target.getUTCMonth();
  let best = null;
  let bestDiff = Infinity;
  for (const q of quarters) {
    const d = new Date(q.ms);
    if (d.getUTCFullYear() !== wantYear) continue;
    const diff = Math.abs(d.getUTCMonth() - wantMonth);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = q;
    }
  }
  return bestDiff <= 1 ? best : null;
}

/**
 * @param {string} symbol
 * @returns {Promise<object>}
 */
export async function loadWolfRatingInputs(symbol) {
  const [fundamentals, stockPoints, benchmarkPoints, qsResult, quarterly, operatingMarginTtm] =
    await Promise.all([
    getYahooFundamentals(symbol),
    loadDailyChart(symbol),
    loadDailyChart(BENCHMARK),
    yahooFinance.quoteSummary(
      symbol,
      {
        modules: ["earningsHistory", "defaultKeyStatistics", "price"],
      },
      { validateResult: false },
    ),
    loadQuarterlyFinancials(symbol),
    loadOperatingMarginTtm(symbol),
  ]);

  const completed = getCompletedBar(stockPoints);
  const completedPrice = completed?.c ?? null;
  const completedVolume = completed?.v ?? null;
  const completedDate = completed ? fmtDate(completed.t) : null;

  const return1M =
    completedPrice != null
      ? pctChange(completedPrice, findPriceAt(stockPoints, completed.t - 30 * MS_DAY))
      : null;
  const return3M =
    completedPrice != null
      ? pctChange(completedPrice, findPriceAt(stockPoints, completed.t - 90 * MS_DAY))
      : null;

  const benchCompleted = getCompletedBar(benchmarkPoints);
  const benchReturn1M =
    benchCompleted?.c != null
      ? pctChange(
          benchCompleted.c,
          findPriceAt(benchmarkPoints, benchCompleted.t - 30 * MS_DAY),
        )
      : null;
  const benchReturn3M =
    benchCompleted?.c != null
      ? pctChange(
          benchCompleted.c,
          findPriceAt(benchmarkPoints, benchCompleted.t - 90 * MS_DAY),
        )
      : null;

  const qs = qsResult ?? {};
  const ks = qs.defaultKeyStatistics ?? {};
  const pr = qs.price ?? {};
  const earnHist = qs.earningsHistory ?? {};

  const firstTradeMs =
    toDateMs(pr.firstTradeDate) ??
    (n(ks.firstTradeDateEpoch) != null ? n(ks.firstTradeDateEpoch) * 1000 : null);
  const isIpo =
    firstTradeMs != null ? Date.now() - firstTradeMs < 365 * MS_DAY : false;

  const earningsRows = (Array.isArray(earnHist.history) ? earnHist.history : [])
    .map((h) => {
      const row = /** @type {Record<string, unknown>} */ (h);
      const actual = n(row.epsActual);
      const estimate = n(row.epsEstimate);
      let surprisePct = n(row.surprisePercent);
      if (surprisePct != null && surprisePct > -1 && surprisePct < 1 && surprisePct !== 0) {
        surprisePct *= 100;
      } else if (
        surprisePct == null &&
        actual != null &&
        estimate != null &&
        estimate !== 0
      ) {
        surprisePct = ((actual - estimate) / Math.abs(estimate)) * 100;
      }
      return {
        ms: quarterMs(row) ?? 0,
        actual,
        estimate,
        surprisePct,
      };
    })
    .sort((a, b) => b.ms - a.ms);

  const latestEarnings = earningsRows[0] ?? null;
  const revenueYoY = sumLatestTwoYoY(quarterly, "revenue");
  const epsYoY = sumLatestTwoYoY(quarterly, "eps");

  const ma50 = fundamentals?.fiftyDayAverage ?? null;
  const ma200 = fundamentals?.twoHundredDayAverage ?? null;
  const priceForMa = completedPrice ?? fundamentals?.price ?? null;
  const avgVol30 = fundamentals?.averageDailyVolume3Month ?? null;
  const avgVol10 = fundamentals?.averageDailyVolume10Day ?? null;
  const floatShares = n(ks.floatShares);
  const priorClose = completedPrice ?? fundamentals?.price ?? null;

  return {
    symbol,
    ratingDate: completedDate,
    isIpo,
    completedPrice,
    completedVolume,
    return1M,
    return3M,
    benchReturn1M,
    benchReturn3M,
    priceForMa,
    ma50,
    ma200,
    revenueYoY,
    epsYoY,
    latestEarnings,
    operatingMargin:
      operatingMarginTtm ??
      (fundamentals?.operatingMargins != null
        ? fundamentals.operatingMargins * 100
        : null),
    recommendationMean: fundamentals?.recommendationMean ?? null,
    targetMeanPrice: fundamentals?.targetMeanPrice ?? null,
    analystCount: fundamentals?.numberOfAnalystOpinions ?? null,
    avgVol30,
    avgVol10,
    floatShares,
    priorClose,
  };
}

/** Latest completed US trading session date (YYYY-MM-DD). */
export function getOfficialRatingDate() {
  const now = new Date();
  const day = now.getUTCDay();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (day === 0) d.setUTCDate(d.getUTCDate() - 2);
  else if (day === 6) d.setUTCDate(d.getUTCDate() - 1);
  else if (day === 1 && now.getUTCHours() < 14) d.setUTCDate(d.getUTCDate() - 3);
  else if (now.getUTCHours() < 14) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
