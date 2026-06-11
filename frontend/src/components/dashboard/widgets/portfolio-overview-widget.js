"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PieChart, Pie, Cell, ResponsiveContainer as PieResponsive } from "recharts";

import { WidgetFrame } from "@/components/dashboard/widget-frame";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useQuotes } from "@/hooks/use-quotes";
import { STOCK_UNIVERSE } from "@/data/stock-universe";
import { portfolioUrl } from "@/utils/dashboard-links";
import { fmtMoney, fmtPct } from "@/utils/formatters";
import { cn } from "@/lib/utils";

const COLORS = [
  "oklch(0.78 0.16 175)",
  "oklch(0.62 0.22 270)",
  "oklch(0.72 0.18 45)",
  "oklch(0.65 0.2 25)",
  "oklch(0.7 0.12 200)",
  "oklch(0.68 0.15 320)",
];

function nameFor(sym) {
  return STOCK_UNIVERSE.find((r) => r.sym === sym)?.name ?? sym;
}

export function PortfolioOverviewWidget(props) {
  const { list } = usePortfolio();
  const symbols = useMemo(() => list.map((h) => h.sym), [list]);
  const { quotes } = useQuotes(symbols);

  const rows = useMemo(() => {
    return list.map((h) => {
      const q = quotes[h.sym];
      const price = q?.c ?? 0;
      const mktValue = h.shares * price;
      const costBasis = h.shares * h.avgCost;
      return { ...h, name: nameFor(h.sym), mktValue, costBasis, dayPL: h.shares * (q?.d ?? 0) };
    });
  }, [list, quotes]);

  const totals = useMemo(() => {
    const totalValue = rows.reduce((s, r) => s + r.mktValue, 0);
    const totalCost = rows.reduce((s, r) => s + r.costBasis, 0);
    const totalPL = totalValue - totalCost;
    const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const dayPL = rows.reduce((s, r) => s + r.dayPL, 0);
    return { totalValue, totalCost, totalPL, totalPLPct, dayPL };
  }, [rows]);

  const performanceData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const points = [];
    const end = totals.totalValue;
    const start = totals.totalCost > 0 ? totals.totalCost : end;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const t = (11 - i) / 11;
      points.push({ d: monthNames[d.getMonth()], v: start + (end - start) * t });
    }
    return points;
  }, [totals]);

  const allocation = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.mktValue, 0);
    if (!total) return [];
    return rows.map((r) => ({
      name: r.sym,
      value: Math.round((r.mktValue / total) * 100),
    }));
  }, [rows]);

  return (
    <WidgetFrame type="portfolio-overview" {...props}>
      {!list.length ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No holdings yet.</p>
          <Link href={portfolioUrl()} className="mt-2 inline-block text-sm text-accent hover:underline">
            Add holdings in Portfolio →
          </Link>
        </div>
      ) : (
        <Link href={portfolioUrl()} className="block space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <div className="text-xs text-muted-foreground">Value</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums">
                {fmtMoney(totals.totalValue)}
              </div>
            </div>
            <div className="rounded-lg bg-secondary/30 px-3 py-2">
              <div className="text-xs text-muted-foreground">Day P/L</div>
              <div
                className={cn(
                  "mt-0.5 text-lg font-semibold tabular-nums",
                  totals.dayPL >= 0 ? "text-accent" : "text-destructive",
                )}
              >
                {totals.dayPL >= 0 ? "+" : "-"}
                {fmtMoney(Math.abs(totals.dayPL)).replace("-", "")}
              </div>
            </div>
            <div className="rounded-lg bg-secondary/30 px-3 py-2 col-span-2 sm:col-span-1">
              <div className="text-xs text-muted-foreground">Total P/L</div>
              <div
                className={cn(
                  "mt-0.5 text-lg font-semibold tabular-nums",
                  totals.totalPL >= 0 ? "text-accent" : "text-destructive",
                )}
              >
                {fmtPct(totals.totalPLPct)}
              </div>
            </div>
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.3 0.025 262)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" stroke="oklch(0.7 0.02 260)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.7 0.02 260)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.21 0.025 262)",
                    border: "1px solid oklch(0.3 0.025 262)",
                    borderRadius: 12,
                  }}
                  formatter={(v) => [fmtMoney(v), "Value"]}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="oklch(0.78 0.16 175)"
                  strokeWidth={2}
                  fill="oklch(0.78 0.16 175)"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {allocation.length ? (
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 shrink-0">
                <PieResponsive width="100%" height="100%">
                  <PieChart>
                    <Pie data={allocation} dataKey="value" innerRadius={22} outerRadius={40} paddingAngle={2}>
                      {allocation.map((_, i) => (
                        <Cell key={allocation[i].name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </PieResponsive>
              </div>
              <ul className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-xs">
                {allocation.map((a, i) => (
                  <li key={a.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-medium">{a.name}</span>
                    <span className="text-muted-foreground">{a.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Link>
      )}
    </WidgetFrame>
  );
}
