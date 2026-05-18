"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchQuotes } from "@/services/finnhub";

/** Dedup + stable order fingerprint (avoid depending on symbols array identity). */
function fingerprint(symbols) {
  return [...new Set((symbols ?? []).map((s) => String(s).toUpperCase()))]
    .filter(Boolean)
    .sort()
    .join(",");
}

/**
 * Quotes via TanStack Query (`QueryProvider` in root layout). `refetchInterval` replaces old polling hook.
 */
export function useQuotes(symbols, refreshMs = 10_000) {
  const fp = fingerprint(symbols);
  const list = fp.split(",").filter(Boolean);

  const query = useQuery({
    queryKey: ["quotes", fp],
    queryFn: () => fetchQuotes(list),
    enabled: list.length > 0,
    refetchInterval: refreshMs,
  });

  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? "Quotes request failed"
        : null;

  return {
    quotes: query.isError ? {} : { ...(query.data ?? {}) },
    loading: list.length > 0 && query.isPending,
    error: query.isError ? errorMessage : null,
  };
}
