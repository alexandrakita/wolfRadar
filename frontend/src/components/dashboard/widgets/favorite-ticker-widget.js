"use client";

import Link from "next/link";

import { MiniSparkChart } from "@/components/dashboard/mini-spark-chart";
import { TickerSearchBar } from "@/components/dashboard/ticker-search-bar";
import { WidgetFrame } from "@/components/dashboard/widget-frame";
import { WolfRatingDial } from "@/components/stock/stock-detail-blocks";
import { StockAvatar } from "@/components/stock-avatar";
import { useQuotes } from "@/hooks/use-quotes";
import { STOCK_UNIVERSE } from "@/data/stock-universe";
import { screenerSymbolUrl } from "@/utils/dashboard-links";
import { mockWolfRating } from "@/utils/dashboard-mock";
import { TOAST } from "@/constants/toast-messages";
import { toast } from "@/lib/toast";
import { fmtMoney, fmtPct } from "@/utils/formatters";
import { cn } from "@/lib/utils";

function formatCap(n) {
  if (n == null) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return fmtMoney(n);
}

export function FavoriteTickerWidget({ config, onConfigChange, ...frameProps }) {
  const symbol = (config?.symbol ?? "NVDA").toUpperCase();
  const { quotes, loading } = useQuotes([symbol]);
  const q = quotes[symbol];
  const meta = STOCK_UNIVERSE.find((r) => r.sym === symbol);
  const rating = mockWolfRating(symbol);

  return (
    <WidgetFrame
      type="favorite-ticker"
      title={symbol}
      subtitle={meta?.name ?? "Favorite ticker"}
      badge={
        <span className="rounded-md bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          Mock rating
        </span>
      }
      {...frameProps}
    >
      <TickerSearchBar
        value={symbol}
        onSelect={(sym) => {
          if (sym !== symbol) {
            onConfigChange?.({ symbol: sym });
            toast.success(TOAST.tickerUpdated(sym));
          }
        }}
        className="mb-4"
      />

      <Link href={screenerSymbolUrl(symbol)} className="block space-y-4 hover:opacity-95">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <StockAvatar symbol={symbol} className="h-10 w-10" />
            <div>
              <div className="text-2xl font-semibold tabular-nums">
                {loading && q?.c == null ? "…" : q?.c != null ? fmtMoney(q.c) : "—"}
              </div>
              <div
                className={cn(
                  "text-sm font-medium tabular-nums",
                  (q?.dp ?? 0) >= 0 ? "text-accent" : "text-destructive",
                )}
              >
                {q?.dp != null ? fmtPct(q.dp) : "—"}
              </div>
            </div>
          </div>
          <div className="origin-top-right scale-75">
            <WolfRatingDial value={rating} />
          </div>
        </div>
        <MiniSparkChart symbol={symbol} range="1M" height={120} />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-secondary/30 px-3 py-2">
            <div className="text-muted-foreground">Market Cap</div>
            <div className="mt-0.5 font-semibold tabular-nums">{formatCap(q?.mktCap)}</div>
          </div>
          <div className="rounded-lg bg-secondary/30 px-3 py-2">
            <div className="text-muted-foreground">Volume</div>
            <div className="mt-0.5 font-semibold tabular-nums">{q?.volLabel ?? "—"}</div>
          </div>
        </div>
      </Link>
    </WidgetFrame>
  );
}
