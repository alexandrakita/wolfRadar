"use client";

import { useEffect } from "react";

import { fetchScreenerStatus, fetchWolfPicks } from "@/services/api";
import {
  invalidateIfSnapshotChanged,
  setCachedPicks,
  setScreenerMeta,
} from "@/services/screener-idb";

/**
 * Sync screener snapshot meta + Wolf Picks into IndexedDB.
 * Re-fetches when the official snapshot date changes on the server.
 */
export function useScreenerSync(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    (async () => {
      try {
        const status = await fetchScreenerStatus();
        if (cancelled) return;

        const snapshotDate =
          typeof status.snapshotDate === "string" ? status.snapshotDate : null;

        await invalidateIfSnapshotChanged(snapshotDate);
        await setScreenerMeta({
          snapshotDate,
          rowCount: Number(status.rowCount) || 0,
          picksCount: Number(status.picksCount) || 0,
        });

        if (!snapshotDate || !status.ready) return;

        const picks = await fetchWolfPicks(70);
        if (cancelled) return;

        const date =
          typeof picks.ratingDate === "string" ? picks.ratingDate : snapshotDate;
        await setCachedPicks(date, 70, picks.ratings ?? {});
        await setScreenerMeta({
          snapshotDate: date,
          picksCount: Object.keys(picks.ratings ?? {}).length,
        });
      } catch {
        // offline / backend down — keep existing IDB cache
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);
}
