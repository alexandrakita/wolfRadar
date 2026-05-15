import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  DollarSign,
  Percent,
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

// ── Mock data ──
const HOLDINGS = [
  { sym: "AAPL", name: "Apple Inc.", shares: 45, avgCost: 178.5, price: 213.25 },
  { sym: "NVDA", name: "NVIDIA Corp", shares: 22, avgCost: 412.0, price: 892.1 },
  { sym: "MSFT", name: "Microsoft Corp", shares: 18, avgCost: 315.4, price: 428.75 },
  { sym: "TSLA", name: "Tesla, Inc.", shares: 60, avgCost: 245.3, price: 177.5 },
  { sym: "AMZN", name: "Amazon.com Inc.", shares: 30, avgCost: 128.9, price: 186.45 },
  { sym: "META", name: "Meta Platforms", shares: 12, avgCost: 305.0, price: 504.2 },
  { sym: "GOOGL", name: "Alphabet Inc.", shares: 25, avgCost: 132.8, price: 178.35 },
];

const PERFORMANCE_DATA = [
  { d: "Jan", v: 42_500 },
  { d: "Feb", v: 44_200 },
  { d: "Mar", v: 43_800 },
  { d: "Apr", v: 46_100 },
  { d: "May", v: 48_350 },
  { d: "Jun", v: 47_900 },
  { d: "Jul", v: 50_200 },
  { d: "Aug", v: 52_100 },
  { d: "Sep", v: 51_400 },
  { d: "Oct", v: 53_800 },
  { d: "Nov", v: 55_200 },
  { d: "Dec", v: 57_650 },
];

// ── Helpers ──
function fmtMoney(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function fmtPct(n: number) {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
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
          {up ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
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

  const rows = useMemo(() => {
    return HOLDINGS.map((h) => {
      const mktValue = h.shares * h.price;
      const costBasis = h.shares * h.avgCost;
      const pl = mktValue - costBasis;
      const plPct = ((h.price - h.avgCost) / h.avgCost) * 100;
      return { ...h, mktValue, costBasis, pl, plPct };
    });
  }, []);

  const totals = useMemo(() => {
    const totalValue = rows.reduce((s, r) => s + r.mktValue, 0);
    const totalCost = rows.reduce((s, r) => s + r.costBasis, 0);
    const totalPL = totalValue - totalCost;
    const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    return { totalValue, totalCost, totalPL, totalPLPct };
  }, [rows]);

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
      value: "+$1,240.50",
      change: "+2.18%",
      up: true,
      icon: Wallet,
    },
    {
      label: "Holdings",
      value: String(HOLDINGS.length),
      change: "7 stocks",
      up: true,
      icon: Briefcase,
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader onMobileMenu={() => setCollapsed((c) => !c)} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Portfolio</h1>
            <p className="mt-2 text-muted-foreground">
              Overview of your holdings, returns, and performance over time.
            </p>
          </div>

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
                  <p className="text-sm text-muted-foreground">Last 12 months</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold">{fmtMoney(totals.totalValue)}</div>
                  <div className={cn("text-xs", totals.totalPLPct >= 0 ? "text-accent" : "text-destructive")}>
                    {fmtPct(totals.totalPLPct)}
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    const weight = totals.totalValue > 0 ? (r.mktValue / totals.totalValue) * 100 : 0;
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
                            <span className="text-sm font-semibold tabular-nums">{weight.toFixed(1)}%</span>
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
                      <th className="px-5 py-3 text-right font-medium">Mkt Value</th>
                      <th className="px-5 py-3 text-right font-medium">P/L ($)</th>
                      <th className="px-5 py-3 text-right font-medium">P/L (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rows.map((r) => {
                      const up = r.pl >= 0;
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
                          <td className="px-5 py-3 text-right tabular-nums">${r.price.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-medium">
                            {fmtMoney(r.mktValue)}
                          </td>
                          <td
                            className={cn(
                              "px-5 py-3 text-right tabular-nums font-medium",
                              up ? "text-accent" : "text-destructive",
                            )}
                          >
                            {up ? "+" : ""}${r.pl.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                          </td>
                          <td
                            className={cn(
                              "px-5 py-3 text-right tabular-nums font-medium",
                              up ? "text-accent" : "text-destructive",
                            )}
                          >
                            {fmtPct(r.plPct)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
