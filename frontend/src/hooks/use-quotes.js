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
 * @param {string[]} symbols
 * @param {{ refreshMs?: number, enabled?: boolean } | number} [options] — number shorthand for refreshMs
 */
export function useQuotes(symbols, options) {
  const opts = typeof options === "number" ? { refreshMs: options } : (options ?? {});
  const refreshMs = opts.refreshMs ?? 30_000;
  const fp = fingerprint(symbols);
  const list = fp.split(",").filter(Boolean);
  const enabled = (opts.enabled ?? true) && list.length > 0;

  const query = useQuery({
    queryKey: ["quotes", fp],
    queryFn: () => fetchQuotes(list),
    enabled,
    refetchInterval: enabled ? refreshMs : false,
    refetchOnWindowFocus: false,
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
