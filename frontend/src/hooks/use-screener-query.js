"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchScreenerQuery } from "@/services/api";
import {
  buildScreenerQueryKey,
  getCachedQuery,
  getScreenerMeta,
  setCachedQuery,
  setScreenerMeta,
} from "@/services/screener-idb";

/**
 * Server-side screener query with IndexedDB read-through cache.
 * Shows cached results instantly; refreshes when snapshot date changes.
 */
export function useScreenerQuery(params, enabled = true) {
  const {
    filters = {},
    quickFilters = [],
    q = "",
    sortField = null,
    sortOrder = null,
    page = 1,
    pageSize = 50,
  } = params ?? {};

  const cacheKey = buildScreenerQueryKey(params);
  const [placeholder, setPlaceholder] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setPlaceholder(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const meta = await getScreenerMeta();
      const cached = await getCachedQuery(cacheKey);
      if (cancelled) return;
      if (
        cached?.payload &&
        meta?.snapshotDate &&
        cached.snapshotDate === meta.snapshotDate
      ) {
        setPlaceholder(cached.payload);
      } else {
        setPlaceholder(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, cacheKey]);

  const query = useQuery({
    queryKey: [
      "screener-query",
      cacheKey,
    ],
    queryFn: async () => {
      const result = await fetchScreenerQuery({
        filters,
        quickFilters,
        q,
        sort: { field: sortField, order: sortOrder },
        page,
        pageSize,
      });

      const snapshotDate =
        typeof result.snapshotDate === "string" ? result.snapshotDate : null;
      if (snapshotDate && result.ready) {
        await setCachedQuery(cacheKey, snapshotDate, result);
        await setScreenerMeta({
          snapshotDate,
          rowCount: Number(result.totalInStore) || 0,
        });
      }

      return result;
    },
    enabled,
    staleTime: 60_000,
    placeholderData: placeholder ?? undefined,
  });

  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? "Screener query failed"
        : null;

  const data = query.data ?? placeholder;

  return {
    data: data ?? null,
    rows: data?.rows ?? [],
    total: data?.total ?? 0,
    totalInStore: data?.totalInStore ?? 0,
    snapshotDate: data?.snapshotDate ?? null,
    requestedDate: data?.requestedDate ?? null,
    usedFallback: data?.usedFallback ?? false,
    ready: data?.ready ?? false,
    message: data?.message ?? null,
    loading: enabled && query.isPending && !placeholder,
    fetching: enabled && query.isFetching,
    fromCache: !query.data && !!placeholder,
    error: query.isError ? errorMessage : null,
  };
}
