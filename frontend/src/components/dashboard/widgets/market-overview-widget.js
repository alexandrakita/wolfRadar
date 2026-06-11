"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { INDEX_SYMBOLS } from "@/constants/dashboard";
import { MiniSparkChart } from "@/components/dashboard/mini-spark-chart";
import { WidgetFrame } from "@/components/dashboard/widget-frame";
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
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function MarketOverviewWidget(props) {
  const symbols = INDEX_SYMBOLS.map((i) => i.sym);
  const { quotes, loading, error } = useQuotes(symbols);

  const indices = useMemo(
    () =>
      INDEX_SYMBOLS.map((idx) => {
        const q = quotes[idx.sym];
        return {
          ...idx,
          quote: q,
          price: q?.c ?? null,
          change: q?.d ?? null,
          changePct: q?.dp ?? null,
          open: q?.o ?? null,
          high: q?.h ?? null,
          low: q?.l ?? null,
          prevClose: q?.pc ?? null,
          volume: q?.volLabel ?? null,
        };
      }),
    [quotes],
  );

  return (
    <WidgetFrame type="market-overview" {...props}>
      {loading && !indices.some((i) => i.price != null) ? (
        <div className="grid place-items-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {indices.map((idx) => {
            const up = (idx.changePct ?? 0) >= 0;
            const hasData = idx.price != null;

            return (
              <Link
                key={idx.sym}
                href={screenerIndexUrl(idx.sym)}
                className="block rounded-xl border border-border/50 bg-secondary/20 p-3 transition hover:border-primary/40 hover:bg-secondary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">{idx.label}</div>
                    <div className="mt-1 text-lg font-semibold tabular-nums">
                      {hasData ? fmtPrice(idx.price) : loading ? "…" : "—"}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          up ? "text-accent" : "text-destructive",
                        )}
                      >
                        {idx.change != null
                          ? `${idx.change >= 0 ? "+" : ""}${fmtMoney(Math.abs(idx.change))}`
                          : "—"}
                      </span>
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          up ? "text-accent" : "text-destructive",
                        )}
                      >
                        {idx.changePct != null ? fmtPct(idx.changePct) : ""}
                      </span>
                    </div>
                  </div>
                  {hasData ? (
                    <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-accent">
                      Live
                    </span>
                  ) : null}
                </div>

                <MiniSparkChart symbol={idx.sym} range="5D" className="mt-3" height={64} />

                {hasData ? (
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/40 pt-3">
                    <Stat label="Open" value={fmtPrice(idx.open)} />
                    <Stat label="Prev close" value={fmtPrice(idx.prevClose)} />
                    <Stat label="Day high" value={fmtPrice(idx.high)} />
                    <Stat label="Day low" value={fmtPrice(idx.low)} />
                    {idx.volume ? (
                      <div className="col-span-2">
                        <Stat label="Volume" value={idx.volume} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        {error
          ? `Quote error: ${error}`
          : "Click an index to open details in Screener · Live Yahoo Finance data"}
      </p>
    </WidgetFrame>
  );
}
