"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { PageHeading } from "@/components/page-heading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/use-quotes";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { StockAvatar } from "@/components/stock-avatar";
import {
  buildScreenerSearchParams,
  DEFAULT_SCREENER_LIMIT,
  parseScreenerSearchParams,
  SCREENER_PAGE_LIMIT_OPTIONS,
} from "@/utils/screener-search-params";
import {
  MAX_STOCKS_FOR_MARKET_FILTER,
  QUOTE_BUFFER,
  STOCKS,
  ETFS,
  STOCK_FILTERS,
  ETF_FILTERS,
} from "@/constants/screener-ui";
import {
  compareStockRows,
  compareEtfRows,
  enrichStockRow,
  fmtMoneyLike,
  fmtVolLike,
  formatChip,
  numericRangeMatches,
  passesStockMarketFilters,
} from "@/utils/screener-table";
import {
  FilterField,
  RangeFilter,
  SelectFilter,
  SortIndicator,
} from "./filter-widgets";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const isUpdatingUrl = useRef(false);

  const [tab, setTab] = useState("stocks");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [draftStock, setDraftStock] = useState({});
  const [appliedStock, setAppliedStock] = useState({});
  const [draftEtf, setDraftEtf] = useState({});
  const [appliedEtf, setAppliedEtf] = useState({});

  const [quickSearch, setQuickSearch] = useState("");
  const [searchForUrl, setSearchForUrl] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_SCREENER_LIMIT);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState(null);

  const urlStateRef = useRef({
    tab,
    searchForUrl,
    page,
    pageSize,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
  });
  urlStateRef.current = {
    tab,
    searchForUrl,
    page,
    pageSize,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
  };

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    if (isUpdatingUrl.current) return;
    const parsed = parseScreenerSearchParams(searchParamsRef.current);
    setTab(parsed.tab);
    setQuickSearch(parsed.q);
    setSearchForUrl(parsed.q);
    setPage(parsed.page);
    setPageSize(parsed.limit);
    setSortField(parsed.sortField);
    setSortOrder(parsed.sortOrder);
    setAppliedStock(parsed.appliedStock);
    setAppliedEtf(parsed.appliedEtf);
    setDraftStock(parsed.appliedStock);
    setDraftEtf(parsed.appliedEtf);
  }, [searchParamsKey]);

  useEffect(() => {
    const handle = setTimeout(() => setSearchForUrl(quickSearch), 280);
    return () => clearTimeout(handle);
  }, [quickSearch]);

  useEffect(() => {
    const id = setTimeout(() => {
      const s = urlStateRef.current;
      const params = buildScreenerSearchParams({
        tab: s.tab,
        q: s.searchForUrl,
        page: s.page,
        limit: s.pageSize,
        sortField: s.sortField,
        sortOrder: s.sortOrder,
        appliedStock: s.appliedStock,
        appliedEtf: s.appliedEtf,
      });
      const next = params.toString();
      const cur = searchParamsRef.current.toString();
      if (next === cur) return;

      isUpdatingUrl.current = true;
      const url = next ? `${pathname}?${next}` : pathname;
      router.replace(url, { scroll: false });
      setTimeout(() => {
        isUpdatingUrl.current = false;
      }, 100);
    }, 0);

    return () => clearTimeout(id);
  }, [
    tab,
    searchForUrl,
    page,
    pageSize,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
    pathname,
    router,
  ]);

  const handleTabChange = (value) => {
    setTab(value);
    setQuickSearch("");
    setSearchForUrl("");
    setPage(1);
    setSortField(null);
    setSortOrder(null);
  };

  const isStocks = tab === "stocks";
  const draft = isStocks ? draftStock : draftEtf;
  const setDraft = isStocks ? setDraftStock : setDraftEtf;
  const applied = isStocks ? appliedStock : appliedEtf;
  const setApplied = isStocks ? setAppliedStock : setAppliedEtf;
  const fields = isStocks ? STOCK_FILTERS : ETF_FILTERS;

  const etfSymbols = useMemo(() => ETFS.map((e) => e.sym), []);
  const { quotes: etfQuotes, error: etfQuotesError } = useQuotes(etfSymbols);

  const chips = useMemo(() => {
    const labelOf = (k) => fields.find((f) => f.key === k)?.label ?? k;
    return Object.entries(applied)
      .map(([k, v]) => ({
        key: k,
        text: formatChip(labelOf(k), v),
      }))
      .filter((c) => !!c.text);
  }, [applied, fields]);

  const removeChip = (key) => {
    setPage(1);
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

  const matchedStocks = useMemo(() => {
    const f = appliedStock;
    return STOCKS.filter((s) => {
      if (typeof f.sector === "string" && f.sector && f.sector !== "Any" && s.sector !== f.sector) {
        return false;
      }
      return true;
    });
  }, [appliedStock]);

  const searchedStocks = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return matchedStocks;
    return matchedStocks.filter(
      (s) => s.sym.toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q),
    );
  }, [matchedStocks, quickSearch]);

  const sortedStockBundled = useMemo(() => {
    const arr = [...searchedStocks];
    if (sortField && sortOrder) {
      arr.sort((a, b) => compareStockRows(a, b, sortField, sortOrder));
    }
    return arr;
  }, [searchedStocks, sortField, sortOrder]);

  /** Price / valuation range filters require live quotes — never used fake static numbers. */
  const stockMarketFiltersActive = useMemo(() => {
    const f = appliedStock;
    return ["price", "chg", "mktCap", "pe", "epsGrowth"].some((k) => {
      const v = f[k];
      return !!(v?.min?.trim() || v?.max?.trim());
    });
  }, [appliedStock]);

  const stockSymbolsToQuote = useMemo(() => {
    if (stockMarketFiltersActive) {
      return sortedStockBundled.slice(0, MAX_STOCKS_FOR_MARKET_FILTER).map((s) => s.sym);
    }
    const total = sortedStockBundled.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pg = Math.min(Math.max(1, page), totalPages);
    const start = Math.max(0, (pg - 1) * pageSize);
    const end = Math.min(total, start + pageSize + QUOTE_BUFFER);
    return sortedStockBundled.slice(start, end).map((s) => s.sym);
  }, [stockMarketFiltersActive, sortedStockBundled, page, pageSize]);

  const {
    quotes: stockQuotes,
    error: stockQuotesError,
    loading: stockQuotesLoading,
  } = useQuotes(stockSymbolsToQuote);

  const stockRowsAfterMarketFilters = useMemo(() => {
    if (!stockMarketFiltersActive) return sortedStockBundled;
    const pool = sortedStockBundled.slice(0, MAX_STOCKS_FOR_MARKET_FILTER);
    return pool.filter((s) =>
      passesStockMarketFilters(enrichStockRow(s, stockQuotes[s.sym]), appliedStock),
    );
  }, [stockMarketFiltersActive, sortedStockBundled, stockQuotes, appliedStock]);

  const stockTotal = stockRowsAfterMarketFilters.length;
  const stockTotalPages = Math.max(1, Math.ceil(stockTotal / pageSize));
  const stockPage = Math.min(Math.max(1, page), stockTotalPages);

  const stockQuoteStart = Math.max(0, (stockPage - 1) * pageSize);

  const displayedStocks = useMemo(() => {
    const slice = stockRowsAfterMarketFilters.slice(stockQuoteStart, stockQuoteStart + pageSize);
    return slice.map((s) => enrichStockRow(s, stockQuotes[s.sym]));
  }, [stockRowsAfterMarketFilters, stockQuoteStart, pageSize, stockQuotes]);

  const handleSort = (field) => {
    setPage(1);
    if (sortField !== field) {
      setSortField(field);
      setSortOrder("desc");
      return;
    }
    if (sortOrder === "desc") {
      setSortOrder("asc");
      return;
    }
    if (sortOrder === "asc") {
      setSortField(null);
      setSortOrder(null);
      return;
    }
    setSortOrder("desc");
  };

  const stockHeaders = [
    { key: null, label: "", sortable: false },
    { key: "sym", label: "Symbol", sortable: true },
    { key: "price", label: "Price", sortable: true },
    { key: "chg", label: "Chg %", sortable: true },
    { key: "vol", label: "Vol", sortable: true },
    { key: "relVol", label: "Rel Vol", sortable: true },
    { key: "mktCap", label: "Mkt Cap", sortable: true },
    { key: "pe", label: "P/E", sortable: true },
    { key: "eps", label: "EPS dil TTM", sortable: true },
    { key: "epsGrowth", label: "EPS growth Fwd/TTM", sortable: true },
  ];

  const etfRowsRaw = useMemo(() => {
    return ETFS.map((e) => {
      const q = etfQuotes[e.sym];
      return {
        ...e,
        price: q?.c ?? null,
        chg: q?.dp ?? null,
        logo: q?.logo ?? null,
      };
    }).filter((e) => {
      const f = appliedEtf;
      if (!numericRangeMatches(e.price, f.price)) return false;
      if (!numericRangeMatches(e.chg, f.chg)) return false;
      if (!numericRangeMatches(e.expense, f.expense)) return false;
      if (!numericRangeMatches(e.yld, f.divYield)) return false;
      if (typeof f.brand === "string" && f.brand && f.brand !== "Any" && e.brand !== f.brand)
        return false;
      return true;
    });
  }, [appliedEtf, etfQuotes]);

  const searchedEtfs = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return etfRowsRaw;
    return etfRowsRaw.filter(
      (e) => e.sym.toLowerCase().includes(q) || (e.name || "").toLowerCase().includes(q),
    );
  }, [etfRowsRaw, quickSearch]);

  const sortedEtfs = useMemo(() => {
    const arr = [...searchedEtfs];
    if (sortField && sortOrder) {
      arr.sort((a, b) => compareEtfRows(a, b, sortField, sortOrder));
    }
    return arr;
  }, [searchedEtfs, sortField, sortOrder]);

  const etfTotal = sortedEtfs.length;
  const etfTotalPages = Math.max(1, Math.ceil(etfTotal / pageSize));
  const etfPage = Math.min(Math.max(1, page), etfTotalPages);
  const etfStart = (etfPage - 1) * pageSize;
  const displayedEtfs = sortedEtfs.slice(etfStart, etfStart + pageSize);

  const etfHeaders = [
    { key: "sym", label: "Symbol", sortable: true },
    { key: "price", label: "Price", sortable: true },
    { key: "chg", label: "Chg %", sortable: true },
    { key: "aum", label: "AUM", sortable: true },
    { key: "expense", label: "Expense %", sortable: true },
    { key: "yld", label: "Div Yield %", sortable: true },
    { key: "brand", label: "Brand", sortable: true },
  ];

  const activeTotal = isStocks ? stockTotal : etfTotal;
  const listPage = isStocks ? stockPage : etfPage;
  const rangeFrom = activeTotal === 0 ? 0 : (listPage - 1) * pageSize + 1;
  const rangeTo = Math.min(listPage * pageSize, activeTotal);

  return (
    <DashboardPageShell>
          {(stockQuotesError || etfQuotesError) && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              Live quotes failed: {stockQuotesError || etfQuotesError}. Run the backend (e.g. npm run dev in backend/)
              and set STOCKY_BACKEND_URL if the API is not on the default URL.
            </div>
          )}
          {stockQuotesLoading && !stockQuotesError && isStocks && (
            <div className="mb-3 text-xs text-muted-foreground">
              {stockMarketFiltersActive
                ? `Loading live quotes to apply filters (first ${MAX_STOCKS_FOR_MARKET_FILTER} rows in sort order)…`
                : "Loading live prices for this page…"}
            </div>
          )}
          {stockMarketFiltersActive && !stockQuotesError && isStocks && (
            <div className="mb-3 text-xs text-muted-foreground" role="status">
              Showing symbols that match filters using live Yahoo data only. Applies to up to{" "}
              <span className="font-medium tabular-nums">{MAX_STOCKS_FOR_MARKET_FILTER}</span>{" "}
              results in the current sort; narrow search to avoid missing symbols further down.
            </div>
          )}

          <PageHeading
            title="Stock Screener"
            description="Filter the market by fundamentals, performance, and technicals. Live prices via Yahoo Finance."
            className="mb-8"
          />

          {/* Toolbar: dashboard-style search + filters + page size */}
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="relative min-w-[200px] flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 bg-background/80 pl-9"
                placeholder="Search symbol or name…"
                value={quickSearch}
                onChange={(e) => {
                  setQuickSearch(e.target.value);
                  setPage(1);
                }}
                aria-label="Search table"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Dialog
                open={filtersOpen}
                onOpenChange={(o) => {
                  setFiltersOpen(o);
                  if (o) setDraft(applied);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="gap-2 text-primary-foreground"
                    style={{
                      background: "var(--gradient-primary)",
                      boxShadow: "var(--shadow-glow)",
                    }}
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
                    <DialogDescription>
                      Narrow the universe. Empty fields mean &quot;any&quot;. Stocks: price / change /
                      valuation filters use{" "}
                      <span className="font-medium text-foreground">live quotes only</span>
                      {" "}(no placeholder numbers).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2 md:grid-cols-3">
                    {fields.map((f) => (
                      <FilterField key={f.key} label={f.label}>
                        {f.type === "select" ? (
                          <SelectFilter
                            value={draft[f.key] ?? ""}
                            onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                            options={f.options ?? []}
                            placeholder={f.placeholder}
                          />
                        ) : (
                          <RangeFilter
                            value={draft[f.key]}
                            onChange={(v) => setDraft({ ...draft, [f.key]: v })}
                          />
                        )}
                      </FilterField>
                    ))}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setDraft({})}>
                      Reset
                    </Button>
                    <Button
                      className="text-primary-foreground"
                      style={{ background: "var(--gradient-primary)" }}
                      onClick={() => {
                        setApplied(draft);
                        setFiltersOpen(false);
                        setPage(1);
                      }}
                    >
                      Apply filters
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[130px] bg-background/80">
                  <SelectValue placeholder="Rows" />
                </SelectTrigger>
                <SelectContent>
                  {SCREENER_PAGE_LIMIT_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
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
                onClick={() => {
                  setApplied({});
                  setPage(1);
                }}
                className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          <Tabs value={tab} onValueChange={handleTabChange} className="mt-6">
            <TabsList className="bg-secondary/60">
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
              <TabsTrigger value="etfs">ETFs</TabsTrigger>
            </TabsList>

            <TabsContent value="stocks" className="mt-4 space-y-0">
              <div
                className="overflow-hidden rounded-2xl border border-border/60"
                style={{
                  background: "var(--gradient-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <Table containerClassName="max-h-[calc(100vh-280px)] rounded-none border-0">
                  <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                    <TableRow className="border-border/60 hover:bg-transparent">
                      {stockHeaders.map((col) =>
                        col.sortable ? (
                          <TableHead
                            key={col.key || "fav"}
                            className={`whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground ${
                              col.key ? "cursor-pointer select-none hover:bg-secondary/40" : ""
                            }`}
                            onClick={() => col.key && handleSort(col.key)}
                          >
                            <span className="inline-flex items-center">
                              {col.label}
                              {col.key ? (
                                <SortIndicator
                                  active={sortField === col.key && !!sortOrder}
                                  order={sortOrder}
                                />
                              ) : null}
                            </span>
                          </TableHead>
                        ) : (
                          <TableHead
                            key="fav"
                            className="w-12 whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            {col.label}
                          </TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60 [&_tr]:border-border/60">
                    {displayedStocks.map((s) => {
                      const up = (s.chg ?? 0) >= 0;
                      const epsUp = (s.epsGrowth ?? 0) >= 0;
                      return (
                        <TableRow key={s.sym} className="hover:bg-secondary/30">
                          <TableCell className="px-4 py-3">
                            <FavoriteButton symbol={s.sym} size="sm" />
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-4 py-3">
                            <Link
                              href={`/stock/${s.sym}`}
                              className="flex items-center gap-3 hover:text-accent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StockAvatar symbol={s.sym} src={s.logo} />
                              <div>
                                <div className="font-medium">{s.sym}</div>
                                <div className="text-xs text-muted-foreground">{s.name}</div>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">
                            <span>
                              {fmtMoneyLike(s.price)}
                              {s.price != null && Number.isFinite(s.price) ? (
                                <span className="text-xs text-muted-foreground"> USD</span>
                              ) : null}
                            </span>
                          </TableCell>
                          <TableCell
                            className={`px-4 py-3 tabular-nums ${
                              s.chg != null && Number.isFinite(s.chg)
                                ? up
                                  ? "text-accent"
                                  : "text-destructive"
                                : ""
                            }`}
                          >
                            {s.chg != null && Number.isFinite(s.chg)
                              ? `${up ? "+" : ""}${s.chg.toFixed(2)}%`
                              : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums text-muted-foreground">
                            {fmtVolLike(s.vol)}
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums text-muted-foreground">
                            {fmtVolLike(s.relVol)}
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">
                            {typeof s.mktCap === "string" ? s.mktCap || "—" : fmtVolLike(s.mktCap)}
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">{fmtMoneyLike(s.pe)}</TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">{fmtMoneyLike(s.eps)}</TableCell>
                          <TableCell
                            className={`px-4 py-3 tabular-nums ${
                              s.epsGrowth != null && Number.isFinite(s.epsGrowth)
                                ? epsUp
                                  ? "text-accent"
                                  : "text-destructive"
                                : ""
                            }`}
                          >
                            {s.epsGrowth != null && Number.isFinite(s.epsGrowth)
                              ? `${epsUp ? "+" : ""}${s.epsGrowth.toFixed(2)}%`
                              : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {displayedStocks.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No stocks match search or filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="tabular-nums">{rangeFrom}</span>–
                    <span className="tabular-nums">{rangeTo}</span> of{" "}
                    <span className="tabular-nums">{stockTotal}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={stockPage <= 1}
                      onClick={() => setPage(stockPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Page {stockPage} / {stockTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={stockPage >= stockTotalPages}
                      onClick={() => setPage(stockPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="etfs" className="mt-4 space-y-0">
              <div
                className="overflow-hidden rounded-2xl border border-border/60"
                style={{
                  background: "var(--gradient-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <Table containerClassName="max-h-[calc(100vh-280px)] rounded-none border-0">
                  <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
                    <TableRow className="border-border/60 hover:bg-transparent">
                      {etfHeaders.map((col) => (
                        <TableHead
                          key={col.key}
                          className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-secondary/40"
                          onClick={() => handleSort(col.key)}
                        >
                          <span className="inline-flex items-center">
                            {col.label}
                            <SortIndicator
                              active={sortField === col.key && !!sortOrder}
                              order={sortOrder}
                            />
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60 [&_tr]:border-border/60">
                    {displayedEtfs.map((e) => {
                      const up = (e.chg ?? 0) >= 0;
                      return (
                        <TableRow key={e.sym} className="hover:bg-secondary/30">
                          <TableCell className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-3">
                              <StockAvatar symbol={e.sym} src={e.logo} />
                              <div>
                                <div className="font-medium">{e.sym}</div>
                                <div className="text-xs text-muted-foreground">{e.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">
                            <span>
                              {fmtMoneyLike(e.price)}
                              {e.price != null && Number.isFinite(e.price) ? (
                                <span className="text-xs text-muted-foreground"> USD</span>
                              ) : null}
                            </span>
                          </TableCell>
                          <TableCell
                            className={`px-4 py-3 tabular-nums ${
                              e.chg != null && Number.isFinite(e.chg)
                                ? up
                                  ? "text-accent"
                                  : "text-destructive"
                                : ""
                            }`}
                          >
                            {e.chg != null && Number.isFinite(e.chg)
                              ? `${up ? "+" : ""}${e.chg.toFixed(2)}%`
                              : "—"}
                          </TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">{e.aum}</TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">{e.expense.toFixed(2)}%</TableCell>
                          <TableCell className="px-4 py-3 tabular-nums">{e.yld.toFixed(2)}%</TableCell>
                          <TableCell className="px-4 py-3 text-muted-foreground">{e.brand}</TableCell>
                        </TableRow>
                      );
                    })}
                    {displayedEtfs.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No ETFs match search or filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing <span className="tabular-nums">{rangeFrom}</span>–
                    <span className="tabular-nums">{rangeTo}</span> of{" "}
                    <span className="tabular-nums">{etfTotal}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={etfPage <= 1}
                      onClick={() => setPage(etfPage - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      Page {etfPage} / {etfTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={etfPage >= etfTotalPages}
                      onClick={() => setPage(etfPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
    </DashboardPageShell>
  );
}
