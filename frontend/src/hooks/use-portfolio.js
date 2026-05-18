"use client";

import { useCallback, useEffect, useState } from "react";

import { localStorageService, STORAGE_KEYS, SYNC_EVENTS } from "@/services/localStorage";

export function usePortfolio() {
  const [list, setList] = useState([]);

  useEffect(() => {
    setList(localStorageService.getPortfolio());

    const sync = () => setList(localStorageService.getPortfolio());

    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.PORTFOLIO) sync();
    };

    window.addEventListener(SYNC_EVENTS.PORTFOLIO, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENTS.PORTFOLIO, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const upsert = useCallback((h) => {
    localStorageService.upsertPortfolioHolding(h);
  }, []);

  const remove = useCallback((sym) => {
    localStorageService.removePortfolioSymbol(sym);
  }, []);

  return {
    list,
    upsert,
    remove,
  };
}
