"use client";

import { useCallback, useEffect, useState } from "react";

import { localStorageService, STORAGE_KEYS, SYNC_EVENTS } from "@/services/localStorage";

export function useWatchlist() {
  const [list, setList] = useState([]);

  useEffect(() => {
    setList(localStorageService.getWatchlist());

    const sync = () => setList(localStorageService.getWatchlist());

    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.WATCHLIST) sync();
    };

    window.addEventListener(SYNC_EVENTS.WATCHLIST, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENTS.WATCHLIST, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const has = useCallback((sym) => list.includes(sym.toUpperCase()), [list]);

  const toggle = useCallback((sym) => {
    localStorageService.toggleWatchSymbol(sym);
  }, []);

  const remove = useCallback((sym) => {
    localStorageService.removeWatchSymbol(sym);
  }, []);

  const add = useCallback((sym) => {
    localStorageService.addWatchSymbol(sym);
  }, []);

  return {
    list,
    has,
    toggle,
    add,
    remove,
  };
}
