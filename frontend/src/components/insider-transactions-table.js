"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function InsiderTransactionsTable({ rows }) {
  return (
    <Table containerClassName="rounded-none border-0" className="w-full">
      <TableHeader className="text-xs text-muted-foreground [&_tr]:border-0">
        <TableRow className="border-b border-border/60 text-left hover:bg-transparent">
          <TableHead className="px-3 py-2">Insider</TableHead>
          <TableHead className="px-3 py-2">Date</TableHead>
          <TableHead className="px-3 py-2">Code</TableHead>
          <TableHead className="px-3 py-2 text-right">Shares Δ</TableHead>
          <TableHead className="px-3 py-2 text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((t, i) => (
          <TableRow key={i} className="border-b border-border/40 hover:bg-secondary/30">
            <TableCell className="px-3 py-2">{t.name}</TableCell>
            <TableCell className="px-3 py-2 text-muted-foreground">{t.transactionDate}</TableCell>
            <TableCell className="px-3 py-2 text-muted-foreground">{t.transactionCode}</TableCell>
            <TableCell
              className={cn(
                "px-3 py-2 text-right tabular-nums",
                t.change >= 0 ? "text-accent" : "text-destructive",
              )}
            >
              {t.change >= 0 ? "+" : ""}
              {t.change.toLocaleString()}
            </TableCell>
            <TableCell className="px-3 py-2 text-right tabular-nums">
              {t.transactionPrice ? `$${t.transactionPrice.toFixed(2)}` : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
