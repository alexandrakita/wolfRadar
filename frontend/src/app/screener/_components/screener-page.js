"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { PageHeading } from "@/components/page-heading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/use-quotes";
import { useScreenerMetrics } from "@/hooks/use-screener-metrics";
import { useScreenerQuery } from "@/hooks/use-screener-query";
import { useScreenerSync } from "@/hooks/use-screener-sync";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, TrendingUp, Layers } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { StockAvatar } from "@/components/stock-avatar";
import {
  buildScreenerSearchParams,
  DEFAULT_SCREENER_LIMIT,
  parseScreenerSearchParams,
} from "@/utils/screener-search-params";
import { SCREENER_TABS } from "@/constants/screener";
import {
  QUOTE_BUFFER,
  STOCKS,
  ETFS,
  STOCK_FILTERS,
  STOCK_FILTER_CATEGORIES,
  ETF_FILTERS,
} from "@/constants/screener-ui";
import { STOCK_BADGE_BY_ID } from "@/constants/stock-badges";
import {
  compareStockRows,
  compareEtfRows,
  enrichStockRowFromMetrics,
  fmtMoneyLike,
  fmtVolLike,
  formatChip,
  numericRangeMatches,
} from "@/utils/screener-table";
import {
  formatFilterChip,
  stockMetricsFiltersActive,
} from "@/utils/stock-filters";
import { computeStockBadges } from "@/utils/stock-badges";
import {
  SortIndicator,
} from "./filter-widgets";
import { MarketIndexesSection } from "./market-indexes-section";
import { ScreenerFiltersBar } from "./screener-filters-bar";
import { StockBadges } from "./stock-badges";

