import { useEffect, useState, useCallback } from "react";

const KEY = "wolfradar:watchlist";
const EVT = "wolfradar:watchlist-change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function useWatchlist() {
  const [list, setList] = useState<string[]>([]);

  useEffect(() => {
    setList(read());
    const sync = () => setList(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((sym: string) => list.includes(sym.toUpperCase()), [list]);

  const toggle = useCallback((sym: string) => {
    const s = sym.toUpperCase();
    const cur = read();
    const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
    write(next);
  }, []);

  const remove = useCallback((sym: string) => {
    const s = sym.toUpperCase();
    write(read().filter((x) => x !== s));
  }, []);

  const add = useCallback((sym: string) => {
    const s = sym.toUpperCase();
    const cur = read();
    if (!cur.includes(s)) write([...cur, s]);
  }, []);

  return { list, has, toggle, add, remove };
}
