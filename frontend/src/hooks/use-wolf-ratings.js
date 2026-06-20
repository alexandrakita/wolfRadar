"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchWolfPicks } from "@/services/api";
import { getCachedPicks, getScreenerMeta, setCachedPicks } from "@/services/screener-idb";

/** Official Wolf Picks — cached ratings with score >= min (default 70). */
export function useWolfPicks(minScore = 70, enabled = true) {
  const [placeholder, setPlaceholder] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setPlaceholder(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const meta = await getScreenerMeta();
      if (!meta?.snapshotDate) return;
      const cached = await getCachedPicks(meta.snapshotDate, minScore);
      if (cancelled || !cached?.ratings) return;
      setPlaceholder({
        ratings: cached.ratings,
        ratingDate: cached.snapshotDate,
        minScore: cached.minScore,
        source: "idb",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, minScore]);

  const query = useQuery({
    queryKey: ["wolf-picks", minScore],
    queryFn: async () => {
      const data = await fetchWolfPicks(minScore);
      const date = typeof data.ratingDate === "string" ? data.ratingDate : null;
      if (date && data.ratings) {
        await setCachedPicks(date, minScore, data.ratings);
      }
      return data;
    },
    enabled,
    staleTime: 60 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: placeholder ?? undefined,
  });

  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : query.error
        ? "Wolf Picks request failed"
        : null;

  const data = query.data ?? placeholder;

  return {
    ratings: data?.ratings ?? {},
    ratingDate: data?.ratingDate ?? null,
    loading: enabled && query.isPending && !placeholder,
    error: query.isError ? errorMessage : null,
  };
}
