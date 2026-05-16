import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { fetchQuotes } from "@/lib/finnhub";
import { cn } from "@/lib/utils";
import type { Holding } from "@/hooks/use-portfolio";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (h: Holding) => void;
  initial?: Holding | null;
};

type Match = { sym: string; name: string };

function searchUniverse(q: string): Match[] {
  const s = q.trim().toUpperCase();
  if (!s) return [];
  const starts: Match[] = [];
  const contains: Match[] = [];
  for (const r of STOCK_UNIVERSE) {
    const sym = r.sym.toUpperCase();
    const name = r.name.toUpperCase();
    if (sym === s) return [{ sym: r.sym, name: r.name }];
    if (sym.startsWith(s) || name.startsWith(s)) starts.push({ sym: r.sym, name: r.name });
    else if (sym.includes(s) || name.includes(s)) contains.push({ sym: r.sym, name: r.name });
    if (starts.length >= 8) break;
  }
  return [...starts, ...contains].slice(0, 8);
}

export function AddHoldingDialog({ open, onOpenChange, onSubmit, initial }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Match | null>(null);
  const [showList, setShowList] = useState(false);
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [priceMode, setPriceMode] = useState<"current" | "custom">("current");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const match = STOCK_UNIVERSE.find((r) => r.sym === initial.sym);
      setSelected({ sym: initial.sym, name: match?.name ?? initial.sym });
      setQuery(`${initial.sym} — ${match?.name ?? initial.sym}`);
      setShares(String(initial.shares));
      setAvgCost(String(initial.avgCost));
      setPriceMode("custom");
    } else {
      setSelected(null);
      setQuery("");
      setShares("");
      setAvgCost("");
      setPriceMode("current");
    }
    setCurrentPrice(null);
    setShowList(false);
    setErr(null);
  }, [open, initial]);

  // Fetch live price whenever selected ticker changes
  useEffect(() => {
    if (!selected) {
      setCurrentPrice(null);
      return;
    }
    const id = ++reqId.current;
    setPriceLoading(true);
    fetchQuotes([selected.sym])
      .then((q) => {
        if (id !== reqId.current) return;
        const p = q[selected.sym]?.c ?? null;
        setCurrentPrice(p && p > 0 ? p : null);
        if (priceMode === "current" && p && p > 0) setAvgCost(p.toFixed(2));
      })
      .finally(() => {
        if (id === reqId.current) setPriceLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // When toggling to "current", sync avgCost to current price
  useEffect(() => {
    if (priceMode === "current" && currentPrice) setAvgCost(currentPrice.toFixed(2));
  }, [priceMode, currentPrice]);

  const matches = useMemo(() => (selected ? [] : searchUniverse(query)), [query, selected]);

  const pickMatch = (m: Match) => {
    setSelected(m);
    setQuery(`${m.sym} — ${m.name}`);
    setShowList(false);
    setErr(null);
  };

  const onQueryChange = (v: string) => {
    setQuery(v);
    if (selected) setSelected(null);
    setShowList(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = (selected?.sym ?? query.trim().toUpperCase()).toUpperCase();
    const sh = Number(shares);
    const ac = Number(avgCost);
    if (!sym || !/^[A-Z.\-]{1,10}$/.test(sym)) return setErr("Pick a valid ticker from the list");
    if (!Number.isFinite(sh) || sh <= 0) return setErr("Shares must be > 0");
    if (!Number.isFinite(ac) || ac <= 0) return setErr("Buy price must be > 0");
    onSubmit({ sym, shares: sh, avgCost: ac });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit holding" : "Add holding"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticker search */}
          <div className="space-y-2">
            <Label htmlFor="sym">Stock</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="sym"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={() => !selected && setShowList(true)}
                placeholder="Search by ticker or company (e.g. AAPL, Apple)"
                disabled={!!initial}
                autoComplete="off"
                className="pl-8"
                autoFocus={!initial}
              />
              {showList && matches.length > 0 ? (
                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border/60 bg-popover p-1 shadow-lg">
                  {matches.map((m) => (
                    <button
                      type="button"
                      key={m.sym}
                      onClick={() => pickMatch(m)}
                      className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-secondary/60"
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{m.sym}</span>
                        <span className="ml-2 text-muted-foreground">{m.name}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {selected ? (
              <p className="text-xs text-muted-foreground">
                Current market price:{" "}
                {priceLoading ? (
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                ) : currentPrice ? (
                  <span className="font-medium text-foreground">${currentPrice.toFixed(2)}</span>
                ) : (
                  <span>unavailable</span>
                )}
              </p>
            ) : null}
          </div>

          {/* Shares */}
          <div className="space-y-2">
            <Label htmlFor="shares">Shares</Label>
            <Input
              id="shares"
              type="number"
              step="any"
              min="0"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="10"
            />
          </div>

          {/* Buy price mode */}
          <div className="space-y-2">
            <Label>Buy price</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriceMode("current")}
                disabled={!currentPrice}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition",
                  priceMode === "current"
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 hover:border-primary/30",
                  !currentPrice && "opacity-50",
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Use current price</span>
                  {priceMode === "current" && currentPrice ? <Check className="h-3 w-3 text-accent" /> : null}
                </div>
                <div className="mt-0.5 font-medium tabular-nums">
                  {currentPrice ? `$${currentPrice.toFixed(2)}` : "—"}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPriceMode("custom")}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition",
                  priceMode === "custom"
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 hover:border-primary/30",
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Custom price</span>
                  {priceMode === "custom" ? <Check className="h-3 w-3 text-accent" /> : null}
                </div>
                <div className="mt-0.5 font-medium tabular-nums">Enter your own</div>
              </button>
            </div>
            <Input
              type="number"
              step="any"
              min="0"
              value={avgCost}
              onChange={(e) => {
                setAvgCost(e.target.value);
                setPriceMode("custom");
              }}
              placeholder="150.00"
            />
            <p className="text-xs text-muted-foreground">
              P/L is calculated against the live market price.
            </p>
          </div>

          {err ? <p className="text-sm text-destructive">{err}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              {initial ? "Save" : "Add holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
