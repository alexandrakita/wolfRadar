/**
 * Bucket scoring — lower-bound-inclusive, upper-bound-exclusive unless noted.
 * @typedef {{ score: number, min?: number, max?: number, minInclusive?: boolean, maxInclusive?: boolean, exact?: number }} Bucket
 */

/**
 * @param {number | null | undefined} value
 * @param {Bucket[]} buckets
 * @returns {number | null}
 */
export function bucketScore(value, buckets) {
  if (value == null || !Number.isFinite(value)) return null;

  for (const b of buckets) {
    if (b.exact != null && value === b.exact) return b.score;

    const minOk =
      b.min == null ||
      (b.minInclusive === false ? value > b.min : value >= b.min);
    const maxOk =
      b.max == null ||
      (b.maxInclusive ? value <= b.max : value < b.max);

    if (minOk && maxOk) return b.score;
  }

  return null;
}

/**
 * @param {number | null | undefined} value
 * @param {Bucket[]} buckets
 * @param {number} fallback
 */
export function bucketScoreOr(value, buckets, fallback) {
  return bucketScore(value, buckets) ?? fallback;
}

/** @param {number} score @param {boolean} isIpo */
export function missingDataScore(isIpo) {
  return isIpo ? 75 : 50;
}

/** @param {number | null | undefined} value @param {number} lo @param {number} hi */
export function clamp(value, lo, hi) {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(lo, Math.min(hi, value));
}

/** @param {number} value */
export function roundScore(value) {
  return Math.round(Math.max(0, Math.min(100, value)));
}

/** @param {Record<string, number>} weights @param {Record<string, number | null>} scores */
export function weightedAverage(weights, scores) {
  let totalWeight = 0;
  let sum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const s = scores[key];
    if (s == null || !Number.isFinite(s)) continue;
    sum += s * weight;
    totalWeight += weight;
  }
  if (totalWeight === 0) return null;
  return sum / totalWeight;
}
