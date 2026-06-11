"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { STOCK_UNIVERSE } from "@/data/stock-universe";
import { cn } from "@/lib/utils";

export function TickerSearchBar({
  value,
  onSelect,
  placeholder = "Search ticker or company…",
  className,
}) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    setQuery(value ?? "");
  }, [value]);

  const results = useMemo(() => {
    const s = query.trim().toUpperCase();
    if (!s) return [];
    return STOCK_UNIVERSE.filter(
      (r) => r.sym.includes(s) || r.name.toUpperCase().includes(s),
    ).slice(0, 8);
  }, [query]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (sym) => {
    const next = sym.toUpperCase();
    setQuery(next);
    setOpen(false);
    onSelect?.(next);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[highlight];
      if (target) pick(target.sym);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        className="h-9 rounded-lg border-border/60 bg-secondary/40 pl-9 text-sm"
      />
      {open && results.length > 0 ? (
        <div className="absolute left-0 right-0 top-10 z-30 overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-xl">
          {results.map((r, i) => (
            <button
              key={r.sym}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(r.sym);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition",
                i === highlight ? "bg-secondary/70" : "hover:bg-secondary/50",
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold">
                  {r.sym}
                </span>
                <span className="truncate text-muted-foreground">{r.name}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.sector}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
