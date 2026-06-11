"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

import { MARKET_INDEXES, marketIndexMeta } from "@/constants/market-indexes";
import { MiniSparkChart } from "@/components/dashboard/mini-spark-chart";
import { PriceChart } from "@/components/price-chart";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/use-quotes";
import { screenerIndexUrl } from "@/utils/dashboard-links";
import { fmtMoney, fmtPct } from "@/utils/formatters";
import { cn } from "@/lib/utils";

function fmtPrice(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-secondary/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function MarketIndexesSection({ selectedIndex, onSelectIndex }) {
  const symbols = MARKET_INDEXES.map((i) => i.sym);
  const { quotes, loading, error } = useQuotes(symbols);
  const detailRef = useRef(null);

  const rows = useMemo(
    () =>
      MARKET_INDEXES.map((idx) => {
        const q = quotes[idx.sym];
        return {
          ...idx,
          price: q?.c ?? null,
          change: q?.d ?? null,
          changePct: q?.dp ?? null,
          open: q?.o ?? null,
          high: q?.h ?? null,
          low: q?.l ?? null,
          prevClose: q?.pc ?? null,
          volume: q?.volLabel ?? null,
          longName: q?.longName ?? idx.name,
        };
      }),
    [quotes],
  );

  const active = marketIndexMeta(selectedIndex);
  const activeRow = rows.find((r) => r.sym === active?.sym) ?? null;

  useEffect(() => {
    if (!selectedIndex || !detailRef.current) return;
    detailRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedIndex]);

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Market Indexes</h2>
          <p className="text-sm text-muted-foreground">
            Live NASDAQ, S&P 500, Dow Jones, and VIX — select one for full details.
          </p>
        </div>
        {selectedIndex ? (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => onSelectIndex("")}>
            Clear selection
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((idx) => {
          const up = (idx.changePct ?? 0) >= 0;
          const isSelected = selectedIndex === idx.sym;
          const hasData = idx.price != null;

          return (
            <button
              key={idx.sym}
              type="button"
              onClick={() => onSelectIndex(isSelected ? "" : idx.sym)}
              className={cn(
                "rounded-xl border p-3 text-left transition hover:border-primary/40",
                isSelected
                  ? "border-primary/50 bg-primary/10 ring-1 ring-primary/30"
                  : "border-border/50 bg-secondary/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">{idx.label}</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {hasData ? fmtPrice(idx.price) : loading ? "…" : "—"}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        up ? "text-accent" : "text-destructive",
                      )}
                    >
                      {idx.changePct != null ? fmtPct(idx.changePct) : "—"}
                    </span>
                  </div>
                </div>
                {hasData ? (
                  <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent">
                    Live
                  </span>
                ) : null}
              </div>
              <MiniSparkChart symbol={idx.sym} range="5D" className="mt-3" height={56} />
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="mt-2 text-xs text-destructive">Index quotes failed: {error}</p>
      ) : null}

      {activeRow ? (
        <div
          ref={detailRef}
          className="mt-4 rounded-2xl border border-border/60 p-5"
          style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {activeRow.label}
              </div>
              <h3 className="mt-1 text-xl font-semibold">{activeRow.longName}</h3>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{activeRow.sym}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold tabular-nums">
                {activeRow.price != null ? fmtPrice(activeRow.price) : "—"}
              </div>
              <div
                className={cn(
                  "text-sm font-medium tabular-nums",
                  (activeRow.changePct ?? 0) >= 0 ? "text-accent" : "text-destructive",
                )}
              >
                {activeRow.change != null
                  ? `${activeRow.change >= 0 ? "+" : ""}${fmtMoney(Math.abs(activeRow.change))}`
                  : "—"}
                {activeRow.changePct != null ? ` (${fmtPct(activeRow.changePct)})` : ""}
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Open" value={fmtPrice(activeRow.open)} />
            <Stat label="Prev close" value={fmtPrice(activeRow.prevClose)} />
            <Stat label="Day high" value={fmtPrice(activeRow.high)} />
            <Stat label="Day low" value={fmtPrice(activeRow.low)} />
            <Stat label="Volume" value={activeRow.volume ?? "—"} />
            <Stat label="Symbol" value={activeRow.sym} />
          </div>

          <PriceChart symbol={activeRow.sym} />

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={screenerIndexUrl(activeRow.sym)} className="gap-2">
                View full details
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : loading && !rows.some((r) => r.price != null) ? (
        <div className="mt-4 grid place-items-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}
    </section>
  );
}
