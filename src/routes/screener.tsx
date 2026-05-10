import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/use-quotes";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/screener")({
  head: () => ({
    meta: [
      { title: "Screener — Stockpillar" },
      {
        name: "description",
        content:
          "Stocks and ETFs screener with deep filters: price, market cap, P/E, sector, dividend yield, and more.",
      },
    ],
  }),
  component: ScreenerPage,
});

// ---------- Filter option presets (sourced from TradingView screener) ----------
const COUNTRIES = ["US", "Canada", "UK", "Germany", "France", "Japan", "China", "India", "Brazil", "Australia"];
const INDEXES = ["Any", "S&P 500", "Nasdaq 100", "Dow 30", "Russell 1000", "Russell 2000", "S&P MidCap 400"];
const SECTORS = [
  "Any", "Technology Services", "Electronic Technology", "Finance", "Health Technology",
  "Retail Trade", "Energy Minerals", "Consumer Services", "Producer Manufacturing",
  "Consumer Non-Durables", "Utilities", "Communications", "Process Industries",
  "Transportation", "Industrial Services", "Commercial Services", "Health Services",
  "Non-Energy Minerals", "Distribution Services", "Miscellaneous",
];
const ANALYST_RATINGS = ["Any", "Strong Buy", "Buy", "Hold", "Sell", "Strong Sell"];
const RANGES = ["Any", "Below average", "Average", "Above average", "High"];
const DATE_RANGES = ["Any", "Today", "Tomorrow", "This week", "Next week", "This month", "Next month"];

// ETF-specific
const ASSET_CLASSES = ["Any", "Equity", "Fixed Income", "Commodity", "Currency", "Multi-Asset", "Alternatives"];
const ETF_CATEGORIES = [
  "Any", "Large Cap", "Mid Cap", "Small Cap", "Sector", "International",
  "Bond", "Commodity", "Inverse", "Leveraged", "Thematic",
];
const BRANDS = ["Any", "iShares", "Vanguard", "SPDR", "Invesco", "Schwab", "ProShares", "First Trust", "WisdomTree"];
const STRUCTURES = ["Any", "ETF", "ETN", "ETC", "Open-ended fund"];

// ---------- Mock rows ----------
type StockRow = {
  sym: string; name: string; price: number; chg: number; vol: string; relVol: number;
  mktCap: string; pe: number; eps: number; epsGrowth: number;
};
const STOCKS: StockRow[] = [
  { sym: "NVDA", name: "NVIDIA Corporation", price: 215.20, chg: 1.75, vol: "136.42M", relVol: 0.82, mktCap: "5.23T", pe: 43.90, eps: 4.90, epsGrowth: 66.75 },
  { sym: "GOOG", name: "Alphabet Inc.",      price: 397.05, chg: 0.44, vol: "13.76M",  relVol: 0.62, mktCap: "4.84T", pe: 30.29, eps: 13.11, epsGrowth: 46.19 },
  { sym: "AAPL", name: "Apple Inc.",         price: 293.32, chg: 2.05, vol: "52.69M",  relVol: 1.01, mktCap: "4.31T", pe: 35.48, eps: 8.27,  epsGrowth: 29.00 },
  { sym: "MSFT", name: "Microsoft Corporation", price: 415.12, chg: -1.34, vol: "33.38M", relVol: 0.96, mktCap: "3.08T", pe: 24.72, eps: 16.79, epsGrowth: 29.75 },
  { sym: "AMZN", name: "Amazon.com, Inc.",   price: 272.68, chg: 0.56, vol: "34.73M",  relVol: 0.65, mktCap: "2.93T", pe: 32.59, eps: 8.37,  epsGrowth: 36.48 },
  { sym: "AVGO", name: "Broadcom Inc.",      price: 430.00, chg: 4.23, vol: "22.56M",  relVol: 1.16, mktCap: "2.04T", pe: 83.88, eps: 5.13,  epsGrowth: 147.26 },
  { sym: "TSLA", name: "Tesla, Inc.",        price: 428.35, chg: 4.02, vol: "65.05M",  relVol: 1.17, mktCap: "1.61T", pe: 391.33, eps: 1.09, epsGrowth: -39.80 },
  { sym: "META", name: "Meta Platforms, Inc.", price: 609.63, chg: -1.16, vol: "13.56M", relVol: 0.69, mktCap: "1.55T", pe: 22.16, eps: 27.51, epsGrowth: 7.29 },
  { sym: "WMT",  name: "Walmart Inc.",       price: 130.43, chg: 0.18, vol: "15.18M",  relVol: 1.02, mktCap: "1.04T", pe: 47.78, eps: 2.73,  epsGrowth: 13.38 },
];

