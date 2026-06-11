"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { SECTORS } from "@/utils/dashboard-mock";
import { mockTopWolfRatingStocks } from "@/utils/dashboard-mock";
import { WidgetFrame } from "@/components/dashboard/widget-frame";
import { StockAvatar } from "@/components/stock-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { screenerSymbolUrl } from "@/utils/dashboard-links";
import { fmtMoney } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function TopWolfRatingWidget({ config, onConfigChange, ...frameProps }) {
  const [localSector, setLocalSector] = useState(config?.sector ?? "all");
  const sector = frameProps.editMode ? localSector : (config?.sector ?? "all");

  const rows = useMemo(
    () => mockTopWolfRatingStocks({ sector, ...config }),
    [sector, config],
  );

  return (
    <WidgetFrame type="top-wolf-rating" {...frameProps}>
      {frameProps.editMode ? (
        <Select
          value={sector}
          onValueChange={(v) => {
            setLocalSector(v);
            onConfigChange?.({ sector: v });
          }}
        >
          <SelectTrigger className="mb-3 h-8 text-xs">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sectors</SelectItem>
            {SECTORS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      <ul className="divide-y divide-border/50">
        {rows.map((row) => (
          <li key={row.sym}>
            <Link
              href={screenerSymbolUrl(row.sym)}
              className="flex items-center gap-3 py-2.5 transition hover:bg-secondary/20"
            >
              <StockAvatar symbol={row.sym} className="h-8 w-8" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{row.sym}</span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
                      row.rating >= 70
                        ? "bg-accent/15 text-accent"
                        : row.rating >= 40
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-destructive/15 text-destructive",
                    )}
                  >
                    {row.rating}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{row.name}</span>
                  <span className="tabular-nums">{fmtMoney(row.price)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Placeholder Wolf Rating — real formula integration pending.
      </p>
    </WidgetFrame>
  );
}
