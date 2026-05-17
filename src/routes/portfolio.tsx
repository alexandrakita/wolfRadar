import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  DollarSign,
  Pencil,
  Percent,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { AddHoldingDialog } from "@/components/add-holding-dialog";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/use-quotes";
import { usePortfolio, type Holding } from "@/hooks/use-portfolio";
import { STOCK_UNIVERSE } from "@/lib/stock-universe";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — WolfRadar" },
      { name: "description", content: "Track your portfolio holdings and performance." },
    ],
  }),
  component: PortfolioPage,
});

// ── Helpers ──
function fmtMoney(n: number) {
  const s = n < 0 ? "-" : "";
  return `${s}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function fmtPct(n: number) {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

function nameFor(sym: string) {
  return STOCK_UNIVERSE.find((r) => r.sym === sym)?.name ?? sym;
}

// ── Components ──
function StatCard({
  label,
  value,
  change,
  up,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: React.ElementType;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-border/60 p-5 transition hover:border-primary/40"
      style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            up ? "text-accent" : "text-destructive",
          )}
        >
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </span>
      </div>
      <div className="mt-5 text-2xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function PortfolioPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holding | null>(null);
  const { list, upsert, remove } = usePortfolio();

  const symbols = useMemo(() => list.map((h) => h.sym), [list]);
  const { quotes } = useQuotes(symbols);

  const rows = useMemo(() => {
    return list.map((h) => {
      const q = quotes[h.sym];
      const price = q?.c ?? 0;
      const dayChg = q?.d ?? 0;
      const dayPct = q?.dp ?? 0;
      const mktValue = h.shares * price;
      const costBasis = h.shares * h.avgCost;
      const pl = mktValue - costBasis;
      const plPct = h.avgCost > 0 ? ((price - h.avgCost) / h.avgCost) * 100 : 0;
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
        hasQuote: !!q,
      };
    });
  }, [list, quotes]);

  const totals = useMemo(() => {
    const totalValue = rows.reduce((s, r) => s + r.mktValue, 0);
    const totalCost = rows.reduce((s, r) => s + r.costBasis, 0);
    const totalPL = totalValue - totalCost;
    const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const dayPL = rows.reduce((s, r) => s + r.dayPL, 0);
    const dayPLPct = totalValue > 0 ? (dayPL / (totalValue - dayPL)) * 100 : 0;
    return { totalValue, totalCost, totalPL, totalPLPct, dayPL, dayPLPct };
  }, [rows]);

  // Synthesize a 12-month performance series ending at the current month so
  // the chart timeline reflects "today" on the right edge.
  const performanceData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const points: { d: string; v: number }[] = [];
    const end = totals.totalValue;
    const start = totals.totalCost > 0 ? totals.totalCost : end;
    const n = 12;
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const t = (n - 1 - i) / (n - 1);
      points.push({ d: monthNames[d.getMonth()], v: start + (end - start) * t });
    }
    return points;
  }, [totals]);

  const stats = [
    {
      label: "Portfolio Value",
      value: fmtMoney(totals.totalValue),
      change: fmtPct(totals.totalPLPct),
      up: totals.totalPLPct >= 0,
      icon: DollarSign,
    },
    {
      label: "Total Return",
      value: fmtMoney(totals.totalPL),
      change: fmtPct(totals.totalPLPct),
      up: totals.totalPL >= 0,
      icon: Percent,
    },
    {
      label: "Day's P/L",
      value: `${totals.dayPL >= 0 ? "+" : "-"}${fmtMoney(Math.abs(totals.dayPL)).replace("-", "")}`,
      change: fmtPct(totals.dayPLPct),
      up: totals.dayPL >= 0,
      icon: Wallet,
    },
    {
      label: "Holdings",
      value: String(list.length),
      change: `${list.length} ${list.length === 1 ? "stock" : "stocks"}`,
      up: true,
      icon: Briefcase,
    },
  ];

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (h: Holding) => {
    setEditing(h);
    setDialogOpen(true);
  };

  const isEmpty = list.length === 0;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMobileMenu={() => setCollapsed((c) => !c)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Portfolio</h1>
              <p className="mt-2 text-muted-foreground">
                Overview of your holdings, returns, and performance over time.
              </p>
            </div>
            <Button
              onClick={openAdd}
              className="text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Holding
            </Button>
          </div>

          {isEmpty ? (
            <div
              className="rounded-2xl border border-border/60 p-10 text-center"
              style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
            >
              <Briefcase className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <h2 className="mt-3 text-lg font-semibold">No holdings yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a ticker, shares, and average buy price to start tracking your portfolio.
              </p>
              <Button
                onClick={openAdd}
                className="mt-5 text-primary-foreground"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add your first holding
              </Button>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((s) => (
                  <StatCard key={s.label} {...s} />
                ))}
              </section>

              {/* Chart + Holdings */}
              <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Performance chart */}
                <div
                  className="rounded-2xl border border-border/60 p-5 lg:col-span-2"
                  style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Performance</h2>
                      <p className="text-sm text-muted-foreground">Cost basis to current value</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold">{fmtMoney(totals.totalValue)}</div>
                      <div
                        className={cn(
                          "text-xs",
                          totals.totalPLPct >= 0 ? "text-accent" : "text-destructive",
                        )}
                      >
                        {fmtPct(totals.totalPLPct)}
                      </div>
                    </div>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="oklch(0.78 0.16 175)" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="oklch(0.62 0.22 270)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="oklch(0.3 0.025 262)" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="d" stroke="oklch(0.7 0.02 260)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                          stroke="oklch(0.7 0.02 260)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "oklch(0.21 0.025 262)",
                            border: "1px solid oklch(0.3 0.025 262)",
                            borderRadius: 12,
                            color: "oklch(0.97 0.005 260)",
                          }}
                          formatter={(value: number) => [fmtMoney(value), "Value"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="oklch(0.78 0.16 175)"
                          strokeWidth={2.5}
                          fill="url(#pfGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Allocation summary */}
                <div
                  className="rounded-2xl border border-border/60 p-5"
                  style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
                >
                  <h2 className="text-lg font-semibold">Top Holdings</h2>
                  <p className="text-sm text-muted-foreground">By portfolio weight</p>
                  <div className="mt-4 space-y-3">
                    {rows
                      .slice()
                      .sort((a, b) => b.mktValue - a.mktValue)
                      .slice(0, 5)
                      .map((r) => {
                        const weight =
                          totals.totalValue > 0 ? (r.mktValue / totals.totalValue) * 100 : 0;
                        return (
                          <div key={r.sym} className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold text-primary-foreground"
                              style={{ background: "var(--gradient-primary)" }}
                            >
                              {r.sym.slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium">{r.sym}</span>
                                <span className="text-sm font-semibold tabular-nums">
                                  {weight.toFixed(1)}%
                                </span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${Math.min(weight, 100)}%`,
                                    background: "var(--gradient-primary)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </section>

              {/* Holdings table */}
              <section className="mt-6">
                <div
                  className="overflow-hidden rounded-2xl border border-border/60"
                  style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
                >
                  <div className="px-5 py-4">
                    <h2 className="text-lg font-semibold">Holdings</h2>
                    <p className="text-sm text-muted-foreground">All positions and their performance</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-5 py-3 text-left font-medium">Symbol</th>
                          <th className="px-5 py-3 text-right font-medium">Shares</th>
                          <th className="px-5 py-3 text-right font-medium">Avg Cost</th>
                          <th className="px-5 py-3 text-right font-medium">Price</th>
                          <th className="px-5 py-3 text-right font-medium">Day %</th>
                          <th className="px-5 py-3 text-right font-medium">Mkt Value</th>
                          <th className="px-5 py-3 text-right font-medium">P/L ($)</th>
                          <th className="px-5 py-3 text-right font-medium">P/L (%)</th>
                          <th className="px-5 py-3 text-right font-medium"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {rows.map((r) => {
                          const up = r.pl >= 0;
                          const dayUp = r.dayPct >= 0;
                          return (
                            <tr key={r.sym} className="transition hover:bg-secondary/30">
                              <td className="px-5 py-3">
                                <Link
                                  to="/stock/$symbol"
                                  params={{ symbol: r.sym }}
                                  className="flex items-center gap-3"
                                >
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
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums">{r.shares}</td>
                              <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                                ${r.avgCost.toFixed(2)}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums">
                                {r.hasQuote ? `$${r.price.toFixed(2)}` : "—"}
                              </td>
                              <td
                                className={cn(
                                  "px-5 py-3 text-right tabular-nums",
                                  dayUp ? "text-accent" : "text-destructive",
                                )}
                              >
                                {r.hasQuote ? fmtPct(r.dayPct) : "—"}
                              </td>
                              <td className="px-5 py-3 text-right tabular-nums font-medium">
                                {r.hasQuote ? fmtMoney(r.mktValue) : "—"}
                              </td>
                              <td
                                className={cn(
                                  "px-5 py-3 text-right tabular-nums font-medium",
                                  up ? "text-accent" : "text-destructive",
                                )}
                              >
                                {r.hasQuote ? `${up ? "+" : ""}${fmtMoney(r.pl).replace("-", "-")}` : "—"}
                              </td>
                              <td
                                className={cn(
                                  "px-5 py-3 text-right tabular-nums font-medium",
                                  up ? "text-accent" : "text-destructive",
                                )}
                              >
                                {r.hasQuote ? fmtPct(r.plPct) : "—"}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEdit({ sym: r.sym, shares: r.shares, avgCost: r.avgCost })}
                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
                                    aria-label={`Edit ${r.sym}`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => remove(r.sym)}
                                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/20 hover:text-destructive"
                                    aria-label={`Remove ${r.sym}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <AddHoldingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={upsert}
        initial={editing}
      />
    </div>
  );
}
