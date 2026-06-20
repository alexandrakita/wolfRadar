import YahooFinance from "yahoo-finance2";

/** Single shared client — avoids duplicate cookie/session churn. */
export const yahooFinance = new YahooFinance();

try {
  yahooFinance.suppressNotices?.(["yahooSurvey", "ripHistorical"]);
} catch {
  // ignore
}

const RETRYABLE = /fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|429|503/i;

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ attempts?: number, delayMs?: number }} [opts]
 * @returns {Promise<T>}
 */
export async function withYahooRetry(fn, opts = {}) {
  const attempts = opts.attempts ?? 3;
  const delayMs = opts.delayMs ?? 400;
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = /** @type {Error} */ (e).message ?? "";
      if (i >= attempts - 1 || !RETRYABLE.test(msg)) throw e;
      await new Promise((r) => {
        setTimeout(r, delayMs * (i + 1));
      });
    }
  }
  throw lastErr;
}
