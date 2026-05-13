import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { cn } from "@/lib/utils";

export function DashboardHeader({ onMobileMenu }: { onMobileMenu: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toUpperCase();
    if (!s) return [];
    return STOCK_UNIVERSE.filter(
      (r) => r.sym.includes(s) || r.name.toUpperCase().includes(s),
    ).slice(0, 8);
  }, [q]);

  useEffect(() => { setHighlight(0); }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (sym: string) => {
    setOpen(false);
    setQ("");
    navigate({ to: "/stock/$symbol", params: { symbol: sym } });
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[highlight];
      if (target) go(target.sym);
      else if (q.trim()) go(q.trim().toUpperCase());
    } else if (e.key === "Escape") setOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div ref={wrapRef} className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder="Search ticker or company…"
            className="h-10 rounded-full border-border/60 bg-secondary/40 pl-10"
          />
          {open && results.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-border/60 bg-popover/95 shadow-xl backdrop-blur-xl">
              {results.map((r, i) => (
                <button
                  key={r.sym}
                  onMouseDown={(e) => { e.preventDefault(); go(r.sym); }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition",
                    i === highlight ? "bg-secondary/70" : "hover:bg-secondary/50",
                  )}
                >
                  <span className="flex items-center gap-3 overflow-hidden">
                    <span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs font-semibold">{r.sym}</span>
                    <span className="truncate text-muted-foreground">{r.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{r.sector}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
        </button>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
          aria-label="User"
        >
          AM
        </div>
      </div>
    </header>
  );
}
