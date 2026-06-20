import {
  bucketScore,
  clamp,
  missingDataScore,
  roundScore,
  weightedAverage,
} from "./bucket-scorer.js";
import {
  ACCELERATION_BUCKETS,
  ANALYST_COVERAGE_BUCKETS,
  EARNINGS_SURPRISE_BUCKETS,
  EPS_GROWTH_POSITIVE_BUCKETS,
  EPS_LOSS_CHANGE_BUCKETS,
  FLOAT_TURNOVER_BUCKETS,
  MA_RATIO_BUCKETS,
  OPERATING_MARGIN_BUCKETS,
  PERFORMANCE_BUCKETS,
  PRICE_TARGET_UPSIDE_BUCKETS,
  RELATIVE_VOLUME_BUCKETS,
  REVENUE_GROWTH_BUCKETS,
  VOLUME_TREND_BUCKETS,
} from "./tables.js";

/**
 * @param {number | null | undefined} raw
 * @param {import("./tables.js").PERFORMANCE_BUCKETS} buckets
 * @param {boolean} isIpo
 */
function scoreBucket(raw, buckets, isIpo) {
  if (raw == null || !Number.isFinite(raw)) return missingDataScore(isIpo);
  return bucketScore(raw, buckets) ?? missingDataScore(isIpo);
}

/** @param {Awaited<ReturnType<import("./data-loader.js").loadWolfRatingInputs>>} input */
export function computeMetrics(input) {
  const { isIpo } = input;
  const m = missingDataScore(isIpo);

  const excess1M =
    input.return1M != null && input.benchReturn1M != null
      ? input.return1M - input.benchReturn1M
      : null;
  const excess3M =
    input.return3M != null && input.benchReturn3M != null
      ? input.return3M - input.benchReturn3M
      : null;
  const acceleration =
    input.return1M != null && input.return3M != null
      ? input.return1M - input.return3M / 3
      : null;

  const ratio50 =
    input.priceForMa != null && input.ma50 != null && input.ma50 !== 0
      ? input.priceForMa / input.ma50
      : null;
  const ratio200 =
    input.priceForMa != null && input.ma200 != null && input.ma200 !== 0
      ? input.priceForMa / input.ma200
      : null;
  const maCross =
    input.ma50 != null && input.ma200 != null
      ? input.ma50 > input.ma200
        ? 100
        : 0
      : null;

  const ratio50Score =
    ratio50 != null ? bucketScore(ratio50, MA_RATIO_BUCKETS) ?? m : m;
  const ratio200Score =
    ratio200 != null ? bucketScore(ratio200, MA_RATIO_BUCKETS) ?? m : m;
  const maCrossScore = maCross ?? m;
  const metric4 = weightedAverage(
    { a: 0.4, b: 0.4, c: 0.2 },
    { a: ratio50Score, b: ratio200Score, c: maCrossScore },
  );

  let metric5 = m;
  if (input.revenueYoY?.missing || input.revenueYoY?.invalid) metric5 = m;
  else if (input.revenueYoY?.pct != null) {
    metric5 = scoreBucket(input.revenueYoY.pct, REVENUE_GROWTH_BUCKETS, isIpo);
  }

  let metric6 = m;
  const epsData = input.epsYoY;
  if (epsData?.missing || epsData?.invalid) {
    metric6 = m;
  } else if (epsData) {
    const cur = epsData.currentSum;
    const prior = epsData.priorSum;
    if (prior > 0 && cur > 0) {
      metric6 = scoreBucket(epsData.pct, EPS_GROWTH_POSITIVE_BUCKETS, isIpo);
    } else if (prior < 0 && cur > 0) {
      metric6 = 100;
    } else if (prior < 0 && cur < 0) {
      const lossChange =
        prior !== 0 ? ((Math.abs(prior) - Math.abs(cur)) / Math.abs(prior)) * 100 : null;
      metric6 =
        lossChange != null
          ? bucketScore(lossChange, EPS_LOSS_CHANGE_BUCKETS) ?? m
          : m;
    } else if (prior > 0 && cur < 0) {
      metric6 = 0;
    }
  }

  let metric7 = m;
  const latest = input.latestEarnings;
  if (latest?.surprisePct != null && Number.isFinite(latest.surprisePct)) {
    metric7 = scoreBucket(latest.surprisePct, EARNINGS_SURPRISE_BUCKETS, isIpo);
  } else if (latest?.actual != null && latest?.estimate != null && latest.estimate !== 0) {
    const surprise =
      ((latest.actual - latest.estimate) / Math.abs(latest.estimate)) * 100;
    metric7 = scoreBucket(surprise, EARNINGS_SURPRISE_BUCKETS, isIpo);
  }

  const metric8 = scoreBucket(input.operatingMargin, OPERATING_MARGIN_BUCKETS, isIpo);

  let metric9 = m;
  if (input.recommendationMean != null && Number.isFinite(input.recommendationMean)) {
    metric9 = clamp((5 - input.recommendationMean) * 25, 0, 100) ?? m;
  }

  let upside = null;
  if (
    input.targetMeanPrice != null &&
    input.priorClose != null &&
    input.priorClose !== 0
  ) {
    upside = ((input.targetMeanPrice - input.priorClose) / input.priorClose) * 100;
  }
  const metric10 = scoreBucket(upside, PRICE_TARGET_UPSIDE_BUCKETS, isIpo);

  let metric11 = m;
  if (input.analystCount != null && Number.isFinite(input.analystCount)) {
    metric11 = bucketScore(input.analystCount, ANALYST_COVERAGE_BUCKETS) ?? m;
  }

  let relVol = null;
  if (
    input.completedVolume != null &&
    input.avgVol30 != null &&
    input.avgVol30 > 0
  ) {
    relVol = input.completedVolume / input.avgVol30;
  }
  const metric12 = scoreBucket(relVol, RELATIVE_VOLUME_BUCKETS, isIpo);

  let volTrend = null;
  if (input.avgVol10 != null && input.avgVol30 != null && input.avgVol30 > 0) {
    volTrend = input.avgVol10 / input.avgVol30;
  }
  const metric13 = scoreBucket(volTrend, VOLUME_TREND_BUCKETS, isIpo);

  let floatTurnover = null;
  if (input.avgVol10 != null && input.floatShares != null && input.floatShares > 0) {
    floatTurnover = (input.avgVol10 / input.floatShares) * 100;
  }
  const metric14 = scoreBucket(floatTurnover, FLOAT_TURNOVER_BUCKETS, isIpo);

  return {
    metric1: scoreBucket(excess1M, PERFORMANCE_BUCKETS, isIpo),
    metric2: scoreBucket(excess3M, PERFORMANCE_BUCKETS, isIpo),
    metric3: scoreBucket(acceleration, ACCELERATION_BUCKETS, isIpo),
    metric4: metric4 ?? m,
    metric5,
    metric6,
    metric7,
    metric8,
    metric9,
    metric10,
    metric11,
    metric12,
    metric13,
    metric14,
  };
}

