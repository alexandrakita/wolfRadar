"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { MOVER_MODES } from "@/constants/dashboard";
import { WidgetFrame } from "@/components/dashboard/widget-frame";
import { StockAvatar } from "@/components/stock-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchMarketMovers } from "@/services/api";
import { screenerSymbolUrl } from "@/utils/dashboard-links";
import { fmtMoney, fmtPct } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function MarketMoversWidget({ config, onConfigChange, ...frameProps }) {
  const mode = config?.mode ?? "gainers";
  const modeLabel = MOVER_MODES.find((m) => m.id === mode)?.label ?? "Movers";

  const { data, isLoading } = useQuery({
    queryKey: ["movers", mode],
    queryFn: () => fetchMarketMovers(mode, 10),
    refetchInterval: 60_000,
  });

  const rows = data?.rows ?? [];

  return (
    <WidgetFrame
      type="market-movers"
      subtitle={modeLabel}
      {...frameProps}
    >
      {frameProps.editMode ? (
        <Select value={mode} onValueChange={(v) => onConfigChange?.({ mode: v })}>
          <SelectTrigger className="mb-3 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOVER_MODES.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {isLoading ? (
        <div className="grid place-items-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !rows.length ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No movers data</p>
      ) : (
        <ul className="divide-y divide-border/50">
          {rows.map((row) => {
            const up = (row.changePct ?? 0) >= 0;
            return (
              <li key={row.sym}>
                <Link
                  href={screenerSymbolUrl(row.sym)}
                  className="flex items-center gap-3 py-2.5 transition hover:bg-secondary/20"
                >
                  <StockAvatar symbol={row.sym} className="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{row.sym}</span>
                      <span className="font-semibold tabular-nums">{fmtMoney(row.price)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-muted-foreground">{row.name}</span>
                      <span
                        className={cn(
                          "font-medium tabular-nums",
                          up ? "text-accent" : "text-destructive",
                        )}
                      >
                        {fmtPct(row.changePct ?? 0)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </WidgetFrame>
  );
}
