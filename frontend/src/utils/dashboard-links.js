/** Navigation helpers for dashboard widget clicks. */

import { isMarketIndex } from "@/constants/market-indexes";

export function screenerIndexUrl(symbol) {
  const sym = String(symbol ?? "").trim().toUpperCase();
  if (!sym) return "/screener?tab=indexes";
  return `/screener?tab=indexes&index=${encodeURIComponent(sym)}`;
}

export function stockSymbolUrl(symbol) {
  const sym = String(symbol ?? "").trim().toUpperCase();
  if (!sym) return "/screener";
  return `/stock/${encodeURIComponent(sym)}`;
}

export function screenerSymbolUrl(symbol) {
  const sym = String(symbol ?? "").trim().toUpperCase();
  if (!sym) return "/screener";
  if (isMarketIndex(sym)) return screenerIndexUrl(sym);
  return `/screener?q=${encodeURIComponent(sym)}`;
}

export function screenerNewsUrl(symbol) {
  const sym = String(symbol ?? "").trim().toUpperCase();
  if (!sym) return "/screener";
  return `/stock/${encodeURIComponent(sym)}#news`;
}

export function wolfSignalsUrl(params = {}) {
  const qs = new URLSearchParams();
  if (params.symbol) qs.set("symbol", String(params.symbol).toUpperCase());
  if (params.event) qs.set("event", params.event);
  const tail = qs.toString();
  return tail ? `/wolf-signals?${tail}` : "/wolf-signals";
}

export function alertsUrl(params = {}) {
  const qs = new URLSearchParams();
  if (params.id) qs.set("id", params.id);
  const tail = qs.toString();
  return tail ? `/alerts?${tail}` : "/alerts";
}

export function portfolioUrl() {
  return "/portfolio";
}