/** @param {ReturnType<typeof computeMetrics>} metrics */
export function computeCategories(metrics) {
  const momentum = weightedAverage(
    { m1: 0.3, m2: 0.3, m3: 0.2, m4: 0.2 },
    {
      m1: metrics.metric1,
      m2: metrics.metric2,
      m3: metrics.metric3,
      m4: metrics.metric4,
    },
  );
  const growth = weightedAverage(
    { m5: 0.4, m6: 0.25, m7: 0.25, m8: 0.1 },
    {
      m5: metrics.metric5,
      m6: metrics.metric6,
      m7: metrics.metric7,
      m8: metrics.metric8,
    },
  );
  const sentiment = weightedAverage(
    { m9: 0.6, m10: 0.25, m11: 0.15 },
    {
      m9: metrics.metric9,
      m10: metrics.metric10,
      m11: metrics.metric11,
    },
  );
  const activity = weightedAverage(
    { m12: 0.6, m13: 0.2, m14: 0.2 },
    {
      m12: metrics.metric12,
      m13: metrics.metric13,
      m14: metrics.metric14,
    },
  );

  return {
    momentum: momentum ?? 50,
    growth: growth ?? 50,
    sentiment: sentiment ?? 50,
    activity: activity ?? 50,
  };
}

/** @param {ReturnType<typeof computeCategories>} categories */
export function computeWolfRating(categories) {
  const raw = weightedAverage(
    { momentum: 0.3, growth: 0.3, sentiment: 0.2, activity: 0.2 },
    categories,
  );
  return roundScore(raw ?? 50);
}

/** @param {ReturnType<typeof computeCategories>} categories */
export function formatPublicRating(categories, meta = {}) {
  return {
    wolfRating: computeWolfRating(categories),
    momentumRating: roundScore(categories.momentum),
    growthRating: roundScore(categories.growth),
    sentimentRating: roundScore(categories.sentiment),
    activityRating: roundScore(categories.activity),
    ...meta,
  };
}

/** @param {ReturnType<typeof computeMetrics>} metrics @param {ReturnType<typeof computeCategories>} categories */
export function formatDebugRating(categories, metrics, meta = {}) {
  return {
    ...formatPublicRating(categories, meta),
    metrics,
    categoriesRaw: categories,
  };
}
