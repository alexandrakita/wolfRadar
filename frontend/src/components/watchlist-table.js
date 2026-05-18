"use client";

import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PanelSurface } from "@/components/panel-surface";
import { STOCK_UNIVERSE } from "@/data/stock-universe";
import { cn } from "@/lib/utils";

export function WatchlistTable({ symbols, quotesBySym }) {
  return (
    <PanelSurface>
      <Table containerClassName="rounded-none border-0" className="w-full">
        <TableHeader className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground [&_tr]:border-0">
          <TableRow className="border-border/60 hover:bg-transparent">
            <TableHead className="px-4 py-3 text-left font-medium">Symbol</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium">Price</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium">Change</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium">Day Range</TableHead>
            <TableHead className="px-4 py-3 text-right font-medium" />
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/60 [&_tr]:border-border/60">
          {symbols.map((sym) => {
            const q = quotesBySym[sym];
            const meta = STOCK_UNIVERSE.find((r) => r.sym === sym);
            const up = (q?.dp ?? 0) >= 0;
            return (
              <TableRow key={sym} className="border-border/60 hover:bg-secondary/30">
                <TableCell className="px-4 py-3">
                  <Link href={`/stock/${sym}`} className="flex items-center gap-3">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {sym.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{sym}</div>
                      <div className="text-xs text-muted-foreground">{meta?.name ?? "—"}</div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums">
                  {q?.c != null ? `$${q.c.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "px-4 py-3 text-right tabular-nums",
                    up ? "text-accent" : "text-destructive",
                  )}
                >
                  {q ? (
                    <span className="inline-flex items-center justify-end gap-1">
                      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {up ? "+" : ""}
                      {q.dp.toFixed(2)}%
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  {q ? `${q.l.toFixed(2)} – ${q.h.toFixed(2)}` : "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-right">
                  <FavoriteButton symbol={sym} size="sm" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </PanelSurface>
  );
}