type EtfRow = {
  sym: string; name: string; price: number; chg: number; aum: string; expense: number; yld: number; brand: string;
};
const ETFS: EtfRow[] = [
  { sym: "SPY",  name: "SPDR S&P 500 ETF Trust",        price: 568.12, chg: 0.42, aum: "612.4B", expense: 0.0945, yld: 1.24, brand: "SPDR" },
  { sym: "IVV",  name: "iShares Core S&P 500 ETF",      price: 569.10, chg: 0.41, aum: "528.1B", expense: 0.03,   yld: 1.27, brand: "iShares" },
  { sym: "VOO",  name: "Vanguard S&P 500 ETF",          price: 521.44, chg: 0.43, aum: "509.3B", expense: 0.03,   yld: 1.29, brand: "Vanguard" },
  { sym: "QQQ",  name: "Invesco QQQ Trust",             price: 498.77, chg: 0.92, aum: "302.6B", expense: 0.20,   yld: 0.55, brand: "Invesco" },
  { sym: "VTI",  name: "Vanguard Total Stock Market",   price: 287.05, chg: 0.39, aum: "445.8B", expense: 0.03,   yld: 1.31, brand: "Vanguard" },
  { sym: "IWM",  name: "iShares Russell 2000 ETF",      price: 232.18, chg: -0.51, aum: "63.2B", expense: 0.19,   yld: 1.10, brand: "iShares" },
  { sym: "AGG",  name: "iShares Core US Aggregate Bond", price: 98.42, chg: 0.08, aum: "118.5B", expense: 0.03,   yld: 4.02, brand: "iShares" },
  { sym: "GLD",  name: "SPDR Gold Shares",              price: 254.30, chg: 0.61, aum: "82.7B",  expense: 0.40,   yld: 0.00, brand: "SPDR" },
];

// ---------- Reusable filter UI ----------
function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

type FilterValue = string | { min?: string; max?: string };
type FilterState = Record<string, FilterValue>;

function SelectFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v === "__any" ? "" : v)}>
      <SelectTrigger className="h-9 bg-background/40">
        <SelectValue placeholder={placeholder ?? "Any"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__any">Any</SelectItem>
        {options.filter((o) => o !== "Any").map((o) => (
          <SelectItem key={o} value={o}>{o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RangeFilter({
  value,
  onChange,
}: {
  value?: { min?: string; max?: string };
  onChange: (v: { min?: string; max?: string }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-9 bg-background/40"
        placeholder="Min"
        value={value?.min ?? ""}
        onChange={(e) => onChange({ ...value, min: e.target.value })}
      />
      <span className="text-xs text-muted-foreground">—</span>
      <Input
        className="h-9 bg-background/40"
        placeholder="Max"
        value={value?.max ?? ""}
        onChange={(e) => onChange({ ...value, max: e.target.value })}
      />
    </div>
  );
}

function formatChip(label: string, v: FilterValue): string | null {
  if (typeof v === "string") return v ? `${label}: ${v}` : null;
  const min = v.min?.trim();
  const max = v.max?.trim();
  if (!min && !max) return null;
  if (min && max) return `${label}: ${min}–${max}`;
  if (min) return `${label} ≥ ${min}`;
  return `${label} ≤ ${max}`;
}

const STOCK_FILTERS: { key: string; label: string; type: "select" | "range"; options?: string[]; placeholder?: string }[] = [
  { key: "country", label: "Country", type: "select", options: COUNTRIES, placeholder: "Any" },
  { key: "watchlist", label: "Watchlist", type: "select", options: ["Any", "My watchlist", "Favorites", "Holdings"] },
  { key: "index", label: "Index", type: "select", options: INDEXES },
  { key: "price", label: "Price", type: "range" },
  { key: "chg", label: "Chg %", type: "range" },
  { key: "mktCap", label: "Mkt cap", type: "range" },
  { key: "pe", label: "P/E", type: "range" },
  { key: "epsGrowth", label: "EPS dil growth %", type: "range" },
  { key: "divYield", label: "Div yield %", type: "range" },
  { key: "sector", label: "Sector", type: "select", options: SECTORS },
  { key: "rating", label: "Analyst rating", type: "select", options: ANALYST_RATINGS },
  { key: "perf", label: "Perf %", type: "range" },
  { key: "revGrowth", label: "Revenue growth %", type: "range" },
  { key: "peg", label: "PEG", type: "range" },
  { key: "roe", label: "ROE %", type: "range" },
  { key: "beta", label: "Beta", type: "range" },
  { key: "earningsRecent", label: "Recent earnings date", type: "select", options: DATE_RANGES },
  { key: "earningsUpcoming", label: "Upcoming earnings date", type: "select", options: DATE_RANGES },
];

const ETF_FILTERS: { key: string; label: string; type: "select" | "range"; options?: string[] }[] = [
  { key: "country", label: "Country", type: "select", options: COUNTRIES },
  { key: "assetClass", label: "Asset class", type: "select", options: ASSET_CLASSES },
  { key: "category", label: "Category", type: "select", options: ETF_CATEGORIES },
  { key: "brand", label: "Brand / Issuer", type: "select", options: BRANDS },
  { key: "structure", label: "Structure", type: "select", options: STRUCTURES },
  { key: "price", label: "Price", type: "range" },
  { key: "chg", label: "Chg %", type: "range" },
  { key: "aum", label: "AUM", type: "range" },
  { key: "expense", label: "Expense ratio %", type: "range" },
  { key: "divYield", label: "Div yield %", type: "range" },
  { key: "volume", label: "Volume", type: "range" },
  { key: "navReturn", label: "NAV total return 1Y %", type: "range" },
  { key: "beta", label: "Beta (1Y)", type: "range" },
  { key: "liquidity", label: "Liquidity", type: "select", options: RANGES },
  { key: "inception", label: "Inception date", type: "select", options: ["Any", "< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"] },
];

// ---------- Page ----------
function ScreenerPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState("stocks");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Draft = inside dialog. Applied = chips + table filtering.
  const [draftStock, setDraftStock] = useState<FilterState>({});
  const [appliedStock, setAppliedStock] = useState<FilterState>({});
  const [draftEtf, setDraftEtf] = useState<FilterState>({});
  const [appliedEtf, setAppliedEtf] = useState<FilterState>({});

  const isStocks = tab === "stocks";
  const draft = isStocks ? draftStock : draftEtf;
  const setDraft = isStocks ? setDraftStock : setDraftEtf;
  const applied = isStocks ? appliedStock : appliedEtf;
  const setApplied = isStocks ? setAppliedStock : setAppliedEtf;
  const fields = isStocks ? STOCK_FILTERS : ETF_FILTERS;

  const stockSymbols = useMemo(() => STOCKS.map((s) => s.sym), []);
  const etfSymbols = useMemo(() => ETFS.map((e) => e.sym), []);
  const { quotes: stockQuotes } = useQuotes(stockSymbols);
  const { quotes: etfQuotes } = useQuotes(etfSymbols);

  const chips = useMemo(() => {
    const labelOf = (k: string) => fields.find((f) => f.key === k)?.label ?? k;
    return Object.entries(applied)
      .map(([k, v]) => ({ key: k, text: formatChip(labelOf(k), v) }))
      .filter((c): c is { key: string; text: string } => !!c.text);
  }, [applied, fields]);

  const removeChip = (key: string) => {
    setApplied((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDraft((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const inRange = (n: number | undefined, r?: { min?: string; max?: string }) => {
    if (!r || n === undefined || Number.isNaN(n)) return true;
    const min = r.min ? Number(r.min) : undefined;
    const max = r.max ? Number(r.max) : undefined;
    if (min !== undefined && !Number.isNaN(min) && n < min) return false;
    if (max !== undefined && !Number.isNaN(max) && n > max) return false;
    return true;
  };

  // Live row composition
  const stockRows = STOCKS.map((s) => {
    const q = stockQuotes[s.sym];
    return {
      ...s,
      price: q?.c ?? s.price,
      chg: q?.dp ?? s.chg,
    };
  }).filter((s) => {
    const f = appliedStock;
    if (!inRange(s.price, f.price as { min?: string; max?: string })) return false;
    if (!inRange(s.chg, f.chg as { min?: string; max?: string })) return false;
    if (!inRange(s.pe, f.pe as { min?: string; max?: string })) return false;
    if (!inRange(s.epsGrowth, f.epsGrowth as { min?: string; max?: string })) return false;
    if (typeof f.sector === "string" && f.sector) {
      // demo: no sector on row, skip filter
    }
    return true;
  });

  const etfRows = ETFS.map((e) => {
    const q = etfQuotes[e.sym];
    return {
      ...e,
      price: q?.c ?? e.price,
      chg: q?.dp ?? e.chg,
    };
  }).filter((e) => {
    const f = appliedEtf;
    if (!inRange(e.price, f.price as { min?: string; max?: string })) return false;
    if (!inRange(e.chg, f.chg as { min?: string; max?: string })) return false;
    if (!inRange(e.expense, f.expense as { min?: string; max?: string })) return false;
    if (!inRange(e.yld, f.divYield as { min?: string; max?: string })) return false;
    if (typeof f.brand === "string" && f.brand && e.brand !== f.brand) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMobileMenu={() => setCollapsed((c) => !c)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Stock Screener</h1>
              <p className="mt-2 text-muted-foreground">
                Filter the market by fundamentals, performance, and technicals. Live prices via Finnhub.
              </p>
            </div>
            <Dialog
              open={filtersOpen}
              onOpenChange={(o) => {
                setFiltersOpen(o);
                if (o) setDraft(applied); // start dialog from currently applied
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="gap-2 text-primary-foreground"
                  style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-h-[85vh] max-w-3xl overflow-y-auto border-border/60"
                style={{ background: "var(--gradient-card)" }}
              >
                <DialogHeader>
                  <DialogTitle>{isStocks ? "Stock filters" : "ETF filters"}</DialogTitle>
                  <DialogDescription>Narrow the universe. Empty fields mean "any".</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2 md:grid-cols-3">
                  {fields.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{f.label}</Label>
                      {f.type === "select" ? (
                        <SelectFilter
                          value={(draft[f.key] as string) ?? ""}
                          onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                          options={f.options ?? []}
                          placeholder={(f as { placeholder?: string }).placeholder}
                        />
                      ) : (
                        <RangeFilter
                          value={draft[f.key] as { min?: string; max?: string } | undefined}
                          onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setDraft({})}>Reset</Button>
                  <Button
                    className="text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                    onClick={() => {
                      setApplied(draft);
                      setFiltersOpen(false);
                    }}
                  >
                    Apply filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Badge
                  key={c.key}
                  variant="secondary"
                  className="gap-1 rounded-full bg-secondary/60 px-3 py-1 text-xs"
                >
                  {c.text}
                  <button
                    type="button"
                    onClick={() => removeChip(c.key)}
                    className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${c.text}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                type="button"
                onClick={() => setApplied({})}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-secondary/60">
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
              <TabsTrigger value="etfs">ETFs</TabsTrigger>
            </TabsList>

            <TabsContent value="stocks" className="mt-4">
              <div
                className="overflow-hidden rounded-2xl border border-border/60"
                style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        {["Symbol", "Price", "Chg %", "Vol", "Rel Vol", "Mkt Cap", "P/E", "EPS dil TTM", "EPS dil growth YoY"].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                            <span className="inline-flex items-center gap-1">
                              {h}
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {stockRows.map((s) => {
                        const up = s.chg >= 0;
                        const epsUp = s.epsGrowth >= 0;
                        return (
                          <tr key={s.sym} className="transition hover:bg-secondary/30">
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground"
                                  style={{ background: "var(--gradient-primary)" }}
                                >
                                  {s.sym.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-medium">{s.sym}</div>
                                  <div className="text-xs text-muted-foreground">{s.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 tabular-nums">{s.price.toFixed(2)} <span className="text-xs text-muted-foreground">USD</span></td>
                            <td className={`px-4 py-3 tabular-nums ${up ? "text-accent" : "text-destructive"}`}>{up ? "+" : ""}{s.chg.toFixed(2)}%</td>
                            <td className="px-4 py-3 tabular-nums text-muted-foreground">{s.vol}</td>
                            <td className="px-4 py-3 tabular-nums text-muted-foreground">{s.relVol.toFixed(2)}</td>
                            <td className="px-4 py-3 tabular-nums">{s.mktCap}</td>
                            <td className="px-4 py-3 tabular-nums">{s.pe.toFixed(2)}</td>
                            <td className="px-4 py-3 tabular-nums">{s.eps.toFixed(2)}</td>
                            <td className={`px-4 py-3 tabular-nums ${epsUp ? "text-accent" : "text-destructive"}`}>{epsUp ? "+" : ""}{s.epsGrowth.toFixed(2)}%</td>
                          </tr>
                        );
                      })}
                      {stockRows.length === 0 && (
                        <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">No stocks match the current filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="etfs" className="mt-4">
              <div
                className="overflow-hidden rounded-2xl border border-border/60"
                style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        {["Symbol", "Price", "Chg %", "AUM", "Expense %", "Div Yield %", "Brand"].map((h) => (
                          <th key={h} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                            <span className="inline-flex items-center gap-1">
                              {h}
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {etfRows.map((e) => {
                        const up = e.chg >= 0;
                        return (
                          <tr key={e.sym} className="transition hover:bg-secondary/30">
                            <td className="whitespace-nowrap px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground"
                                  style={{ background: "var(--gradient-primary)" }}
                                >
                                  {e.sym.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-medium">{e.sym}</div>
                                  <div className="text-xs text-muted-foreground">{e.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 tabular-nums">{e.price.toFixed(2)} <span className="text-xs text-muted-foreground">USD</span></td>
                            <td className={`px-4 py-3 tabular-nums ${up ? "text-accent" : "text-destructive"}`}>{up ? "+" : ""}{e.chg.toFixed(2)}%</td>
                            <td className="px-4 py-3 tabular-nums">{e.aum}</td>
                            <td className="px-4 py-3 tabular-nums">{e.expense.toFixed(2)}%</td>
                            <td className="px-4 py-3 tabular-nums">{e.yld.toFixed(2)}%</td>
                            <td className="px-4 py-3 text-muted-foreground">{e.brand}</td>
                          </tr>
                        );
                      })}
                      {etfRows.length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No ETFs match the current filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

