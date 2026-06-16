"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchScreenerMetrics } from "@/services/finnhub";

function fingerprint(symbols) {
  return [...new Set((symbols ?? []).map((s) => String(s).toUpperCase()))]
    .filter(Boolean)
    .sort()
    .join(",");
}

/**
 * Screener metrics via TanStack Query — fundamentals + performance for badge/filter logic.
 */
export function useScreenerMetrics(symbols, refreshMs = 60_000) {
  const fp = fingerprint(symbols);
  const list = fp.split(",").filter(Boolean);

  const query = useQuery({
    queryKey: ["screener-metrics", fp],
    queryFn: () => fetchScreenerMetrics(list),
    enabled: list.length > 0,
    refetchInterval: refreshMs,
    staleTime: 30_000,
  });

  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? "Screener metrics request failed"
        : null;

  return {
    metrics: query.isError ? {} : { ...(query.data ?? {}) },
    loading: list.length > 0 && query.isPending,
    error: query.isError ? errorMessage : null,
  };
}
