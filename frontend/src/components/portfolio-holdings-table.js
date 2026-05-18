"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtMoney, fmtPct } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export function PortfolioHoldingsTable({ rows, onEdit, onRemove }) {
  return (
    <Table containerClassName="rounded-none border-0" className="w-full">
      <TableHeader className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground [&_tr]:border-0">
        <TableRow className="border-border/60 hover:bg-transparent">
          <TableHead className="px-5 py-3 text-left font-medium">Symbol</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium">Shares</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium">Avg Cost</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium">Price</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium">Day %</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium">Mkt Value</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium">P/L ($)</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium">P/L (%)</TableHead>
          <TableHead className="px-5 py-3 text-right font-medium" />
        </TableRow>
      </TableHeader>
      <TableBody className="divide-y divide-border/60 [&_tr]:border-border/60">
        {rows.map((r) => {
          const up = r.pl >= 0;
          const dayUp = r.dayPct >= 0;
          return (
            <TableRow key={r.sym} className="border-border/60 hover:bg-secondary/30">
              <TableCell className="px-5 py-3">
                <Link href={`/stock/${r.sym}`} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    {r.sym.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium">{r.sym}</div>
                    <div className="text-xs text-muted-foreground">{r.name}</div>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="px-5 py-3 text-right tabular-nums">{r.shares}</TableCell>
              <TableCell className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                ${r.avgCost.toFixed(2)}
              </TableCell>
              <TableCell className="px-5 py-3 text-right tabular-nums">
                {r.hasQuote ? `$${r.price.toFixed(2)}` : "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "px-5 py-3 text-right tabular-nums",
                  dayUp ? "text-accent" : "text-destructive",
                )}
              >
                {r.hasQuote ? fmtPct(r.dayPct) : "—"}
              </TableCell>
              <TableCell className="px-5 py-3 text-right tabular-nums font-medium">
                {r.hasQuote ? fmtMoney(r.mktValue) : "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "px-5 py-3 text-right tabular-nums font-medium",
                  up ? "text-accent" : "text-destructive",
                )}
              >
                {r.hasQuote ? `${up ? "+" : ""}${fmtMoney(r.pl)}` : "—"}
              </TableCell>
              <TableCell
                className={cn(
                  "px-5 py-3 text-right tabular-nums font-medium",
                  up ? "text-accent" : "text-destructive",
                )}
              >
                {r.hasQuote ? fmtPct(r.plPct) : "—"}
              </TableCell>
              <TableCell className="px-5 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit({ sym: r.sym, shares: r.shares, avgCost: r.avgCost })}
                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
                    aria-label={`Edit ${r.sym}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(r.sym)}
                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
                    aria-label={`Remove ${r.sym}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
