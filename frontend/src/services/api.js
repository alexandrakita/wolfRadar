export async function apiPost(pathSuffix, body) {
  const res = await fetch(`/api/market${pathSuffix}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  /** @type {unknown} */
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!res.ok) {
    let message = "";
    if (data && typeof data === "object" && typeof data.error === "string") {
      message = data.error;
    } else if (text.trim()) {
      message = text;
    } else {
      message = res.statusText;
    }
    throw new Error(message || `HTTP ${res.status}`);
  }

  return data ?? {};
}

export function fetchStockBundle(symbol) {
  return apiPost("/bundle", { symbol });
}

export function fetchWolfRating(symbol) {
  return fetch(`/api/ratings/${encodeURIComponent(symbol)}`).then(async (res) => {
    const text = await res.text();
    /** @type {unknown} */
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    if (!res.ok) {
      const message =
        data && typeof data === "object" && typeof data.error === "string"
          ? data.error
          : res.statusText;
      throw new Error(message || `HTTP ${res.status}`);
    }
    return data ?? {};
  });
}

export async function fetchWolfPicks(minScore = 70) {
  const res = await fetch(`/api/ratings/picks/list?min=${encodeURIComponent(minScore)}`);
  const text = await res.text();
  /** @type {{ ratings?: Record<string, object>, ratingDate?: string }} */
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : res.statusText;
    throw new Error(message || `HTTP ${res.status}`);
  }
  return data;
}

const RATING_CHUNK = 50;

/** @param {string[]} symbols @returns {Promise<Record<string, object | null>>} */
export async function fetchWolfRatingsBatch(symbols) {
  if (!symbols.length) return {};

  const merged = {};

  for (let i = 0; i < symbols.length; i += RATING_CHUNK) {
    const slice = symbols.slice(i, i + RATING_CHUNK);
    const res = await fetch("/api/ratings/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols: slice }),
    });
    const text = await res.text();
    /** @type {{ ratings?: Record<string, object | null> }} */
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
    if (!res.ok) {
      const message =
        typeof data === "object" && data && "error" in data && typeof data.error === "string"
          ? data.error
          : res.statusText;
      throw new Error(message || `HTTP ${res.status}`);
    }
    Object.assign(merged, data.ratings ?? {});
  }

  return merged;
}

export function fetchYahooChart(symbol, range) {
  return apiPost("/yahoo/chart", { symbol, range });
}

export function fetchYahooHistorical(symbol, date) {
  return apiPost("/yahoo/historical", { symbol, date });
}

export function fetchMarketMovers(mode, count = 12) {
  return apiPost("/movers", { mode, count });
}

export function fetchMarketNews(symbols, limit = 15) {
  return apiPost("/news", { symbols, limit });
}

export async function fetchScreenerStatus(date) {
  const qs = date ? `?date=${encodeURIComponent(date)}` : "";
  const res = await fetch(`/api/screener/status${qs}`);
  const text = await res.text();
  /** @type {Record<string, unknown>} */
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : res.statusText;
    throw new Error(message || `HTTP ${res.status}`);
  }
  return data;
}

export async function fetchScreenerQuery(body) {
  const res = await fetch("/api/screener/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  /** @type {Record<string, unknown>} */
  let data = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }
  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof data.error === "string"
        ? data.error
        : res.statusText;
    throw new Error(message || `HTTP ${res.status}`);
  }
  return data;
}
