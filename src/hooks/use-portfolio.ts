import { useCallback, useEffect, useState } from "react";

const KEY = "wolfradar:portfolio";
const EVT = "wolfradar:portfolio-change";

export type Holding = { sym: string; shares: number; avgCost: number; purchaseDate?: string };

function read(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((h) => h && typeof h.sym === "string" && typeof h.shares === "number" && typeof h.avgCost === "number")
      .map((h) => ({
        sym: h.sym.toUpperCase(),
        shares: h.shares,
        avgCost: h.avgCost,
        purchaseDate: typeof h.purchaseDate === "string" ? h.purchaseDate : undefined,
      }));
  } catch {
    return [];
  }
}

function write(list: Holding[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

export function usePortfolio() {
  const [list, setList] = useState<Holding[]>([]);

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

  const upsert = useCallback((h: Holding) => {
    const sym = h.sym.toUpperCase();
    const cur = read();
    const idx = cur.findIndex((x) => x.sym === sym);
    if (idx >= 0) cur[idx] = { ...h, sym };
    else cur.push({ ...h, sym });
    write(cur);
  }, []);

  const remove = useCallback((sym: string) => {
    const s = sym.toUpperCase();
    write(read().filter((x) => x.sym !== s));
  }, []);

  return { list, upsert, remove };
}
