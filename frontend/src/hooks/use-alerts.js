"use client";

import { useCallback, useEffect, useState } from "react";

import { localStorageService, STORAGE_KEYS, SYNC_EVENTS } from "@/services/localStorage";

const SEED_ALERTS = [
  {
    id: "a1",
    type: "earnings",
    sym: "AAPL",
    label: "AAPL earnings in 2 days",
    active: true,
  },
  {
    id: "a2",
    type: "price",
    sym: "NVDA",
    label: "NVDA above $950",
    active: true,
  },
  {
    id: "a3",
    type: "watchlist",
    sym: "PLTR",
    label: "PLTR watchlist alert",
    active: true,
  },
];

function readAlerts() {
  const rows = localStorageService.getAlerts();
  if (rows.length) return rows;
  return SEED_ALERTS;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAlerts(readAlerts());
    setReady(true);

    const sync = () => setAlerts(readAlerts());
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.ALERTS) sync();
    };
    window.addEventListener(SYNC_EVENTS.ALERTS, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENTS.ALERTS, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const persist = useCallback((rows) => {
    localStorageService.setAlerts(rows);
    setAlerts(rows);
  }, []);

  const toggle = useCallback(
    (id) => {
      persist(
        alerts.map((a) =>
          a.id === id ? { ...a, active: a.active === false } : a,
        ),
      );
    },
    [alerts, persist],
  );

  return { alerts, toggle, ready };
}

export function getActiveAlerts() {
  return readAlerts().filter((a) => a.active !== false);
}
