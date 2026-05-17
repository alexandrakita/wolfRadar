import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, Loader2, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { fetchQuotes } from "@/lib/finnhub";
import { getYahooHistoricalPrice } from "@/lib/yahoo.functions";
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

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function isToday(d: Date) {
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

export function AddHoldingDialog({ open, onOpenChange, onSubmit, initial }: Props) {
  const fetchHistorical = useServerFn(getYahooHistoricalPrice);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Match | null>(null);
  const [showList, setShowList] = useState(false);
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [priceMode, setPriceMode] = useState<"date" | "custom">("date");
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePrice, setDatePrice] = useState<number | null>(null);
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
      setPurchaseDate(initial.purchaseDate ? new Date(`${initial.purchaseDate}T00:00:00`) : new Date());
      setPriceMode("custom");
    } else {
      setSelected(null);
      setQuery("");
      setShares("");
      setAvgCost("");
      setPurchaseDate(new Date());
      setPriceMode("date");
    }
    setDatePrice(null);
    setShowList(false);
    setErr(null);
  }, [open, initial]);

  // Fetch price for selected ticker + date (live quote if today, else historical)
  useEffect(() => {
    if (!selected) {
      setDatePrice(null);
      return;
    }
    const id = ++reqId.current;
    setPriceLoading(true);
    const sym = selected.sym;
    const promise = isToday(purchaseDate)
      ? fetchQuotes([sym]).then((q) => q[sym]?.c ?? null)
      : fetchHistorical({ data: { symbol: sym, date: toISO(purchaseDate) } }).then((r) => r.price ?? null);
    promise
      .then((p) => {
        if (id !== reqId.current) return;
        const v = p && p > 0 ? p : null;
        setDatePrice(v);
        if (priceMode === "date" && v) setAvgCost(v.toFixed(2));
      })
      .finally(() => {
        if (id === reqId.current) setPriceLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, purchaseDate]);

  useEffect(() => {
    if (priceMode === "date" && datePrice) setAvgCost(datePrice.toFixed(2));
  }, [priceMode, datePrice]);

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
    onSubmit({ sym, shares: sh, avgCost: ac, purchaseDate: toISO(purchaseDate) });
    onOpenChange(false);
  };

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(23, 59, 59, 999);
    return t;
  }, []);

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

          {/* Purchase date */}
          <div className="space-y-2">
            <Label>Purchase date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(purchaseDate, "PPP")}
                  {isToday(purchaseDate) ? (
                    <span className="ml-auto text-xs text-muted-foreground">Today</span>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={(d) => {
                    if (d) {
                      setPurchaseDate(d);
                      setDatePickerOpen(false);
                    }
                  }}
                  disabled={(d) => d > today || d < new Date("2000-01-01")}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Buy price mode */}
          <div className="space-y-2">
            <Label>Buy price</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPriceMode("date")}
                disabled={!datePrice && !priceLoading}
                className={cn(
                  "rounded-md border px-3 py-2 text-left text-sm transition",
                  priceMode === "date"
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 hover:border-primary/30",
                  !datePrice && !priceLoading && "opacity-50",
                )}
              >
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{isToday(purchaseDate) ? "Current price" : "Price on date"}</span>
                  {priceMode === "date" && datePrice ? <Check className="h-3 w-3 text-accent" /> : null}
                </div>
                <div className="mt-0.5 font-medium tabular-nums">
                  {priceLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : datePrice ? (
                    `$${datePrice.toFixed(2)}`
                  ) : selected ? (
                    "unavailable"
                  ) : (
                    "—"
                  )}
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