const LIVE_STOCK_SORT_KEYS = new Set([
  "price",
  "chg",
  "vol",
  "relVol",
  "mktCap",
  "pe",
  "eps",
  "epsGrowth",
]);

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const isUpdatingUrl = useRef(false);
  const initialUrl = parseScreenerSearchParams(searchParams);

  const [tab, setTab] = useState(initialUrl.tab);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [draftStock, setDraftStock] = useState(initialUrl.appliedStock);
  const [appliedStock, setAppliedStock] = useState(initialUrl.appliedStock);
  const [draftEtf, setDraftEtf] = useState(initialUrl.appliedEtf);
  const [appliedEtf, setAppliedEtf] = useState(initialUrl.appliedEtf);

  const [quickSearch, setQuickSearch] = useState(initialUrl.q);
  const [searchForUrl, setSearchForUrl] = useState(initialUrl.q);
  const [selectedIndex, setSelectedIndex] = useState(initialUrl.index);
  const [page, setPage] = useState(initialUrl.page);
  const [pageSize, setPageSize] = useState(initialUrl.limit);
  const [sortField, setSortField] = useState(initialUrl.sortField);
  const [sortOrder, setSortOrder] = useState(initialUrl.sortOrder);
  const [quickFilters, setQuickFilters] = useState(initialUrl.quickFilters ?? []);

  const urlStateRef = useRef({
    tab,
    searchForUrl,
    selectedIndex,
    page,
    pageSize,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
    quickFilters,
  });
  urlStateRef.current = {
    tab,
    searchForUrl,
    selectedIndex,
    page,
    pageSize,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
    quickFilters,
  };

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  useEffect(() => {
    if (isUpdatingUrl.current) return;
    const parsed = parseScreenerSearchParams(searchParamsRef.current);
    setTab(parsed.tab);
    setQuickSearch(parsed.q);
    setSearchForUrl(parsed.q);
    setSelectedIndex(parsed.index);
    setPage(parsed.page);
    setPageSize(parsed.limit);
    setSortField(parsed.sortField);
    setSortOrder(parsed.sortOrder);
    setAppliedStock(parsed.appliedStock);
    setAppliedEtf(parsed.appliedEtf);
    setDraftStock(parsed.appliedStock);
    setDraftEtf(parsed.appliedEtf);
    setQuickFilters(parsed.quickFilters ?? []);
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
        index: s.selectedIndex,
        page: s.page,
        limit: s.pageSize,
        sortField: s.sortField,
        sortOrder: s.sortOrder,
        appliedStock: s.appliedStock,
        appliedEtf: s.appliedEtf,
        quickFilters: s.quickFilters,
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
    selectedIndex,
    page,
    pageSize,
    sortField,
    sortOrder,
    appliedStock,
    appliedEtf,
    quickFilters,
    pathname,
    router,
  ]);

  const handleTabChange = (value) => {
    setTab(value);
    setPage(1);
    setSortField(null);
    setSortOrder(null);
    if (value === SCREENER_TABS.INDEXES) {
      setQuickSearch("");
      setSearchForUrl("");
      return;
    }
    setSelectedIndex("");
    setQuickSearch("");
    setSearchForUrl("");
  };

  const isStocks = tab === SCREENER_TABS.STOCKS;
  useScreenerSync(isStocks);
  const draft = isStocks ? draftStock : draftEtf;
  const setDraft = isStocks ? setDraftStock : setDraftEtf;
  const applied = isStocks ? appliedStock : appliedEtf;
  const setApplied = isStocks ? setAppliedStock : setAppliedEtf;
  const fields = isStocks ? STOCK_FILTERS : ETF_FILTERS;

  const etfSymbols = useMemo(() => ETFS.map((e) => e.sym), []);
  const { quotes: etfQuotes, error: etfQuotesError } = useQuotes(etfSymbols, {
    enabled: tab === SCREENER_TABS.ETFS,
  });

  const stockChips = useMemo(() => {
    const labelOf = (k) => STOCK_FILTERS.find((f) => f.key === k)?.label ?? k;
    const filterChips = Object.entries(appliedStock)
      .map(([k, v]) => ({
        key: k,
        text: formatFilterChip(labelOf(k), v),
      }))
      .filter((c) => !!c.text);
    const quickChips = quickFilters.map((id) => {
      const badge = STOCK_BADGE_BY_ID[id];
      return {
        key: `qf:${id}`,
        text: badge ? `${badge.emoji} ${badge.label}` : id,
      };
    });
    return [...quickChips, ...filterChips];
  }, [appliedStock, quickFilters]);

  const etfChips = useMemo(() => {
    const labelOf = (k) => ETF_FILTERS.find((f) => f.key === k)?.label ?? k;
    return Object.entries(appliedEtf)
      .map(([k, v]) => ({
        key: k,
        text: formatChip(labelOf(k), v),
      }))
      .filter((c) => !!c.text);
  }, [appliedEtf]);

  const searchedStocks = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return STOCKS;
    return STOCKS.filter(
      (s) => s.sym.toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q),
    );
  }, [quickSearch]);

  const stockMetricsActive = useMemo(
    () =>
      stockMetricsFiltersActive(appliedStock, quickFilters) ||
      !!(sortField && LIVE_STOCK_SORT_KEYS.has(sortField)),
    [appliedStock, quickFilters, sortField],
  );

  const useServerScreener = isStocks && stockMetricsActive;

  const {
    rows: serverRows,
    total: serverTotal,
    totalInStore,
    snapshotDate,
    ready: snapshotReady,
    message: snapshotMessage,
    loading: serverLoading,
    fetching: serverFetching,
    fromCache: serverFromCache,
    error: serverError,
  } = useScreenerQuery(
    {
      filters: appliedStock,
      quickFilters,
      q: quickSearch,
      sortField,
      sortOrder,
      page,
      pageSize,
    },
    useServerScreener,
  );

  const stockSymbolsToLoad = useMemo(() => {
    if (useServerScreener) return [];
    if (stockMetricsActive) {
      return searchedStocks.map((s) => s.sym);
    }
    const total = searchedStocks.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const pg = Math.min(Math.max(1, page), totalPages);
    const start = Math.max(0, (pg - 1) * pageSize);
    const end = Math.min(total, start + pageSize + QUOTE_BUFFER);
    return searchedStocks.slice(start, end).map((s) => s.sym);
  }, [useServerScreener, stockMetricsActive, searchedStocks, page, pageSize]);

  const {
    metrics: stockMetrics,
    error: stockMetricsError,
    loading: stockMetricsLoading,
  } = useScreenerMetrics(stockSymbolsToLoad);

  const sortedStocks = useMemo(() => {
    if (useServerScreener) return serverRows;
    const arr = [...searchedStocks];
    if (sortField && sortOrder) {
      if (stockMetricsActive || !LIVE_STOCK_SORT_KEYS.has(sortField)) {
        const enriched = stockMetricsActive
          ? arr.map((s) => enrichStockRowFromMetrics(s, stockMetrics[s.sym]))
          : arr.map((s) => enrichStockRowFromMetrics(s, stockMetrics[s.sym]));
        enriched.sort((a, b) => compareStockRows(a, b, sortField, sortOrder));
        return enriched;
      }
    }
    return arr;
  }, [
    useServerScreener,
    serverRows,
    stockMetricsActive,
    searchedStocks,
    sortField,
    sortOrder,
    stockMetrics,
  ]);

  const stockTotal = useServerScreener ? serverTotal : sortedStocks.length;
  const stockTotalPages = Math.max(1, Math.ceil(stockTotal / pageSize));
  const stockPage = Math.min(Math.max(1, page), stockTotalPages);
  const stockQuoteStart = Math.max(0, (stockPage - 1) * pageSize);

  const displayedStocks = useMemo(() => {
    const slice = useServerScreener
      ? sortedStocks
      : sortedStocks.slice(stockQuoteStart, stockQuoteStart + pageSize);
    return slice.map((s) => {
      const row = s.price != null ? s : enrichStockRowFromMetrics(s, stockMetrics[s.sym]);
      const badges = computeStockBadges(row).map((b) => b.id);
      return { ...row, badgeIds: badges };
    });
  }, [useServerScreener, sortedStocks, stockQuoteStart, pageSize, stockMetrics]);

  const { quotes: stockPageQuotes } = useQuotes(
    useServerScreener ? [] : stockSymbolsToLoad,
    {
      enabled: tab === SCREENER_TABS.STOCKS && !useServerScreener,
    },
  );

  const displayedStocksWithQuotes = useMemo(() => {
    if (useServerScreener) return displayedStocks;
    return displayedStocks.map((row) => {
      if (row.price != null) return row;
      const q = stockPageQuotes[row.sym];
      if (!q) return row;
      return enrichStockRowFromMetrics(row, {
        price: q.c,
        chg: q.dp,
        vol: q.vol,
        volLabel: q.volLabel,
        relVol: q.relVol,
        mktCap: q.mktCap,
        mktCapLabel: q.mktCapLabel,
        pe: q.pe,
        eps: q.eps,
        epsGrowth: q.epsGrowth,
        logo: q.logo,
        longName: q.longName,
      });
    });
  }, [useServerScreener, displayedStocks, stockPageQuotes]);

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
    { key: null, label: "Badges", sortable: false },
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

  const filtersBarProps = {
    quickSearch,
    onQuickSearchChange: (v) => {
      setQuickSearch(v);
      setPage(1);
    },
    filtersOpen,
    onFiltersOpenChange: setFiltersOpen,
    onPageReset: () => setPage(1),
    pageSize,
    onPageSizeChange: (n) => {
      setPageSize(n);
      setPage(1);
    },
  };

  const stockFiltersBarProps = {
    ...filtersBarProps,
    isStocks: true,
    fields: STOCK_FILTERS,
    filterCategories: STOCK_FILTER_CATEGORIES,
    draft: draftStock,
    setDraft: setDraftStock,
    applied: appliedStock,
    setApplied: setAppliedStock,
    chips: stockChips,
    quickFilters,
    onQuickFiltersChange: (next) => {
      setQuickFilters(next);
      setPage(1);
    },
    onRemoveChip: (key) => {
      setPage(1);
      if (key.startsWith("qf:")) {
        const id = key.slice(3);
        setQuickFilters((prev) => prev.filter((x) => x !== id));
        return;
      }
      setAppliedStock((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDraftStock((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    onClearFilters: () => {
      setAppliedStock({});
      setQuickFilters([]);
      setPage(1);
    },
  };

  const etfFiltersBarProps = {
    ...filtersBarProps,
    isStocks: false,
    fields: ETF_FILTERS,
    draft: draftEtf,
    setDraft: setDraftEtf,
    applied: appliedEtf,
    setApplied: setAppliedEtf,
    chips: etfChips,
    onRemoveChip: (key) => {
      setPage(1);
      setAppliedEtf((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setDraftEtf((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    onClearFilters: () => {
      setAppliedEtf({});
      setPage(1);
    },
  };

  return (
    <DashboardPageShell>
          {(serverError || stockMetricsError || etfQuotesError) && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              Live data failed: {serverError || stockMetricsError || etfQuotesError}. Run the backend (e.g. npm run dev in
              backend/) and set STOCKY_BACKEND_URL if the API is not on the default URL.
            </div>
          )}

          <PageHeading
            title="Screener"
            description="Market indexes, stock filters, and ETF discovery — live data from Yahoo Finance."
            className="mb-4"
          />

          <Tabs value={tab} onValueChange={handleTabChange} className="mt-2">
            <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-secondary/60 p-1 sm:w-auto">
              <TabsTrigger value={SCREENER_TABS.INDEXES} className="gap-2">
                <Activity className="h-4 w-4" />
                Market Indexes
              </TabsTrigger>
              <TabsTrigger value={SCREENER_TABS.STOCKS} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Stocks
              </TabsTrigger>
              <TabsTrigger value={SCREENER_TABS.ETFS} className="gap-2">
                <Layers className="h-4 w-4" />
                ETFs
              </TabsTrigger>
            </TabsList>

            <TabsContent value={SCREENER_TABS.INDEXES} className="mt-0 space-y-0">
              <MarketIndexesSection
                selectedIndex={selectedIndex}
                onSelectIndex={(sym) => {
                  setSelectedIndex(sym);
                  if (sym) setTab(SCREENER_TABS.INDEXES);
                }}
              />
            </TabsContent>

            <TabsContent value={SCREENER_TABS.STOCKS} className="mt-0 space-y-4">
          {(serverLoading || stockMetricsLoading) && !serverError && !stockMetricsError && (
            <div className="text-xs text-muted-foreground">
              {useServerScreener
                ? `Scanning ${totalInStore.toLocaleString()} stocks in today's snapshot…`
                : "Loading metrics for this page…"}
            </div>
          )}
          {useServerScreener && serverFromCache && serverFetching && !serverError && (
            <div className="text-xs text-muted-foreground">
              Showing cached results while refreshing…
            </div>
          )}
          {useServerScreener && !serverLoading && !serverError && snapshotReady && (
            <div className="text-xs text-muted-foreground" role="status">
              Filters apply across all{" "}
              <span className="font-medium tabular-nums">{totalInStore.toLocaleString()}</span>{" "}
              stocks in snapshot{" "}
              {snapshotDate ? (
                <>
                  (<span className="font-medium">{snapshotDate}</span>)
                </>
              ) : null}
              .{" "}
              {serverTotal.toLocaleString()} match{serverTotal === 1 ? "" : "es"}.
            </div>
          )}
          {useServerScreener && !serverLoading && !serverError && !snapshotReady && snapshotMessage && (
            <div className="text-xs text-amber-600 dark:text-amber-400" role="status">
              {snapshotMessage} Run{" "}
              <code className="rounded bg-secondary/60 px-1">npm run build-snapshot</code> in backend.
            </div>
          )}
          {(serverError || stockMetricsError) && (
            <div className="text-xs text-destructive" role="alert">
              {serverError || stockMetricsError}
            </div>
          )}

          <ScreenerFiltersBar {...stockFiltersBarProps} />

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
                      {stockHeaders.map((col, idx) =>
                        col.sortable ? (
                          <TableHead
                            key={col.key || `col-${idx}`}
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
                            key={col.key || `col-${idx}`}
                            className={`whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground ${
                              col.key === null && col.label === "" ? "w-9 px-2" : "min-w-[120px]"
                            }`}
                          >
                            {col.label}
                          </TableHead>
                        ),
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/60 [&_tr]:border-border/60">
                    {displayedStocksWithQuotes.map((s) => {
                      const up = (s.chg ?? 0) >= 0;
                      const epsUp = (s.epsGrowth ?? 0) >= 0;
                      return (
                        <TableRow
                          key={s.sym}
                          className="cursor-pointer hover:bg-secondary/30"
                          onClick={() => router.push(`/stock/${encodeURIComponent(s.sym)}`)}
                        >
                          <TableCell className="w-9 px-2 py-3">
                            <FavoriteButton symbol={s.sym} size="sm" />
                          </TableCell>
                          <TableCell className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center gap-3">
                              <StockAvatar symbol={s.sym} src={s.logo} />
                              <div>
                                <div className="font-medium">{s.sym}</div>
                                <div className="text-xs text-muted-foreground">{s.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <StockBadges badgeIds={s.badgeIds} />
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
                    {displayedStocksWithQuotes.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={11}
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

            <TabsContent value={SCREENER_TABS.ETFS} className="mt-0 space-y-4">
              <ScreenerFiltersBar {...etfFiltersBarProps} />

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
