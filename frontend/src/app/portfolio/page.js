"use client";

import { Fragment, useMemo, useState } from "react";
import { Briefcase, DollarSign, Percent, Plus, Wallet } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardPageShell } from "@/components/dashboard-page-shell";
import { AddHoldingDialog } from "@/components/add-holding-dialog";
import { MetricTile } from "@/components/metric-tile";
import { PanelSurface } from "@/components/panel-surface";
import { PortfolioEmptyState } from "@/components/portfolio-empty-state";
import { PageHeading } from "@/components/page-heading";
import { PortfolioHoldingsTable } from "@/components/portfolio-holdings-table";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/use-quotes";
import { usePortfolio } from "@/hooks/use-portfolio";
import { STOCK_UNIVERSE } from "@/data/stock-universe";
import { fmtMoney, fmtPct } from "@/utils/formatters";
import { cn } from "@/lib/utils";
function nameFor(sym) {
  return STOCK_UNIVERSE.find(r => r.sym === sym)?.name ?? sym;
}
export default function Page() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const {
    list,
    upsert,
    remove
  } = usePortfolio();
  const symbols = useMemo(() => list.map(h => h.sym), [list]);
  const {
    quotes
  } = useQuotes(symbols);
  const rows = useMemo(() => {
    return list.map(h => {
      const q = quotes[h.sym];
      const price = q?.c ?? 0;
      const dayChg = q?.d ?? 0;
      const dayPct = q?.dp ?? 0;
      const mktValue = h.shares * price;
      const costBasis = h.shares * h.avgCost;
      const pl = mktValue - costBasis;
      const plPct = h.avgCost > 0 ? (price - h.avgCost) / h.avgCost * 100 : 0;
      const dayPL = h.shares * dayChg;
      return {
        ...h,
        name: nameFor(h.sym),
        price,
        dayChg,
        dayPct,
        mktValue,
        costBasis,
        pl,
        plPct,
        dayPL,
        hasQuote: !!q
      };
    });
  }, [list, quotes]);
  const totals = useMemo(() => {
    const totalValue = rows.reduce((s, r) => s + r.mktValue, 0);
    const totalCost = rows.reduce((s, r) => s + r.costBasis, 0);
    const totalPL = totalValue - totalCost;
    const totalPLPct = totalCost > 0 ? totalPL / totalCost * 100 : 0;
    const dayPL = rows.reduce((s, r) => s + r.dayPL, 0);
    const dayPLPct = totalValue > 0 ? dayPL / (totalValue - dayPL) * 100 : 0;
    return {
      totalValue,
      totalCost,
      totalPL,
      totalPLPct,
      dayPL,
      dayPLPct
    };
  }, [rows]);

  // Synthesize a 12-month performance series ending at the current month so
  // the chart timeline reflects "today" on the right edge.
  const performanceData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const points = [];
    const end = totals.totalValue;
    const start = totals.totalCost > 0 ? totals.totalCost : end;
    const n = 12;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const t = (n - 1 - i) / (n - 1);
      points.push({
        d: monthNames[d.getMonth()],
        v: start + (end - start) * t
      });
    }
    return points;
  }, [totals]);
  const stats = [{
    label: "Portfolio Value",
    value: fmtMoney(totals.totalValue),
    change: fmtPct(totals.totalPLPct),
    up: totals.totalPLPct >= 0,
    icon: DollarSign
  }, {
    label: "Total Return",
    value: fmtMoney(totals.totalPL),
    change: fmtPct(totals.totalPLPct),
    up: totals.totalPL >= 0,
    icon: Percent
  }, {
    label: "Day's P/L",
    value: `${totals.dayPL >= 0 ? "+" : "-"}${fmtMoney(Math.abs(totals.dayPL)).replace("-", "")}`,
    change: fmtPct(totals.dayPLPct),
    up: totals.dayPL >= 0,
    icon: Wallet
  }, {
    label: "Holdings",
    value: String(list.length),
    change: `${list.length} ${list.length === 1 ? "stock" : "stocks"}`,
    up: true,
    icon: Briefcase
  }];
  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = h => {
    setEditing(h);
    setDialogOpen(true);
  };
  const isEmpty = list.length === 0;
  return <Fragment><DashboardPageShell><PageHeading title="Portfolio" description="Overview of your holdings, returns, and performance over time." className="mb-8" actions={<Button onClick={openAdd} className="text-primary-foreground" style={{
        background: "var(--gradient-primary)",
        boxShadow: "var(--shadow-glow)"
      }}><Plus className="mr-1.5 h-4 w-4" />{"Add Holding"}</Button>} />{isEmpty ? <PortfolioEmptyState onAddHolding={openAdd} /> : <Fragment><section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(s => <MetricTile key={s.label} {...s} />)}</section><section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-border/60 p-5 lg:col-span-2" style={{
            background: "var(--gradient-card)",
            boxShadow: "var(--shadow-card)"
          }}><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{"Performance"}</h2><p className="text-sm text-muted-foreground">{"Cost basis to current value"}</p></div><div className="text-right"><div className="text-xl font-semibold">{fmtMoney(totals.totalValue)}</div><div className={cn("text-xs", totals.totalPLPct >= 0 ? "text-accent" : "text-destructive")}>{fmtPct(totals.totalPLPct)}</div></div></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData} margin={{
                  top: 10,
                  right: 10,
                  left: -20,
                  bottom: 0
                }}><defs><linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="oklch(0.78 0.16 175)" stopOpacity={0.5} /><stop offset="100%" stopColor="oklch(0.62 0.22 270)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="oklch(0.3 0.025 262)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="d" stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} /><Tooltip contentStyle={{
                    background: "oklch(0.21 0.025 262)",
                    border: "1px solid oklch(0.3 0.025 262)",
                    borderRadius: 12,
                    color: "oklch(0.97 0.005 260)"
                  }} formatter={value => [fmtMoney(value), "Value"]} /><Area type="monotone" dataKey="v" stroke="oklch(0.78 0.16 175)" strokeWidth={2.5} fill="url(#pfGrad)" /></AreaChart></ResponsiveContainer></div></div><div className="rounded-2xl border border-border/60 p-5" style={{
            background: "var(--gradient-card)",
            boxShadow: "var(--shadow-card)"
          }}><h2 className="text-lg font-semibold">{"Top Holdings"}</h2><p className="text-sm text-muted-foreground">{"By portfolio weight"}</p><div className="mt-4 space-y-3">{rows.slice().sort((a, b) => b.mktValue - a.mktValue).slice(0, 5).map(r => {
                const weight = totals.totalValue > 0 ? r.mktValue / totals.totalValue * 100 : 0;
                return <div key={r.sym} className="flex items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground" style={{
                    background: "var(--gradient-primary)"
                  }}>{r.sym.slice(0, 2)}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{r.sym}</span><span className="text-sm font-semibold tabular-nums">{weight.toFixed(1)}{"%"}</span></div><div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60"><div className="h-full rounded-full" style={{
                        width: `${Math.min(weight, 100)}%`,
                        background: "var(--gradient-primary)"
                      }} /></div></div></div>;
              })}</div></div></section><section className="mt-6"><PanelSurface><div className="px-5 py-4"><h2 className="text-lg font-semibold">{"Holdings"}</h2><p className="text-sm text-muted-foreground">{"All positions and their performance"}</p></div><PortfolioHoldingsTable rows={rows} onEdit={openEdit} onRemove={remove} /></PanelSurface></section></Fragment>}</DashboardPageShell><AddHoldingDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={upsert} initial={editing} /></Fragment>;
}
