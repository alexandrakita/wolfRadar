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
