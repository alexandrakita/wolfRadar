/** Performance-style buckets (metrics 1–3). Gaps between tiers inherit prior low score. */
export const PERFORMANCE_BUCKETS = [
  { max: -20, maxInclusive: true, score: 0 },
  { min: -20, max: -15, score: 0 },
  { min: -15, max: -10, score: 10 },
  { min: -10, max: -5, score: 20 },
  { min: -5, max: 0, score: 35 },
  { min: 0, max: 5, score: 50 },
  { min: 5, max: 10, score: 70 },
  { min: 10, max: 15, score: 85 },
  { min: 15, max: 20, score: 93 },
  { min: 20, max: 25, score: 97 },
  { min: 25, score: 100 },
];

/** Metric 3 acceleration — 5–10 tier uses 65 not 70. */
export const ACCELERATION_BUCKETS = [
  { max: -20, maxInclusive: true, score: 0 },
  { min: -20, max: -15, score: 0 },
  { min: -15, max: -10, score: 10 },
  { min: -10, max: -5, score: 20 },
  { min: -5, max: 0, score: 35 },
  { min: 0, max: 5, score: 50 },
  { min: 5, max: 10, score: 65 },
  { min: 10, max: 15, score: 80 },
  { min: 15, max: 20, score: 90 },
  { min: 20, max: 25, score: 95 },
  { min: 25, score: 100 },
];

export const MA_RATIO_BUCKETS = [
  { max: 0.8, maxInclusive: true, score: 0 },
  { min: 0.8, max: 0.85, score: 0 },
  { min: 0.85, max: 0.9, score: 10 },
  { min: 0.9, max: 0.95, score: 20 },
  { min: 0.95, max: 1.0, score: 35 },
  { min: 1.0, max: 1.05, score: 50 },
  { min: 1.05, max: 1.1, score: 65 },
  { min: 1.1, max: 1.15, score: 80 },
  { min: 1.15, max: 1.2, score: 90 },
  { min: 1.2, score: 100 },
];

export const REVENUE_GROWTH_BUCKETS = [
  { max: -30, maxInclusive: true, score: 0 },
  { min: -30, max: -20, score: 0 },
  { min: -20, max: -10, score: 20 },
  { min: -10, max: -5, score: 40 },
  { min: -5, max: 0, score: 45 },
  { min: 0, max: 5, score: 50 },
  { min: 5, max: 10, score: 60 },
  { min: 10, max: 20, score: 70 },
  { min: 20, max: 30, score: 80 },
  { min: 30, max: 40, score: 90 },
  { min: 40, max: 50, score: 95 },
  { min: 50, score: 100 },
];

export const EPS_GROWTH_POSITIVE_BUCKETS = [
  { max: -50, maxInclusive: true, score: 0 },
  { min: -50, max: -40, score: 0 },
  { min: -40, max: 0, score: 40 },
  { min: 0, max: 20, score: 60 },
  { min: 20, max: 40, score: 75 },
  { min: 40, max: 60, score: 85 },
  { min: 60, max: 100, score: 95 },
  { min: 100, score: 100 },
];

export const EPS_LOSS_CHANGE_BUCKETS = [
  { max: -100, maxInclusive: true, score: 0 },
  { min: -100, max: -50, score: 0 },
  { min: -50, max: -25, score: 0 },
  { min: -25, max: 0, score: 0 },
  { min: 0, max: 50, score: 40 },
  { min: 50, max: 70, score: 60 },
  { min: 70, max: 90, score: 70 },
  { min: 90, score: 80 },
];

export const EARNINGS_SURPRISE_BUCKETS = [
  { max: -50, maxInclusive: true, score: 0 },
  { min: -50, max: -30, score: 0 },
  { min: -30, max: -20, score: 10 },
  { min: -20, max: -10, score: 20 },
  { min: -10, max: 0, score: 35 },
  { min: 0, max: 5, score: 50 },
  { min: 5, max: 10, score: 60 },
  { min: 10, max: 20, score: 70 },
  { min: 20, max: 30, score: 80 },
  { min: 30, max: 50, score: 90 },
  { min: 50, max: 75, score: 95 },
  { min: 75, score: 100 },
];

export const OPERATING_MARGIN_BUCKETS = [
  { max: -20, maxInclusive: true, score: 0 },
  { min: -20, max: -10, score: 0 },
  { min: -10, max: 0, score: 20 },
  { min: 0, max: 10, score: 50 },
  { min: 10, max: 20, score: 60 },
  { min: 20, max: 30, score: 70 },
  { min: 30, max: 40, score: 80 },
  { min: 40, max: 50, score: 90 },
  { min: 50, max: 60, score: 95 },
  { min: 60, score: 100 },
];

export const PRICE_TARGET_UPSIDE_BUCKETS = [
  { max: -30, maxInclusive: true, score: 0 },
  { min: -30, max: -20, score: 0 },
  { min: -20, max: -10, score: 10 },
  { min: -10, max: 0, score: 25 },
  { min: 0, max: 10, score: 50 },
  { min: 10, max: 20, score: 65 },
  { min: 20, max: 30, score: 75 },
  { min: 30, max: 40, score: 85 },
  { min: 40, max: 50, score: 90 },
  { min: 50, max: 75, score: 95 },
  { min: 75, score: 100 },
];

export const ANALYST_COVERAGE_BUCKETS = [
  { exact: 0, score: 50 },
  { min: 1, max: 3, score: 55 },
  { min: 3, max: 6, score: 65 },
  { min: 6, max: 11, score: 75 },
  { min: 11, max: 21, score: 85 },
  { min: 21, max: 31, score: 95 },
  { min: 31, score: 100 },
];

export const RELATIVE_VOLUME_BUCKETS = [
  { max: 0.4, maxInclusive: true, score: 0 },
  { min: 0.4, max: 0.75, score: 0 },
  { min: 0.75, max: 1.0, score: 25 },
  { min: 1.0, max: 1.25, score: 50 },
  { min: 1.25, max: 1.5, score: 60 },
  { min: 1.5, max: 2.0, score: 70 },
  { min: 2.0, max: 3.0, score: 80 },
  { min: 3.0, max: 5.0, score: 90 },
  { min: 5.0, max: 10.0, score: 95 },
  { min: 10.0, score: 100 },
];

export const VOLUME_TREND_BUCKETS = [
  { max: 0.5, maxInclusive: true, score: 0 },
  { min: 0.5, max: 0.75, score: 0 },
  { min: 0.75, max: 1.0, score: 25 },
  { min: 1.0, max: 1.25, score: 50 },
  { min: 1.25, max: 1.5, score: 70 },
  { min: 1.5, max: 2.0, score: 80 },
  { min: 2.0, max: 3.0, score: 90 },
  { min: 3.0, score: 100 },
];

export const FLOAT_TURNOVER_BUCKETS = [
  { max: 0.5, maxInclusive: true, score: 0 },
  { min: 0.5, max: 1.0, score: 0 },
  { min: 1.0, max: 2.0, score: 20 },
  { min: 2.0, max: 5.0, score: 35 },
  { min: 5.0, max: 10.0, score: 50 },
  { min: 10.0, max: 20.0, score: 70 },
  { min: 20.0, max: 30.0, score: 85 },
  { min: 30.0, max: 50.0, score: 95 },
  { min: 50.0, score: 100 },
];
